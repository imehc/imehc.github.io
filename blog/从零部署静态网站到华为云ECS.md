---
title: '将静态网站部署到华为云 ECS'
date: '2026-10-19'
tags: ['部署', 'GitHub Actions', 'Nginx', '华为云']
draft: false
summary: '从一台已购买好的华为云 ECS 开始，到配置 SSH 密钥、GitHub Actions 自动上传、Nginx 托管静态文件，完整走一遍静态网站的部署流程，并记录几个实际踩到的坑。'
---

静态网站（文档站、博客、官网、前端构建产物）不需要数据库，也不需要常驻的应用进程。一台最低配的云服务器，加上 Nginx 和一条自动上传的流水线，就足够稳定运行。

这篇文章假设服务器已经买好，从**第一次登录**讲到**推送代码后自动上线**，不依赖具体的构建工具，任何能产出静态文件的框架都适用。

{/* truncate */}

## 一、开始之前

先确认这几项已经就绪：

- 一台华为云 ECS，系统为 Debian 12 或 Ubuntu 22.04 LTS
- 控制台里能看到公网 IP（弹性公网 IP）
- root 密码，或者已有的管理员账号
- 安全组放行 `22`、`80`、`443`（控制台 → ECS → 安全组）
- 系统盘 40 GiB 起步即可，静态文件本身占用很小

如果 22 端口还没放行，先在安全组里加上。配置好密钥后，可以把来源收紧到自己的 IP 或 GitHub Actions 网段。

> 本文用 `123.45.67.89` 作为公网 IP 占位符，执行时替换成你自己的 IP。不要保留尖括号，zsh 会把 `<` 当成重定向。

## 二、第一次登录服务器

🖥️ **本地**

```bash
ssh root@123.45.67.89
```

第一次会让你确认主机指纹，输入 `yes`，然后输入创建服务器时设置的 root 密码。

登录后先看一眼机器状态：

```bash
hostnamectl        # 系统版本
free -h            # 内存和 swap
df -h /            # 磁盘
```

## 三、系统初始化

### 1. 加 swap（内存小于 2 GiB 建议）

```bash
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
echo 'vm.swappiness=10' | sudo tee /etc/sysctl.d/99-swap.conf
sudo sysctl --system
free -h
```

`free -h` 能看到 `Swap: 2.0Gi` 就说明生效了。

### 2. 安装 Nginx 和 rsync

```bash
sudo apt-get update
sudo apt-get install -y nginx rsync
```

### 3. 创建部署用户和目录

不要让 GitHub Actions 直接以 root 登录。单独建一个只能写部署目录的用户：

```bash
sudo adduser --disabled-password --gecos "" deploy
sudo mkdir -p /var/www/site/releases
sudo chown -R deploy:deploy /var/www/site
```

`deploy` 用户不需要密码，也不需要 sudo。它只拥有 `/var/www/site` 的写权限。

### 4. 确认 SSH 配置

```bash
sudo grep -E '^(PubkeyAuthentication|PasswordAuthentication)' /etc/ssh/sshd_config
```

`PubkeyAuthentication` 应该是 `yes`。等密钥登录验证通过后，再把 `PasswordAuthentication` 改成 `no`，重启 SSH：

```bash
sudo systemctl restart ssh
```

## 四、域名解析（可选）

如果已经买了域名，在 DNS 服务商处添加一条 A 记录：

| 类型 | 主机记录 | 记录值 |
| --- | --- | --- |
| A | `@` | 服务器公网 IP |
| A | `www` | 服务器公网 IP |

解析生效后，用 `ping your-domain.com` 确认指向正确。没有域名也可以直接用 IP 访问，后面把 `SITE_URL` 换成 `http://IP` 即可。

## 五、配置 SSH 密钥

### 1. 生成专用密钥

🖥️ **本地**

```bash
ssh-keygen -t ed25519 -C "github-actions-deploy" -f ~/.ssh/deploy_key -N ""
```

会得到两个文件：

| 文件 | 用途 |
| --- | --- |
| `~/.ssh/deploy_key` | 私钥，填进 GitHub Secret |
| `~/.ssh/deploy_key.pub` | 公钥，装到服务器 |

**公钥上服务器，私钥进 GitHub，两者不要混。**

### 2. 把公钥写到服务器

`deploy` 是 `--disabled-password` 用户，**不能用 `ssh-copy-id`**，因为它需要先密码登录一次，会直接失败。

推荐在本地用 root 一条命令完成：

```bash
ssh root@123.45.67.89 "install -d -m 700 -o deploy -g deploy /home/deploy/.ssh && \
  echo '$(cat ~/.ssh/deploy_key.pub)' > /home/deploy/.ssh/authorized_keys && \
  chown deploy:deploy /home/deploy/.ssh/authorized_keys && \
  chmod 600 /home/deploy/.ssh/authorized_keys"
```

如果提示 `sudo: a terminal is required`，给 `ssh` 加 `-t`。

### 3. 验证免密登录

🖥️ **本地**

```bash
ssh -i ~/.ssh/deploy_key -o IdentitiesOnly=yes deploy@123.45.67.89 'whoami && hostname'
```

输出 `deploy` 和服务器主机名就说明成功。如果仍然要求密码，检查：

```bash
sudo chmod 755 /home/deploy
sudo grep -E '^(PubkeyAuthentication|PasswordAuthentication)' /etc/ssh/sshd_config
sudo systemctl restart ssh
```

### 4. 记录服务器指纹（可选）

```bash
ssh-keyscan -H 123.45.67.89 2>/dev/null
```

把输出整段存到 GitHub Secret `SSH_KNOWN_HOSTS`，工作流就能校验服务器指纹，防止中间人攻击。

## 六、GitHub 仓库配置

在仓库 **Settings → Secrets and variables → Actions** 里添加：

### Secrets

| 名称 | 必填 | 说明 |
| --- | --- | --- |
| `SSH_HOST` | ✅ | 服务器公网 IP 或域名 |
| `SSH_PRIVATE_KEY` | ✅ | 私钥全文，包含 `BEGIN` / `END` 行 |
| `SSH_KNOWN_HOSTS` | 可选 | `ssh-keyscan` 的输出 |

### Variables

| 名称 | 默认值 | 说明 |
| --- | --- | --- |
| `SSH_USER` | `deploy` | 登录用户名 |
| `SSH_PORT` | `22` | SSH 端口 |
| `DEPLOY_PATH` | `/var/www/site` | 服务器部署根目录 |
| `BUILD_DIR` | `dist` | 构建产物目录 |
| `SITE_URL` | 空 | 上线后的访问地址，用于健康检查 |

用 `gh` CLI 填私钥比网页粘贴可靠：

```bash
gh secret set SSH_PRIVATE_KEY --repo <owner>/<repo> < ~/.ssh/deploy_key
gh secret set SSH_HOST --repo <owner>/<repo> --body "123.45.67.89"
gh variable set SSH_USER --repo <owner>/<repo> --body "deploy"
```

> `GITHUB_TOKEN` 是 Actions 运行时自动签发的临时令牌，不能用来存 IP 或密码。需要持久保存的配置放 Repository Secrets。

## 七、GitHub Actions 工作流

在仓库里新建 `.github/workflows/deploy.yml`：

```yaml
name: Deploy Static Site

on:
  push:
    branches: [main]
  workflow_dispatch:

concurrency:
  group: deploy
  cancel-in-progress: false

jobs:
  deploy:
    runs-on: ubuntu-latest
    timeout-minutes: 30
    env:
      SSH_HOST: ${{ secrets.SSH_HOST }}
      SSH_USER: ${{ vars.SSH_USER || 'deploy' }}
      SSH_PORT: ${{ vars.SSH_PORT || '22' }}
      DEPLOY_PATH: ${{ vars.DEPLOY_PATH || '/var/www/site' }}
      BUILD_DIR: ${{ vars.BUILD_DIR || 'dist' }}
      SITE_URL: ${{ vars.SITE_URL }}
      SSH_PRIVATE_KEY: ${{ secrets.SSH_PRIVATE_KEY }}
      SSH_KNOWN_HOSTS: ${{ secrets.SSH_KNOWN_HOSTS }}

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Build
        run: |
          # 按项目修改：npm ci && npm run build / pnpm build / hugo ...
          # 如果仓库里已经是构建好的静态文件，直接删掉这一步
          echo "在这里执行构建命令"

      - name: Deploy
        shell: bash
        run: |
          set -euo pipefail

          : "${SSH_HOST:?缺少 SSH_HOST}"
          : "${SSH_PRIVATE_KEY:?缺少 SSH_PRIVATE_KEY}"
          [ -d "$BUILD_DIR" ] || { echo "::error::找不到构建目录 $BUILD_DIR"; exit 1; }

          mkdir -p "$HOME/.ssh"
          chmod 700 "$HOME/.ssh"
          printf '%s\n' "$SSH_PRIVATE_KEY" > "$HOME/.ssh/deploy_key"
          chmod 600 "$HOME/.ssh/deploy_key"

          if ! ssh-keygen -y -f "$HOME/.ssh/deploy_key" > /dev/null 2>&1; then
            echo "::error::SSH_PRIVATE_KEY 不是有效的私钥"
            exit 1
          fi

          SSH_OPTS=(
            -p "$SSH_PORT"
            -i "$HOME/.ssh/deploy_key"
            -o IdentitiesOnly=yes
            -o ServerAliveInterval=30
            -o ConnectTimeout=20
          )

          if [ -n "${SSH_KNOWN_HOSTS:-}" ]; then
            printf '%s\n' "$SSH_KNOWN_HOSTS" > "$HOME/.ssh/known_hosts"
            chmod 600 "$HOME/.ssh/known_hosts"
            SSH_OPTS+=(-o StrictHostKeyChecking=yes -o UserKnownHostsFile="$HOME/.ssh/known_hosts")
          else
            SSH_OPTS+=(-o StrictHostKeyChecking=accept-new)
          fi

          ssh_run() {
            ssh "${SSH_OPTS[@]}" "$SSH_USER@$SSH_HOST" "$@"
          }

          RELEASES="$(ssh_run "mkdir -p '$DEPLOY_PATH/releases' && readlink -f '$DEPLOY_PATH/releases'")"
          CURRENT=""
          if ssh_run "test -d '$DEPLOY_PATH/current/'"; then
            CURRENT="$(ssh_run "readlink -f '$DEPLOY_PATH/current'")"
          fi

          RELEASE="$RELEASES/$GITHUB_SHA"
          if [ -n "$CURRENT" ] && [ "$CURRENT" = "$RELEASE" ]; then
            RELEASE="$RELEASE-r$GITHUB_RUN_ID"
          fi

          if [ -n "$CURRENT" ]; then
            echo "基于上一版本创建硬链接: $CURRENT"
            ssh_run "rm -rf '$RELEASE' && mkdir -p '$RELEASE' && cp -al '$CURRENT/.' '$RELEASE/'"
          else
            echo "首次部署，全量上传"
            ssh_run "rm -rf '$RELEASE' && mkdir -p '$RELEASE'"
          fi

          rsync -az --checksum --delete --partial --timeout=180 \
            -e "ssh -p $SSH_PORT -i $HOME/.ssh/deploy_key -o IdentitiesOnly=yes" \
            "$BUILD_DIR/" "$SSH_USER@$SSH_HOST:$RELEASE/"

          ssh_run "date +%s > '$RELEASE/.deployed_at'"
          ssh_run "bash -s -- '$RELEASE' '$DEPLOY_PATH'" <<'REMOTE'
          set -euo pipefail
          RELEASE="$1"
          DEPLOY_PATH="$2"

          # 先建临时链接再 rename，切换瞬间不会 404
          ln -sfn "$RELEASE" "$DEPLOY_PATH/.current.tmp"
          mv -Tf "$DEPLOY_PATH/.current.tmp" "$DEPLOY_PATH/current"

          cd "$(readlink -f "$DEPLOY_PATH/releases")"
          CURRENT_TARGET="$(readlink -f "$DEPLOY_PATH/current")"

          # 按 .deployed_at 保留最近 5 个版本，不删除 current 指向的目录
          KEEP=5
          SORTED="$(
            for d in */; do
              d="${d%/}"
              [ -f "$d/.deployed_at" ] || continue
              printf '%s %s\n' "$(cat "$d/.deployed_at")" "$d"
            done | sort -rn | awk -v k="$KEEP" 'NR > k { print $2 }'
          )"
          for dir in $SORTED; do
            abs="$PWD/$dir"
            [ "$abs" = "$CURRENT_TARGET" ] && continue
            rm -rf "$abs"
          done
          echo "已切换到: $(readlink "$DEPLOY_PATH/current")"
          REMOTE

      - name: Health check
        if: ${{ vars.SITE_URL != '' }}
        run: |
          curl -fsS --retry 5 --retry-delay 5 --max-time 20 "$SITE_URL" > /dev/null
```

这套流程做了几件事：

1. 每次部署生成 `releases/<commit-sha>/`，上传完成后用软链接原子切换 `current`。
2. 部署前把上一版本 `cp -al` 到新目录，未变化的文件共享 inode，不会占多份磁盘。
3. `rsync --checksum` 只传内容有变化的文件，适合跨境或小带宽链路。
4. 只保留最近 5 个版本，回滚很快。

## 八、配置 Nginx

`/etc/nginx/sites-available/site`：

```nginx
server {
    listen 80 default_server;
    listen [::]:80 default_server;
    server_name _;

    root /var/www/site/current;
    index index.html;

    client_max_body_size 1m;

    error_page 404 /404.html;
    location = /404.html { internal; }

    # 不暴露 .deployed_at 这类内部文件
    location ~ /\. {
        deny all;
        access_log off;
        log_not_found off;
    }

    location / {
        try_files $uri $uri/ $uri.html =404;
    }

    # 带 hash 的静态资源可以长期缓存
    location ~* \.(js|css|woff2?|png|jpe?g|gif|svg)$ {
        expires 30d;
        add_header Cache-Control "public, immutable";
        access_log off;
    }

    # 大文件（模型、视频等）只走 sendfile，不压缩
    location ~* \.(glb|gltf|wasm|bin|mp4|webm)$ {
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

启用并检查：

```bash
sudo ln -sf /etc/nginx/sites-available/site /etc/nginx/sites-enabled/site
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx
sudo systemctl enable nginx
```

几个关键点：

- `root` 指向 `current` 软链接，而不是某个固定版本目录。
- `try_files` 最后写 `=404`，不要写 `/404.html`，否则不存在的页面会返回 `200`（软 404）。
- 大文件不要 gzip，压缩收益低，但很吃小机器的 CPU 和内存。

## 九、部署并验证

把代码推到 `main`，或者在 Actions 页面手动触发 `Deploy Static Site`。首次部署完成后：

```bash
curl -I http://123.45.67.89/
curl -I http://123.45.67.89/一个不存在的路径
```

期望首页返回 `200`，不存在的路径返回 `404`。

也可以登录服务器确认目录结构：

```bash
ls -l /var/www/site
readlink -f /var/www/site/current
du -sh /var/www/site
```

## 十、回滚

```bash
cd /var/www/site
ls -1dt releases/*/
```

假设要回到 `releases/a1b2c3d4`：

```bash
ln -sfn releases/a1b2c3d4 .current.tmp && mv -Tf .current.tmp current
readlink current
```

软链接切换是原子的，不需要 reload Nginx。

## 十一、实际踩到的坑

### 1. `ssh-copy-id` 对无密码用户无效

`--disabled-password` 的用户没有密码，而 `ssh-copy-id` 需要先密码登录一次，必然失败。改成用 root 直接把公钥写进 `authorized_keys`。

### 2. zsh 把尖括号当重定向

```bash
ssh-copy-id deploy@<公网IP>
```

`<` 在 zsh 里是输入重定向，于是报：

```
zsh: parse error near '\n'
```

换成真实 IP，不要保留尖括号。

### 3. `rsync --link-dest` 和 `--checksum` 一起用不会硬链接

原本以为这样就能增量去重：

```bash
rsync -az --checksum --link-dest="$CURRENT/" dist/ "server:$RELEASE/"
```

实际部署两次后，磁盘占用正好翻倍。原因是 `--link-dest` 判断文件是否相同时只看 **size + mtime**，`--checksum` 不会改变这个判断。每次构建产物的 mtime 都是新的，所以所有文件都被当成「变了」：数据没有重传，但文件是新建的，硬链接没有建立。

可以这样验证：

```bash
mkdir -p /tmp/a /tmp/src /tmp/b
echo hello > /tmp/a/f
cp /tmp/a/f /tmp/src/f
touch -d "2020-01-01" /tmp/src/f
rsync -a --checksum --link-dest=/tmp/a/ /tmp/src/ /tmp/b/
stat -c '%i %n' /tmp/a/f /tmp/b/f
```

两个 inode 不一样，确认不会硬链接。

解决办法是先在服务器上把上一版硬链接到新目录，再用 `rsync --checksum` 覆盖：

```bash
rm -rf "$RELEASE" && mkdir -p "$RELEASE"
cp -al "$CURRENT/." "$RELEASE/"
rsync -az --checksum --delete --partial dist/ "server:$RELEASE/"
```

`cp -al` 瞬间完成，未变化的文件天然共享 inode。rsync 修改文件时先写临时文件再 rename，不会原地覆盖，所以上一版和线上 `current` 都不会被破坏。

### 4. `try_files` 回退到 404 页会返回 200

```nginx
try_files $uri $uri/ $uri.html /404.html;
```

这样写，访问不存在的路径会内部跳到 `/404.html` 并返回 `200`，搜索引擎会把这些页面当成正常页面收录。正确写法：

```nginx
error_page 404 /404.html;
location = /404.html { internal; }
location / {
    try_files $uri $uri/ $uri.html =404;
}
```

### 5. 带宽比磁盘更容易成为瓶颈

静态站首次上传通常是几十 MB 到几百 MB。华为云公网带宽常按 1~5 Mbps 计费，5 Mbps 下 100 MB 大约需要 3 分钟，1 Mbps 下要十几分钟。

首次部署慢是正常的；后续配合 `--checksum` 只传变化的文件，通常几十秒到一两分钟。如果增量也慢，再考虑升配带宽或用对象存储做中转。

### 6. 默认站点没删掉

Debian/Ubuntu 的 Nginx 默认启用 `sites-enabled/default`。只新增配置而不删除默认站点时，可能出现「配置改了但访问还是 Welcome to nginx」。记得：

```bash
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl reload nginx
```

## 十二、上 HTTPS（可选）

有域名后，用 certbot 一条命令即可：

```bash
sudo apt-get install -y certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com -d www.your-domain.com
```

certbot 会自动修改 Nginx 配置、申请证书，并安装续期定时任务。验证续期：

```bash
sudo certbot renew --dry-run
```

然后把 GitHub Variable `SITE_URL` 改成 `https://your-domain.com`。

## 十三、小结

整套方案的成本和资源占用：

- 一台 2 核 1~2 GiB 的 ECS，加一个 1~5 Mbps 的弹性公网 IP
- Nginx 常驻内存很小，1 GiB 机器足够
- 5 个历史版本通过硬链接共享文件，磁盘占用约等于一份产物
- 首次部署几分钟，之后增量部署通常一分钟左右
- 回滚只是切换一个软链接

如果访问量继续增长，再考虑加 CDN 或对象存储；在此之前，一台低配服务器加 Nginx 已经能稳定支撑静态站点了。
