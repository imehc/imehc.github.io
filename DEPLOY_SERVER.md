# 部署到自有服务器（华为云 ECS，2 核 1 GiB 也可）

本仓库包含两个部署目标，互不影响：

| 工作流 | 目标 | 触发 |
| --- | --- | --- |
| `.github/workflows/deploy-pages.yml` | GitHub Pages | Build and Release 成功后 / 每天定时 / 手动 |
| `.github/workflows/deploy-server.yml` | 华为云 ECS | Build and Release 成功后 / 手动 |

## 阅读约定（很重要）

本文所有命令都标明了在**哪台机器**上执行，请严格区分：

| 标记 | 指哪台机器 | 怎么判断 | 命令提示符长这样 |
| --- | --- | --- | --- |
| 🖥️ **【本地】** | 你自己的电脑（Mac） | 就是你现在打开终端的地方 | `imehc@MacBook ~ %` |
| ☁️ **【服务器】** | 华为云 ECS | 先 `ssh` 登录进去，或华为云控制台的 CloudShell / VNC | `deploy@ecs-xxxx:~$` 或 `root@ecs-xxxx:~#` |

> 判断方法：在终端里输入 `hostname`。
> 显示 `MacBook` 之类 → 你在本地；显示 `ecs-xxxx` → 你在服务器。

另外，文中出现的 **`123.45.67.89`** 是占位符，请全部替换成你自己的**服务器公网 IP**（华为云控制台 → ECS → 弹性公网 IP）。不要保留尖括号 `< >`，那是 shell 的重定向符号，会报 `parse error near '\n'`。

---

## 一、先说结论：1 GiB 的机器怎么部署

| 方案 | 是否适合 2C1G | 原因 |
| --- | --- | --- |
| **CI 构建 + rsync 上传**（已实现） | ✅ 推荐 | 服务器只存文件、跑 Nginx，内存占用约 100 MB |
| 服务器自己 `pnpm build` | ❌ 不可行 | Docusaurus + rspack 峰值内存约 2~3 GB，1 GiB 必然 OOM |
| Docker 构建 | ❌ 不可行 | 同样要跑构建，还要多一份容器开销 |
| OBS 中转 | ⚠️ 可用但多余 | 省不了多少，还多一套配置；除非以后要上 CDN |

所以工作流采用 **GitHub Actions 构建 + rsync 上传 + 软链接切换**。针对小机器和跨境链路，做了三个优化：

1. **`--link-dest` 硬链接**：未变化的文件在服务器上直接硬链接到上一版本，保留 5 个版本也只占约一份磁盘（约 200 MB）。
2. **`--checksum`**：每次构建产物的 mtime 都会变，只比 mtime 会导致每次都全量重传；改比内容校验和，未变化的文件（Cesium 静态资源、模型、贴图等大头）不再重复传输。
3. **`--partial` + 3 次重试**：跨境链路中断后可续传，不会从头再来。

## 二、准备步骤总览

| # | 做什么 | 在哪台机器 | 需要什么权限 |
| --- | --- | --- | --- |
| 1 | 加 2 GB swap | ☁️ 服务器 | `sudo` |
| 2 | 创建 `deploy` 用户、部署目录、装 rsync/nginx | ☁️ 服务器 | `sudo` |
| 3 | 生成专用密钥对 | 🖥️ 本地 | 无 |
| 4 | 把**公钥**装到服务器的 `deploy` 用户 | 🖥️ 本地（一条命令）或 ☁️ 服务器（手动粘贴） | 服务器 `sudo` |
| 5 | 验证免密登录 | 🖥️ 本地 | 无 |
| 6 | 配置 Nginx 指向 `current` | ☁️ 服务器 | `sudo` |
| 7 | 把**私钥**和 IP 填进 GitHub Secrets | 🖥️ 本地（`gh` CLI）或网页 | 仓库管理员 |

下面逐步展开。

---

## 三、服务器准备（☁️ 在服务器上执行）

先登录服务器。**这一步在本地执行**：

🖥️ **【本地】**

```bash
ssh root@123.45.67.89
# 或者用你的管理员账号：ssh admin@123.45.67.89
```

登录成功后，提示符会变成 `root@ecs-xxxx:~#` 之类，**之后的命令都在这个窗口里跑**。

> 本文命令在 **Debian 12** 和 **Ubuntu 22.04/24.04** 上完全通用。部分华为云镜像已预装 `nginx`、`rsync`，重复执行 `apt-get install` 不会出错。

### 3.1 加 2 GB swap（1 GiB 内存强烈建议）

☁️ **【服务器】**

```bash
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
# 降低 swap 倾向，只在内存真不够时用
echo 'vm.swappiness=10' | sudo tee /etc/sysctl.d/99-swap.conf
sudo sysctl --system
free -h
```

`free -h` 应该能看到 `Swap: 2.0Gi`。

### 3.2 创建部署用户、目录，安装 rsync 和 nginx

☁️ **【服务器】**

```bash
sudo adduser --disabled-password --gecos "" deploy
sudo mkdir -p /var/www/imehc/releases
sudo chown -R deploy:deploy /var/www/imehc
sudo apt-get update
sudo apt-get install -y rsync nginx
```

验证（仍然在服务器上）：

```bash
id deploy
ls -ld /var/www/imehc /var/www/imehc/releases
```

应该看到 `deploy` 用户存在，目录属主是 `deploy:deploy`。

`deploy` 用户只需要对 `/var/www/imehc` 有写权限，**不需要 sudo**。

> 注意：`deploy` 用户创建时没有密码，这没问题——密钥登录不需要密码。但也请确认 `sshd_config` 里 `PasswordAuthentication no`，避免空密码账户被尝试登录。

### 3.3 安全组

在华为云控制台 → ECS → 安全组（不是命令行），放行：

- `22`（或你自定义的 `SSH_PORT`）来自 GitHub Actions 网段（或先临时放行 `0.0.0.0/0`）
- `80` / `443` 来自 `0.0.0.0/0`

---

## 四、生成密钥并安装公钥（🖥️ 本地 + ☁️ 服务器）

这是最容易搞混的一步，请对照下面的示意图：

```
🖥️ 本地主机（你的 Mac）                    ☁️ 服务器（华为云 ECS）
──────────────────────────────        ─────────────────────────────────
~/.ssh/imehc_deploy      私钥
~/.ssh/imehc_deploy.pub  公钥 ──────→ /home/deploy/.ssh/authorized_keys
                                        （用管理员账号写入）
        │
        └──→ GitHub Secret: SSH_PRIVATE_KEY

结果：GitHub Actions 拿着私钥，以 deploy 身份免密登录服务器
```

**核心原则：公钥上服务器，私钥进 GitHub，两者永远不混。**

### 4.1 生成密钥对

🖥️ **【本地】**（先 `exit` 退出服务器，或用新开一个终端窗口）

```bash
ssh-keygen -t ed25519 -C "github-actions-deploy" -f ~/.ssh/imehc_deploy -N ""
```

会生成两个文件：

| 文件 | 是什么 | 去哪 |
| --- | --- | --- |
| `~/.ssh/imehc_deploy` | **私钥**（没有 `.pub` 后缀） | 填进 GitHub Secret `SSH_PRIVATE_KEY` |
| `~/.ssh/imehc_deploy.pub` | **公钥** | 装到服务器的 `authorized_keys` |

确认一下都在（🖥️ 本地）：

```bash
ls -l ~/.ssh/imehc_deploy ~/.ssh/imehc_deploy.pub
```

### 4.2 把公钥装到服务器

> ⚠️ 不要用 `ssh-copy-id`。上一节创建的 `deploy` 用户是 `--disabled-password`，`ssh-copy-id` 需要先以密码登录一次，会直接 `Permission denied`。另外 `ssh-copy-id deploy@<公网IP>` 里的尖括号在 zsh 里是重定向符，会报 `parse error near '\n'`。

**推荐做法：在本地一条命令完成**，用你的管理员账号把公钥写进去。

🖥️ **【本地】**（把 `admin` 换成你的管理员账号，IP 换成真实 IP）

```bash
ssh admin@123.45.67.89 "sudo install -d -m 700 -o deploy -g deploy /home/deploy/.ssh && \
  echo '$(cat ~/.ssh/imehc_deploy.pub)' | sudo tee /home/deploy/.ssh/authorized_keys > /dev/null && \
  sudo chown deploy:deploy /home/deploy/.ssh/authorized_keys && \
  sudo chmod 600 /home/deploy/.ssh/authorized_keys"
```

> 如果执行后卡住不动或提示 `sudo: a terminal is required`，给 `ssh` 加 `-t` 参数：
> `ssh -t admin@123.45.67.89 "..."`
>
> 如果提示 `Permission denied (publickey)`，说明你的管理员账号也是用密钥登录的，需要指定对应的私钥：
> `ssh -i ~/.ssh/你的管理员私钥 admin@123.45.67.89 "..."`

如果这条命令因为引号转义出问题，改用**手动方式**：

**第 1 步** — 🖥️ **【本地】** 打印公钥，复制整行输出：

```bash
cat ~/.ssh/imehc_deploy.pub
```

输出形如：

```
ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAI... github-actions-deploy
```

**第 2 步** — ☁️ **【服务器】** 用管理员账号登录后执行（把 `ssh-ed25519 AAAA...` 替换成上一步复制的内容）：

```bash
sudo install -d -m 700 -o deploy -g deploy /home/deploy/.ssh
echo 'ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAI... github-actions-deploy' | sudo tee /home/deploy/.ssh/authorized_keys
sudo chown deploy:deploy /home/deploy/.ssh/authorized_keys
sudo chmod 600 /home/deploy/.ssh/authorized_keys
```

检查结果（☁️ 服务器）：

```bash
sudo ls -l /home/deploy/.ssh/authorized_keys
sudo cat /home/deploy/.ssh/authorized_keys
```

应该是 `-rw------- deploy deploy`，内容就是你刚才的公钥那一行。

### 4.3 验证免密登录

🖥️ **【本地】**

```bash
# ip改成服务器的公网ip
ssh -i ~/.ssh/imehc_deploy -o IdentitiesOnly=yes deploy@123.45.67.89 'whoami && hostname'
```

期望输出：

```
deploy
ecs-xxxx
```

**如果还要求输密码**，按顺序排查（☁️ 服务器）：

```bash
# 1. 家目录权限不能是 777
sudo chmod 755 /home/deploy

# 2. 确认 SSH 允许公钥认证
sudo grep -E '^(PubkeyAuthentication|PasswordAuthentication)' /etc/ssh/sshd_config

# 3. 重启 SSH
sudo systemctl restart ssh
```

### 4.4 记录服务器主机指纹（可选但建议）

🖥️ **【本地】**

```bash
ssh-keyscan -H 123.45.67.89 2>/dev/null
```

把输出（形如 `|1|xxxx=|yyyy= ssh-ed25519 AAAA...`）整段存入 GitHub Secret `SSH_KNOWN_HOSTS`。

不配置时工作流使用 `accept-new`（首次连接自动信任，之后指纹变化则拒绝）；配置后使用 `StrictHostKeyChecking=yes`，更安全。

### 4.5 可选的加固：限制密钥来源

☁️ **【服务器】** 编辑 `/home/deploy/.ssh/authorized_keys`，在公钥前面加限制：

```
from="140.82.112.0/20,143.55.64.0/20,185.199.108.0/22,192.30.252.0/22",no-agent-forwarding,no-port-forwarding,no-pty ssh-ed25519 AAAA...
```

（`from=` 的网段是 GitHub Actions 出口 IP 段，可定期从 <https://api.github.com/meta> 的 `actions` 字段更新。）

---

## 五、配置 GitHub Secrets（🖥️ 本地或网页）

打开仓库 **Settings → Secrets and variables → Actions**。

### Secrets（加密，日志中不会显示）

| 名称 | 必填 | 说明 |
| --- | --- | --- |
| `SSH_HOST` | ✅ | 服务器公网 IP 或域名，例如 `123.45.67.89` |
| `SSH_PRIVATE_KEY` | ✅ | 部署**私钥**全文（仅支持密钥认证，见下一节） |
| `SSH_KNOWN_HOSTS` | 可选 | `ssh-keyscan -H 123.45.67.89` 的输出，配置后会校验服务器指纹，防中间人 |
| `CESIUM_ACCESS_TOKEN` | 可选 | Cesium ion Token；不配置时构建出的值为空 |

### Variables（明文，便于查看和修改）

| 名称 | 默认值 | 说明 |
| --- | --- | --- |
| `SSH_USER` | `deploy` | 登录用户名 |
| `SSH_PORT` | `22` | SSH 端口 |
| `DEPLOY_PATH` | `/var/www/imehc` | 服务器上的部署根目录 |
| `SITE_URL` | 空 | 站点对外地址，如 `https://example.com`（不要带结尾斜杠）。会同时用作 Docusaurus 的 `url` 和部署后健康检查地址 |

> 公网 IP 放 Secret 并没有安全收益（它本来就能被扫描到），放 Variable 更方便排查；但 `SSH_HOST` 已按你的要求放在 Secret 里，随时可改到 Variable（工作流改一行即可）。

### 5.1 用网页填私钥

🖥️ **【本地】** 先取出私钥全文：

```bash
cat ~/.ssh/imehc_deploy
```

输出形如：

```
-----BEGIN OPENSSH PRIVATE KEY-----
b3BlbnNzaC1rZXktdjEAAAAABG5vbmUAAAAEbm9uZQAAAAAAAAABAAAAMwAAAAtzc2gtZW
...几十行...
-----END OPENSSH PRIVATE KEY-----
```

把**从 `BEGIN` 到 `END` 的全部内容**（含首尾两行）粘贴进 `SSH_PRIVATE_KEY`。

> ⚠️ 不要漏掉首尾的 `-----BEGIN ...-----` / `-----END ...-----` 行，也不要只复制中间部分。粘贴时保留原样，不要手动加空行。
> 不要用 `.pub` 文件，那是公钥。

### 5.2 用 gh CLI 填（避免多行粘贴出错）

🖥️ **【本地】**

```bash
gh secret set SSH_PRIVATE_KEY --repo imehc/imehc.github.io < ~/.ssh/imehc_deploy
gh secret set SSH_HOST --repo imehc/imehc.github.io --body "123.45.67.89"
gh secret set SSH_KNOWN_HOSTS --repo imehc/imehc.github.io --body "$(ssh-keyscan -H 123.45.67.89 2>/dev/null)"
```

设置 Variables：

```bash
gh variable set SSH_USER --repo imehc/imehc.github.io --body "deploy"
gh variable set SITE_URL --repo imehc/imehc.github.io --body "https://example.com"
```

查看已配置的（不会显示值）：

```bash
gh secret list --repo imehc/imehc.github.io
gh variable list --repo imehc/imehc.github.io
```

### 5.3 验证私钥格式

🖥️ **【本地】** 工作流里也做了同样的检查，先自己确认一遍：

```bash
ssh-keygen -y -f ~/.ssh/imehc_deploy
```

能输出 `ssh-ed25519 AAAA... comment` 就说明私钥有效。报错说明文件不对（可能拿成了 `.pub`，或内容不完整）。

---

## 六、配置 Nginx（☁️ 在服务器上执行）

### 6.1 写站点配置

☁️ **【服务器】** 创建 `/etc/nginx/sites-available/imehc`：

```bash
sudo nano /etc/nginx/sites-available/imehc
```

粘贴以下内容（把 `example.com` 换成你的域名，没有域名就填 IP）：

```nginx
server {
    listen 80;
    server_name example.com;

    root /var/www/imehc/current;
    index index.html;

    # 纯静态站，不接受请求体
    client_max_body_size 1m;

    # Docusaurus 生成的是静态文件，找不到路径时回退到 404 页面
    error_page 404 /404.html;
    location = /404.html { internal; }

    # 不对外暴露以点开头的内部文件（.deployed_at 等）
    location ~ /\. {
        deny all;
        access_log off;
        log_not_found off;
    }

    location / {
        # =404 让不存在的路径返回真正的 404 状态码，再由 error_page 渲染 404.html
        try_files $uri $uri/ $uri.html =404;
    }

    # 带 hash 的静态资源可以长期缓存（文本类，走 gzip）
    location ~* \.(js|css|woff2?|png|jpe?g|gif|svg)$ {
        expires 30d;
        add_header Cache-Control "public, immutable";
        access_log off;
    }

    # 大文件只做内核 sendfile，不 gzip、不记录访问日志
    # 注意：nginx 的 regex location 先匹配先生效，所以上面不能包含 glb/wasm/bin
    location ~* \.(glb|gltf|wasm|bin|hdr|exr)$ {
        expires 30d;
        add_header Cache-Control "public, immutable";
        gzip off;
        access_log off;
    }

    gzip on;
    gzip_comp_level 5;
    gzip_min_length 1024;
    gzip_types text/css application/javascript application/json image/svg+xml text/plain;

    sendfile on;
    tcp_nopush on;
    keepalive_timeout 65;
}
```

### 6.2 启用并检查

☁️ **【服务器】**

```bash
sudo ln -sf /etc/nginx/sites-available/imehc /etc/nginx/sites-enabled/imehc
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx
sudo systemctl enable nginx
```

`sudo nginx -t` 必须输出 `syntax is ok` 和 `test is successful`。

> 1 GiB 内存下，Nginx 直接用内核 `sendfile` 发文件，不缓冲、不压缩大文件（`.glb`、`.wasm` 压缩收益低但很吃 CPU/内存）。

---

## 七、触发部署

部署会自动进行，也可以手动触发：

🖥️ **【本地】**

```bash
gh workflow run deploy-server.yml --repo imehc/imehc.github.io
gh run watch --repo imehc/imehc.github.io
```

或者网页：仓库 **Actions → Deploy to Server → Run workflow**。

之后每次部署，工作流会：

1. 在 CI 里构建；
2. `rsync` 到 `$DEPLOY_PATH/releases/<commit-sha>/`（未变化的文件硬链接到上一版）；
3. 用 `mv -Tf` 原子切换 `current` 软链接（切换瞬间不会 404）；
4. 只保留最近 5 个版本（按 `$DEPLOY_PATH/releases/*/.deployed_at` 排序），方便快速回滚。

### 回滚

☁️ **【服务器】**

```bash
cd /var/www/imehc
ls -1dt releases/*/          # 看看有哪些版本（最近的在前）
```

假设要回滚到 `releases/a1b2c3d4`（把这一串换成上面列表里的真实目录名，不要保留尖括号）：

```bash
ln -sfn releases/a1b2c3d4 .current.tmp && mv -Tf .current.tmp current
readlink current              # 确认已指向旧版本
```

---

## 八、磁盘和流量的实际预期

- `build/` 约 183 MB，压缩后约 130 MB。
- **首次部署**：全量上传，跨境链路下大约 3~10 分钟（取决于华为云出口带宽）。
- **之后每次**：只有变化的 chunk 和 HTML 需要传。Cesium 静态资源、模型、贴图基本不变，配合 `--checksum` 通常只有几 MB，1~2 分钟。
- **磁盘占用**：5 个版本硬链接共享未变化文件，实际约 200~400 MB。常见 40 GB 系统盘绰绰有余。
- **内存占用**：Nginx + SSH 常驻约 50~100 MB，1 GiB 足够；加 swap 只是兜底。

> 如果首次部署慢到无法接受，再考虑 OBS 中转（CI 传到 OBS，服务器从内网 endpoint 下载）。以目前的更新频率，不值得为此多维护一套凭证。

### 带宽小提示

华为云 ECS 的公网带宽常按 1~5 Mbps 计费。**130 MB 在 5 Mbps 下约需 3.5 分钟，1 Mbps 下约 17 分钟**。如果只是首次部署慢、后续只有几 MB，完全可以接受；若后续增量也慢，可以在安全组/带宽上临时升配，或改用 OBS 内网下载。

---

## 九、关于“公网 IP 由 GitHub token 提供”

`GITHUB_TOKEN` 是 Actions 运行时自动签发的临时令牌，不能用来存密码或 IP。你需要的其实是 **Repository Secrets**：加密存储、日志自动打码、只在工作流里以环境变量出现——上面已经按这个方式实现了。

如果你指的是**动态公网 IP**（家用宽带 / 弹性 IP 会变），华为云 ECS 的弹性公网 IP 默认固定，通常不需要处理；确实会变的话，让服务器定时把当前 IP 更新到仓库 Variable 或 DNS 记录即可。

---

## 十、安全建议

1. **只用密钥认证**，密钥只授予 `deploy` 用户，不授予 root；服务器 `PasswordAuthentication no`。
2. 在仓库里为部署建一个 **Environment**（如 `production`），配置 Required reviewers，防止误合并即上线。启用时需在 workflow 中给 job 加上 `environment: production`。
3. `SSH_HOST`、`SSH_USER` 等不要写死在 workflow 文件里，已全部通过 Secrets/Variables 注入。
4. `deploy` 用户不要加入 `sudo` 组，只拥有 `DEPLOY_PATH` 的写权限。
5. 定期轮换部署密钥；在 GitHub 上删除 Secret 后立即失效。
6. 服务器上开 `ufw` 只放行 22/80/443，并装 `fail2ban` 防止 SSH 爆破。
7. 1 GiB 机器建议再加 1~2 GB swap（见 3.1），否则系统在内存紧张时可能杀掉 Nginx。

---

## 附：常见报错对照

| 报错 | 原因 | 解决 |
| --- | --- | --- |
| `zsh: parse error near '\n'` | 命令里的 `<公网IP>` 尖括号被当成重定向 | 换成真实 IP，如 `deploy@123.45.67.89` |
| `ssh-copy-id: Permission denied` | `deploy` 用户没有密码，`ssh-copy-id` 需要密码登录 | 用管理员账号直接把公钥写进 `authorized_keys`（见 4.2） |
| 工作流报 `SSH_PRIVATE_KEY 不是有效的私钥` | 粘的是 `.pub` 公钥，或私钥内容不完整 | 用 `cat ~/.ssh/imehc_deploy`（无 `.pub`）重新复制全文 |
| 工作流报 `Permission denied (publickey)` | 公钥没装对，或家目录权限太宽 | 检查 `/home/deploy/.ssh/authorized_keys` 和 `chmod 755 /home/deploy` |
| 工作流报 `无法写入 /var/www/imehc/releases/...` | `deploy` 用户对该目录无写权限 | `sudo chown -R deploy:deploy /var/www/imehc` |
| 部署成功但访问 404 | Nginx `root` 没指向 `current`，或 `current` 未生成 | 检查 `ls -l /var/www/imehc/current` 和 `nginx -t` |
