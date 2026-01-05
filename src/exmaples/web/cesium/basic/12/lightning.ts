import {
	PostProcessStage,
	type PostProcessStageCollection,
	type Viewer,
} from "cesium";

export interface LightningOptions {
	mix_factor?: number; // 混合系数 0-1 之间的数
	fall_interval?: number; // 下降间隔 0-1 之间的数
}

export default class Lightning {
	private stage: PostProcessStage | null = null;
	private collection: PostProcessStageCollection;

	constructor(viewer: Viewer) {
		this.collection = viewer.scene.postProcessStages;
	}

	/** 闪电着色器 */
	private getShader() {
		return `
            #version 300 es
            precision highp float;

            uniform sampler2D colorTexture;
            uniform float fall_interval;
            uniform float mix_factor;
            in vec2 v_textureCoordinates;
            out vec4 fragColor;

            float hash(float x)
            {
                return fract(21654.6512 * sin(385.51 * x));
            }

            float hash(vec2 p)
            {
                return fract(1654.65157 * sin(15.5134763 * p.x + 45.5173247 * p.y + 5.21789));
            }

            vec2 hash2(vec2 p)
            {
                return vec2(hash(p * 0.754), hash(1.5743 * p + 4.5476351));
            }

            vec2 add = vec2(1.0, 0.0);

            vec2 noise2(vec2 x)
            {
                vec2 p = floor(x);
                vec2 f = fract(x);
                f = f * f * (3.0 - 2.0 * f);
                vec2 res = mix(mix(hash2(p), hash2(p + add.xy), f.x),
                               mix(hash2(p + add.yx), hash2(p + add.xx), f.x), f.y);
                return res;
            }

            vec2 fbm2(vec2 x)
            {
                vec2 r = vec2(0.0);
                float a = 1.0;
                for (int i = 0; i < 8; i++)
                {
                    r += noise2(x) * a;
                    x *= 2.0;
                    a *= 0.5;
                }
                return r;
            }

            float dseg(vec2 ba, vec2 pa)
            {
                float h = clamp(dot(pa, ba) / dot(ba, ba), -0.2, 1.0);
                return length(pa - ba * h);
            }

            void main(void) {
                vec2 uv = gl_FragCoord.xy;
                float iTime = float(czm_frameNumber) * fall_interval * clamp(fall_interval * 0.1, 0.01, 0.1);
                vec2 p = uv / czm_viewport.zw;
                vec2 d;
                vec2 tgt = vec2(1.0, -1.0);
                float c = 0.0;

                if (p.y >= 0.0)
                    c = (1.0 - (fbm2((p + 0.2) * p.y + 0.1 * iTime)).x) * p.y;
                else
                    c = (1.0 - (fbm2(p + 0.2 + 0.1 * iTime)).x) * p.y * p.y;

                vec3 col = vec3(0.0);
                vec3 col1 = c * vec3(0.3, 0.5, 1.0);
                float mdist = 100000.0;
                float t = hash(floor(5.0 * iTime));
                tgt += 4.0 * hash2(tgt + t) - 1.5;

                if (hash(t + 2.3) > 0.6) {
                    for (int i = 0; i < 100; i++) {
                        vec2 dtgt = tgt - p;
                        d = 0.05 * (vec2(-0.5, -1.0) + hash2(vec2(float(i), t)));
                        float dist = dseg(d, dtgt);
                        mdist = min(mdist, dist);
                        tgt -= d;
                        c = exp(-1.2 * dist) + exp(-55.0 * mdist);
                        col = c * vec3(0.7, 0.8, 1.0);
                    }
                }

                col += col1;
                fragColor = mix(texture(colorTexture, v_textureCoordinates), vec4(col, 0.0), mix_factor);
            }
            `;
	}

	/**
	 * 创建闪电效果
	 * @param options 配置参数
	 */
	public create(options: LightningOptions = {}): PostProcessStage {
		const { mix_factor = 0.35, fall_interval = 0.8 } = options;

		this.stage = new PostProcessStage({
			name: "czm_lightning",
			fragmentShader: this.getShader(),
			uniforms: {
				mix_factor: mix_factor,
				fall_interval: fall_interval,
			},
		});

		return this.stage;
	}

	/**
	 * 添加闪电效果到场景
	 * @param options 配置参数
	 */
	public add(options: LightningOptions = {}): void {
		if (!this.stage) {
			this.create(options);
		}

		if (this.stage && !this.collection.contains(this.stage)) {
			this.collection.add(this.stage);
		}
	}

	/**
	 * 移除闪电效果
	 */
	public remove(): void {
		if (this.stage && this.collection.contains(this.stage)) {
			this.collection.remove(this.stage);
		}
	}

	/**
	 * 销毁闪电效果
	 */
	public destroy(): void {
		this.remove();
		if (this.stage) {
			this.stage = null;
		}
	}

	/**
	 * 更新闪电效果参数
	 * @param options 配置参数
	 */
	public update(options: Partial<LightningOptions>): void {
		if (!this.stage) {
			return;
		}

		if (options.mix_factor !== undefined) {
			this.stage.uniforms.mix_factor = options.mix_factor;
		}

		if (options.fall_interval !== undefined) {
			this.stage.uniforms.fall_interval = options.fall_interval;
		}
	}

	/**
	 * 获取当前效果
	 */
	public getStage(): PostProcessStage | null {
		return this.stage;
	}
}
