import {
	Camera,
	Cartesian2,
	Cartesian3,
	Cartographic,
	Color,
	ColorGeometryInstanceAttribute,
	defined,
	EllipsoidSurfaceAppearance,
	type Entity,
	FrustumGeometry,
	FrustumOutlineGeometry,
	GeometryInstance,
	Material,
	Math as CesiumMath,
	Matrix3,
	Matrix4,
	PerInstanceColorAppearance,
	PolygonHierarchy,
	type Primitive,
	Quaternion,
	SceneMode,
	ScreenSpaceEventHandler,
	type ScreenSpaceEventHandler as ScreenSpaceEventHandlerType,
	ScreenSpaceEventType,
	Transforms,
	type Viewer,
} from "cesium";
import Hls from "hls.js";

/**
 * 视频投影模式
 */
type ProjectionMode = "frustum" | "polygon2d" | "polygon3d";

/**
 * 视频投影配置选项
 */
interface VideoProjectionOptions {
	viewer: Viewer;
	videoUrl: string;
	mode?: ProjectionMode;
	videoElementId?: string;
	onVideoReady?: (video: HTMLVideoElement) => void;
	onError?: (error: Error) => void;
}

/**
 * 视频椎体配置
 */
interface FrustumConfig {
	horizontalViewAngle: number;
	verticalViewAngle: number;
	viewPosition?: Cartesian3;
	viewPositionEnd?: Cartesian3;
}

/**
 * 多边形配置
 */
interface PolygonConfig {
	positions: Cartesian3[];
	heights?: number[];
	clampToGround?: boolean;
}

/**
 * 视频投影类
 * 支持视频椎体投影和多边形纹理投影
 */
class VideoProjection {
	private viewer: Viewer;
	private videoElement: HTMLVideoElement | null = null;
	private hls: Hls | null = null;
	private currentMode: ProjectionMode;
	private videoUrl: string;
	private videoElementId?: string;
	private entities: Entity[] = [];
	private primitives: Primitive[] = [];
	private handler: ScreenSpaceEventHandlerType | null = null;
	private onVideoReady?: (video: HTMLVideoElement) => void;
	private onError?: (error: Error) => void;

	// 视频椎体相关属性
	private lightCamera: Camera | null = null;
	private viewPosition: Cartesian3 | null = null;
	private viewPositionEnd: Cartesian3 | null = null;
	private viewDistance = 0;
	private viewHeading = 0;
	private viewPitch = 0;
	private frustumGeometry: Primitive | null = null;
	private frustumOutlineGeometry: Primitive | null = null;
	private posArray: Cartesian3[] = [];
	private state: "PREPARE" | "OPERATING" | "END" = "PREPARE";

	// 默认视频椎体配置
	private frustumConfig: FrustumConfig = {
		horizontalViewAngle: 60,
		verticalViewAngle: 40,
	};

	// 默认多边形配置
	private polygonConfig: PolygonConfig = {
		positions: [
			Cartesian3.fromDegrees(116.39, 39.9),
			Cartesian3.fromDegrees(116.4, 39.9),
			Cartesian3.fromDegrees(116.4, 39.91),
			Cartesian3.fromDegrees(116.39, 39.91),
		],
		heights: [0, 0, 500, 500],
		clampToGround: false,
	};

	constructor(options: VideoProjectionOptions) {
		this.viewer = options.viewer;
		this.videoUrl = options.videoUrl;
		this.videoElementId = options.videoElementId;
		this.currentMode = options.mode || "polygon2d";
		this.onVideoReady = options.onVideoReady;
		this.onError = options.onError;
	}

	/**
	 * 初始化视频元素
	 */
	private async initVideo(): Promise<HTMLVideoElement> {
		if (this.videoElement) {
			return this.videoElement;
		}

		// 如果提供了视频元素ID,使用已存在的元素
		if (this.videoElementId) {
			const existingVideo = document.getElementById(
				this.videoElementId,
			) as HTMLVideoElement;
			if (existingVideo) {
				this.videoElement = existingVideo;
				this.onVideoReady?.(existingVideo);
				return existingVideo;
			}
		}

		const video = document.createElement("video");
		video.setAttribute("autoplay", "");
		video.setAttribute("loop", "");
		video.setAttribute("crossorigin", "anonymous");
		video.muted = true;
		video.style.display = "none";

		// 如果是HLS流，使用hls.js
		if (this.videoUrl.endsWith(".m3u8")) {
			if (Hls.isSupported()) {
				this.hls = new Hls();
				this.hls.loadSource(this.videoUrl);
				this.hls.attachMedia(video);
				this.hls.on(Hls.Events.MANIFEST_PARSED, () => {
					video.play().catch((error) => {
						console.error("视频播放失败:", error);
						this.onError?.(error);
					});
				});
				this.hls.on(Hls.Events.ERROR, (_event, data) => {
					if (data.fatal) {
						console.error("HLS错误:", data);
						this.onError?.(new Error(data.type));
					}
				});
			} else if (video.canPlayType("application/vnd.apple.mpegurl")) {
				// Safari原生支持HLS
				video.src = this.videoUrl;
				video.addEventListener("loadedmetadata", () => {
					video.play().catch((error) => {
						console.error("视频播放失败:", error);
						this.onError?.(error);
					});
				});
			} else {
				const error = new Error("当前浏览器不支持HLS流");
				console.error(error.message);
				this.onError?.(error);
				throw error;
			}
		} else {
			// 普通视频文件
			video.src = this.videoUrl;
			video.addEventListener("loadedmetadata", () => {
				video.play().catch((error) => {
					console.error("视频播放失败:", error);
					this.onError?.(error);
				});
			});
		}

		this.videoElement = video;
		this.onVideoReady?.(video);
		return video;
	}

	/**
	 * 获取鼠标位置的三维坐标
	 */
	private getCurrentMousePosition(position: Cartesian2): Cartesian3 | undefined {
		const pickedObject = this.viewer.scene.pick(position);
		if (this.viewer.scene.pickPositionSupported && defined(pickedObject)) {
			const cartesian = this.viewer.scene.pickPosition(position);
			if (defined(cartesian)) {
				const cartographic = Cartographic.fromCartesian(cartesian);
				const height = cartographic.height;
				if (height >= 0) {
					return cartesian;
				}
				if (!defined(pickedObject.id) && height >= -500) {
					return cartesian;
				}
			}
		}

		let cartesian: Cartesian3 | undefined;
		if (this.viewer.scene.mode === SceneMode.SCENE3D) {
			const pickRay = this.viewer.camera.getPickRay(position);
			if (pickRay) {
				cartesian = this.viewer.scene.globe.pick(
					pickRay,
					this.viewer.scene,
				);
			}
		} else {
			cartesian = this.viewer.camera.pickEllipsoid(
				position,
				this.viewer.scene.globe.ellipsoid,
			);
		}
		return cartesian;
	}

	/**
	 * 获取偏航角
	 */
	private getHeading(fromPosition: Cartesian3, toPosition: Cartesian3): number {
		const finalPosition = new Cartesian3();
		const matrix4 = Transforms.eastNorthUpToFixedFrame(fromPosition);
		Matrix4.inverse(matrix4, matrix4);
		Matrix4.multiplyByPoint(matrix4, toPosition, finalPosition);
		Cartesian3.normalize(finalPosition, finalPosition);
		return CesiumMath.toDegrees(Math.atan2(finalPosition.x, finalPosition.y));
	}

	/**
	 * 获取俯仰角
	 */
	private getPitch(fromPosition: Cartesian3, toPosition: Cartesian3): number {
		const finalPosition = new Cartesian3();
		const matrix4 = Transforms.eastNorthUpToFixedFrame(fromPosition);
		Matrix4.inverse(matrix4, matrix4);
		Matrix4.multiplyByPoint(matrix4, toPosition, finalPosition);
		Cartesian3.normalize(finalPosition, finalPosition);
		return CesiumMath.toDegrees(Math.asin(finalPosition.z));
	}

	/**
	 * 创建2D多边形视频
	 */
	private async createPolygon2D(): Promise<void> {
		const video = await this.initVideo();

		const entity = this.viewer.entities.add({
			name: "2D视频多边形",
			polygon: {
				hierarchy: new PolygonHierarchy(this.polygonConfig.positions),
				material: video,
				height: 0,
			},
		});

		this.entities.push(entity);
	}

	/**
	 * 创建3D多边形视频
	 */
	private async createPolygon3D(): Promise<void> {
		const video = await this.initVideo();

		const entity = this.viewer.entities.add({
			name: "3D视频多边形",
			polygon: {
				hierarchy: {
					positions: this.polygonConfig.clampToGround
						? this.polygonConfig.positions
						: Cartesian3.fromDegreesArrayHeights(
								this.polygonConfig.positions.flatMap((pos) => {
									const cartographic = Cartographic.fromCartesian(pos);
									return [
										CesiumMath.toDegrees(cartographic.longitude),
										CesiumMath.toDegrees(cartographic.latitude),
										this.polygonConfig.heights?.[0] || 0,
									];
								}),
							),
				},
				material: video,
				perPositionHeight: !this.polygonConfig.clampToGround,
				outline: true,
			},
		});

		this.entities.push(entity);
	}

	/**
	 * 创建视频椎体投影
	 */
	private async createFrustum(): Promise<void> {
		const video = await this.initVideo();

		// 如果提供了初始位置，直接创建
		if (this.frustumConfig.viewPosition && this.frustumConfig.viewPositionEnd) {
			this.viewPosition = this.frustumConfig.viewPosition;
			this.viewPositionEnd = this.frustumConfig.viewPositionEnd;
			this.viewDistance = Cartesian3.distance(
				this.viewPosition,
				this.viewPositionEnd,
			);
			this.viewHeading = this.getHeading(
				this.viewPosition,
				this.viewPositionEnd,
			);
			this.viewPitch = this.getPitch(this.viewPosition, this.viewPositionEnd);
			this.createLightCamera();
			return;
		}

		// 否则通过点击设置位置
		this.handler = new ScreenSpaceEventHandler(this.viewer.scene.canvas);
		this.posArray = [];
		this.state = "PREPARE";

		this.handler.setInputAction((movement) => {
			const cartesian = this.getCurrentMousePosition(movement.position);
			if (!cartesian) {
				return;
			}

			if (this.posArray.length === 0) {
				this.posArray.push(cartesian);
				this.state = "OPERATING";
			} else if (this.posArray.length === 1) {
				this.viewPosition = this.posArray[0];
				this.viewPositionEnd = cartesian;
				this.viewDistance = Cartesian3.distance(
					this.viewPosition,
					this.viewPositionEnd,
				);
				this.viewHeading = this.getHeading(
					this.viewPosition,
					this.viewPositionEnd,
				);
				this.viewPitch = this.getPitch(this.viewPosition, this.viewPositionEnd);

				this.state = "END";
				if (this.handler && !this.handler.isDestroyed()) {
					this.handler.destroy();
					this.handler = null;
				}
				this.createLightCamera();
			}
		}, ScreenSpaceEventType.LEFT_CLICK);
	}

	/**
	 * 创建光源相机
	 */
	private createLightCamera(): void {
		if (!this.viewPosition) return;

		this.lightCamera = new Camera(this.viewer.scene);
		this.lightCamera.position = this.viewPosition;

		this.lightCamera.frustum.near = this.viewDistance * 0.0001;
		this.lightCamera.frustum.far = this.viewDistance;
		const hr = CesiumMath.toRadians(this.frustumConfig.horizontalViewAngle);
		const vr = CesiumMath.toRadians(this.frustumConfig.verticalViewAngle);
		const aspectRatio =
			(this.viewDistance * Math.tan(hr / 2) * 2) /
			(this.viewDistance * Math.tan(vr / 2) * 2);
		this.lightCamera.frustum.aspectRatio = aspectRatio;
		if (hr > vr) {
			this.lightCamera.frustum.fov = hr;
		} else {
			this.lightCamera.frustum.fov = vr;
		}
		this.lightCamera.setView({
			destination: this.viewPosition,
			orientation: {
				heading: CesiumMath.toRadians(this.viewHeading || 0),
				pitch: CesiumMath.toRadians(this.viewPitch || 0),
				roll: 0,
			},
		});
		this.drawFrustumOutline();
	}

	/**
	 * 绘制椎体轮廓
	 */
	private drawFrustumOutline(): void {
		if (!this.lightCamera || !this.viewPosition) return;

		const scratchRight = new Cartesian3();
		const scratchRotation = new Matrix3();
		const scratchOrientation = new Quaternion();
		const direction = this.lightCamera.directionWC;
		const up = this.lightCamera.upWC;
		let right = this.lightCamera.rightWC;
		right = Cartesian3.negate(right, scratchRight);
		const rotation = scratchRotation;
		Matrix3.setColumn(rotation, 0, right, rotation);
		Matrix3.setColumn(rotation, 1, up, rotation);
		Matrix3.setColumn(rotation, 2, direction, rotation);
		const orientation = Quaternion.fromRotationMatrix(
			rotation,
			scratchOrientation,
		);

		// 创建近裁剪面的椎体几何
		const nearFrustum = this.lightCamera.frustum.clone();
		nearFrustum.near = nearFrustum.far - 0.01;

		const videoGeometryInstance1 = new GeometryInstance({
			geometry: new FrustumGeometry({
				frustum: nearFrustum,
				origin: this.viewPosition,
				orientation,
			}),
		});

		const source = `czm_material czm_getMaterial(czm_materialInput materialInput)
      {
           czm_material material = czm_getDefaultMaterial(materialInput);
           vec2 st = materialInput.st;
           vec4 colorImage = texture2D(image, vec2(st.s, st.t));
           material.alpha = colorImage.a * 0.8;
           material.diffuse = colorImage.rgb;
           return material;
       }`;

		const material = new Material({
			fabric: {
				type: "VideoProjection",
				uniforms: {
					image: this.videoElement,
				},
				source,
			},
		});

		const p1s = this.viewer.scene.primitives.add(
			this.viewer.scene.primitives.add({
				geometryInstances: [videoGeometryInstance1],
				appearance: new EllipsoidSurfaceAppearance({
					material,
					flat: true,
					renderState: {
						cull: {
							enabled: false,
						},
						depthTest: {
							enabled: false,
						},
					},
				}),
			}),
		);

		const videoGeometryInstance2 = new GeometryInstance({
			geometry: new FrustumOutlineGeometry({
				frustum: this.lightCamera.frustum,
				origin: this.viewPosition,
				orientation,
			}),
			attributes: {
				color: ColorGeometryInstanceAttribute.fromColor(Color.BLUE),
			},
		});

		const p2s = this.viewer.scene.primitives.add(
			this.viewer.scene.primitives.add({
				geometryInstances: [videoGeometryInstance2],
				appearance: new PerInstanceColorAppearance({
					flat: true,
				}),
			}),
		);

		this.frustumGeometry = p1s;
		this.frustumOutlineGeometry = p2s;
		this.primitives.push(p1s);
		this.primitives.push(p2s);
	}

	/**
	 * 清除椎体几何
	 */
	private clearFrustum(): void {
		if (this.frustumGeometry && !this.frustumGeometry.isDestroyed()) {
			this.viewer.scene.primitives.remove(this.frustumGeometry);
			this.frustumGeometry = null;
		}
		if (
			this.frustumOutlineGeometry &&
			!this.frustumOutlineGeometry.isDestroyed()
		) {
			this.viewer.scene.primitives.remove(this.frustumOutlineGeometry);
			this.frustumOutlineGeometry = null;
		}
	}

	/**
	 * 切换投影模式
	 */
	async switchMode(mode: ProjectionMode): Promise<void> {
		if (this.currentMode === mode) {
			return;
		}

		this.clear();
		this.currentMode = mode;

		switch (mode) {
			case "frustum":
				await this.createFrustum();
				break;
			case "polygon2d":
				await this.createPolygon2D();
				break;
			case "polygon3d":
				await this.createPolygon3D();
				break;
		}
	}

	/**
	 * 开始投影
	 */
	async start(): Promise<void> {
		await this.switchMode(this.currentMode);
	}

	/**
	 * 更新视频椎体配置
	 */
	updateFrustumConfig(config: Partial<FrustumConfig>): void {
		this.frustumConfig = { ...this.frustumConfig, ...config };
		if (this.currentMode === "frustum") {
			this.clearFrustum();
			if (this.viewPosition && this.viewPositionEnd) {
				this.createLightCamera();
			}
		}
	}

	/**
	 * 更新多边形配置
	 */
	updatePolygonConfig(config: Partial<PolygonConfig>): void {
		this.polygonConfig = { ...this.polygonConfig, ...config };
		if (
			this.currentMode === "polygon2d" ||
			this.currentMode === "polygon3d"
		) {
			this.clear();
			if (this.currentMode === "polygon2d") {
				this.createPolygon2D();
			} else {
				this.createPolygon3D();
			}
		}
	}

	/**
	 * 播放视频
	 */
	play(): void {
		if (this.videoElement) {
			this.videoElement.play().catch((error) => {
				console.error("播放失败:", error);
				this.onError?.(error);
			});
		}
	}

	/**
	 * 暂停视频
	 */
	pause(): void {
		if (this.videoElement) {
			this.videoElement.pause();
		}
	}

	/**
	 * 获取视频是否正在播放
	 */
	isPlaying(): boolean {
		if (!this.videoElement) {
			return false;
		}
		return !this.videoElement.paused && !this.videoElement.ended;
	}

	/**
	 * 清除所有实体和几何
	 */
	clear(): void {
		for (const entity of this.entities) {
			this.viewer.entities.remove(entity);
		}
		this.entities.length = 0;

		for (const primitive of this.primitives) {
			if (!primitive.isDestroyed()) {
				this.viewer.scene.primitives.remove(primitive);
			}
		}
		this.primitives.length = 0;

		this.clearFrustum();

		if (this.handler && !this.handler.isDestroyed()) {
			this.handler.destroy();
			this.handler = null;
		}

		this.posArray = [];
		this.state = "PREPARE";
	}

	/**
	 * 销毁资源
	 */
	destroy(): void {
		this.clear();

		if (this.videoElement) {
			this.videoElement.pause();
			this.videoElement.src = "";
			this.videoElement = null;
		}

		if (this.hls) {
			this.hls.destroy();
			this.hls = null;
		}
	}

	/**
	 * 获取当前模式
	 */
	getMode(): ProjectionMode {
		return this.currentMode;
	}

	/**
	 * 获取视频元素
	 */
	getVideoElement(): HTMLVideoElement | null {
		return this.videoElement;
	}
}

export { VideoProjection, type VideoProjectionOptions, type ProjectionMode };
export default VideoProjection;
