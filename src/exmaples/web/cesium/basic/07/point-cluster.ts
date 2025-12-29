import {
	BillboardCollection,
	Cartesian2,
	Cartesian3,
	Math as CesiumMath,
	Color,
	defined,
	type Event,
	HorizontalOrigin,
	LabelCollection,
	LabelStyle,
	VerticalOrigin,
	type Viewer,
} from "cesium";
import type { Feature, GeoJSON, Point as GeoPoint } from "geojson";
import Supercluster from "supercluster";

// 类型定义保持不变
export type Point = {
	x: number;
	y: number;
	[key: string]: unknown;
};

type ColorItem = { num: number; size: number; color: string };

interface PointClusterOption {
	viewer: Viewer;
	results?: GeoJSON | Point[];
	/** @default 40 */
	pixelRange?: number;
	/** @default true */
	enable?: boolean;
	colorItems: Array<ColorItem>;
	img: string; // 单点时的图标
}

export default class PointCluster {
	private viewer: Viewer;
	private option: PointClusterOption;

	// 核心引擎
	private supercluster: Supercluster;

	// 渲染集合 (比DataSource底层且快得多)
	private billboards: BillboardCollection;
	private labels: LabelCollection;

	// 缓存背景圆圈的Canvas DataURL，避免重复绘制
	private circleCache: Record<string, string> = {};
	// 用于存放预加载完成的单点图片对象
	private singlePointImage: HTMLImageElement | undefined;

	// 性能优化：记录上一次渲染时的视图参数，避免静止时重复计算
	private lastViewRect: string = "";
	// 事件监听移除函数
	private removePostRenderListener: Event.RemoveCallback | undefined;

	constructor(option: PointClusterOption) {
		this.viewer = option.viewer;
		this.option = {
			pixelRange: 40, // 适当增大聚合半径以减少屏幕上的点数
			enable: true,
			...option,
		};

		// 1. 初始化集合
		// 关键：开启 scene 模式以支持深度检测优化
		this.billboards = new BillboardCollection({ scene: this.viewer.scene });
		this.labels = new LabelCollection({ scene: this.viewer.scene });
		this.viewer.scene.primitives.add(this.billboards);
		this.viewer.scene.primitives.add(this.labels);

		// 2. 初始化 Supercluster
		this.supercluster = new Supercluster({
			radius: this.option.pixelRange,
			maxZoom: 20,
		});
		// 预加载单点图片
		this.preloadSingleImage(this.option.img);

		if (option.results) {
			this.loadData(option.results);
		}

		// 3. 绑定实时渲染事件
		this.bindEvent();
	}

	/**
	 * 加载数据
	 */
	public loadData(results: GeoJSON | Point[]) {
		let points: Array<Feature<GeoPoint>> = [];

		// 1. 数据标准化为 GeoJSON Feature 数组
		if (Array.isArray(results)) {
			points = results.map((p) => ({
				type: "Feature",
				properties: { ...p }, // 保留原始属性
				geometry: { type: "Point", coordinates: [p.x, p.y] },
			}));
		} else if (results.type === "FeatureCollection") {
			points = results.features as Array<Feature<GeoPoint>>;
		}

		// 2. 载入 Supercluster
		try {
			this.supercluster.load(points);
		} catch (e) {
			console.error("Supercluster load error", e);
		}

		// 强制刷新一次
		this.lastViewRect = "";
		this.updateView();
	}

	/**
	 * 绑定帧渲染事件，实现“拖拽中实时更新”
	 */
	private bindEvent() {
		// 使用 postRender 可以在每一帧渲染后检查是否需要更新聚合
		this.removePostRenderListener =
			this.viewer.scene.postRender.addEventListener(() => {
				this.updateView();
			});
	}

	/**
	 * 核心渲染逻辑：根据当前相机状态获取聚合点并绘制
	 */
	private updateView() {
		if (!this.option.enable) return;

		// 1. 获取当前视野范围
		const rect = this.viewer.camera.computeViewRectangle();
		if (!defined(rect)) return;

		// 2. 性能检测：如果视野没变，直接跳过计算（极大节省性能）
		// 使用简单的字符串对比来检测变化
		const currentViewKey = `${rect.west.toFixed(5)}_${rect.south.toFixed(5)}_${rect.east.toFixed(5)}_${rect.north.toFixed(5)}_${this.viewer.camera.positionCartographic.height.toFixed(0)}`;
		if (this.lastViewRect === currentViewKey) {
			return;
		}
		this.lastViewRect = currentViewKey;

		// 3. 准备数据
		const bbox: [number, number, number, number] = [
			CesiumMath.toDegrees(rect.west),
			CesiumMath.toDegrees(rect.south),
			CesiumMath.toDegrees(rect.east),
			CesiumMath.toDegrees(rect.north),
		];

		// 2. 获取当前 Zoom 级别 (Supercluster 需要整数 zoom)
		// Cesium 没有直接的 zoom level，需要根据高度估算
		// 这里的算法可以根据具体地图投影微调
		const height = this.viewer.camera.positionCartographic.height;
		let zoom = Math.floor(this.heightToZoom(height));
		zoom = Math.max(0, Math.min(zoom, 20));

		// 4. 获取聚合数据
		// padding 设为 0 可以避免屏幕外的数据参与计算，提高速度，但可能导致边缘拖动时图标突然出现
		const clusters = this.supercluster.getClusters(bbox, zoom);

		// 5. 开始绘制 (使用 Image 复用技术)
		this.billboards.removeAll();
		this.labels.removeAll();

		for (const cluster of clusters) {
			const [lng, lat] = cluster.geometry.coordinates;
			const position = Cartesian3.fromDegrees(lng, lat);
			const isCluster = cluster.properties?.cluster;
			const count = cluster.properties ? cluster.properties.point_count : 1;

			if (isCluster) {
				// --- 聚合点 ---
				let styleItem = this.option.colorItems[0];
				for (let i = this.option.colorItems.length - 1; i >= 0; i--) {
					if (count >= this.option.colorItems[i].num) {
						styleItem = this.option.colorItems[i];
						break;
					}
				}

				// 添加背景圆圈
				this.billboards.add({
					position: position,
					image: this.getCircleImage(styleItem.size, styleItem.color),
					width: styleItem.size,
					height: styleItem.size,
					verticalOrigin: VerticalOrigin.CENTER,
					// 确保 billboard 在 label 后面
					eyeOffset: new Cartesian3(0, 0, 0),
				});

				// 添加数字 Label
				this.labels.add({
					position: position,
					text: String(count),
					font: 'bold 16px "Microsoft YaHei", sans-serif', // 微软雅黑通常比楷体在屏幕显示更清晰
					style: LabelStyle.FILL, // 纯白填充，或者 FILL_AND_OUTLINE
					fillColor: Color.WHITE,
					outlineColor: Color.BLACK, // 黑色描边
					outlineWidth: 2, // 描边宽度
					verticalOrigin: VerticalOrigin.CENTER,
					horizontalOrigin: HorizontalOrigin.CENTER,
					// 关键点1：微调垂直位置，(0, -1) 通常能修正字体的基线偏差
					pixelOffset: new Cartesian2(0, -1),
					// 关键点2：让 Label 的 Z 轴看起来比 Billboard 更近，确保永远覆盖在圆圈上
					eyeOffset: new Cartesian3(0, 0, -5),
					// 关键点3：禁止深度测试，确保 Label 像 UI 一样清晰，不会被地形或其他物体遮挡或虚化
					disableDepthTestDistance: Number.POSITIVE_INFINITY,
					// 缩放设置：防止离得远时字重叠
					scale: 1.0,
				});
			} else {
				// --- 单点 ---
				// 优先使用预加载好的 Image 对象，如果没有加载好（undefined），才降级使用 url 字符串
				// 注意：如果图片还没加载完，billboard 可能暂时不显示，但 onload 会触发重绘
				const imageSource = this.singlePointImage || this.option.img;

				this.billboards.add({
					position: position,
					image: imageSource, // 这里传入 Image 对象比传入 URL 字符串性能更好且稳定
					verticalOrigin: VerticalOrigin.BOTTOM,
					disableDepthTestDistance: Number.POSITIVE_INFINITY,
				});
			}
		}
	}

	/**
	 * 生成并缓存纯色圆圈图片 (不含数字)
	 */
	private getCircleImage(size: number, color: string): string {
		const key = `${size}_${color}`;
		if (this.circleCache[key]) return this.circleCache[key];
		const canvas = document.createElement("canvas");
		// 为了高清屏，Canvas 尺寸可以双倍绘制再缩小，这里保持 1:1 性能最好
		canvas.width = size;
		canvas.height = size;
		const ctx = canvas.getContext("2d");
		if (!ctx) return "";
		ctx.beginPath();
		ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2, true);
		ctx.fillStyle = color;
		ctx.fill();
		ctx.closePath();
		const url = canvas.toDataURL();
		this.circleCache[key] = url;
		return url;
	}

	/**
	 * 辅助：将高度转换为 Zoom 级别
	 * 这是一个经验公式，可能需要根据你的具体场景微调
	 */
	private heightToZoom(height: number): number {
		const A = 40487.57;
		const B = 0.0000709672;
		const C = 91610.74;
		const D = -40467.74;
		return Math.round(D + (A - D) / (1 + (height / C) ** B));
	}

	public updateData(results: GeoJSON | Point[]) {
		this.loadData(results);
	}

	public remove() {
		if (this.removePostRenderListener) {
			this.removePostRenderListener();
			this.removePostRenderListener = undefined;
		}
		this.viewer.scene.primitives.remove(this.billboards);
		this.viewer.scene.primitives.remove(this.labels);
		this.billboards = null;
		this.labels = null;
		this.circleCache = {};
	}

	private preloadSingleImage(url: string) {
		const img = new Image();
		img.src = url;
		img.onload = () => {
			// 图片加载完成后，赋值给属性
			this.singlePointImage = img;
			// 强制刷新一次视图，确保如果之前因为没图片而没显示，现在能显示出来
			this.lastViewRect = ""; // 清空缓存锁，强制更新
			this.updateView();
		};
		img.onerror = () => {
			console.error("单个点图标加载失败:", url);
		};
	}
}
