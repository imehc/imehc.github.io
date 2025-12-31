import {
	CallbackProperty,
	Cartesian3,
	Color,
	ConstantProperty,
	type Entity,
	PolygonHierarchy,
	type Viewer,
} from "cesium";
import submerge from "./submerge";

/** 坐标点类型 */
type CoordPoint = { lng: number; lat: number } | { x: number; y: number };

/** 淹没分析配置选项 */
interface SubmergenceAnalysisOptions {
	/** Cesium Viewer 实例 */
	viewer: Viewer;
	/** 目标高度 */
	targetHeight?: number;
	/** 起始高度 */
	startHeight?: number;
	/** 当前水高度 */
	waterHeight?: number;
	/** 范围坐标 [lng1, lat1, lng2, lat2, lng3, lat3, ...] 或坐标点数组 */
	adapCoordi?: number[] | CoordPoint[];
	/** 变化速度 */
	speed?: number;
	/** 水体颜色 */
	color?: Color;
	/** 变化类型: 'up' 上升, 'down' 下降 */
	changetype?: "up" | "down";
	/** 高度变化回调函数 */
	speedCallback?: (height: number) => void;
	/** 结束回调函数 */
	endCallback?: () => void;
}

/**
 * 淹没分析类
 * 用于在Cesium场景中模拟水位上升或下降的效果
 */
class SubmergenceAnalysis {
	private viewer: Viewer;
	private targetHeight: number;
	private startHeight: number;
	private waterHeight: number;
	private adapCoordi: number[] | CoordPoint[];
	private speed: number;
	private color: Color;
	private changetype: "up" | "down";
	private speedCallback: (height: number) => void;
	private endCallback: () => void;
	private polygonEntity: Entity[];
	private timer: number | null;

	constructor(option: SubmergenceAnalysisOptions) {
		this.viewer = option.viewer;
		this.targetHeight = option.targetHeight ?? 10;
		this.startHeight = option.startHeight ?? 0;
		this.waterHeight = option.waterHeight ?? this.startHeight;
		this.adapCoordi = option.adapCoordi ?? [0, 0, 0, 0, 0, 0];
		this.speed = option.speed ?? 1;
		this.color = option.color ?? Color.fromBytes(64, 157, 253, 100);
		this.changetype = option.changetype ?? "up";
		this.speedCallback = option.speedCallback ?? (() => {});
		this.endCallback = option.endCallback ?? (() => {});
		this.polygonEntity = [];
		this.timer = null;

		if (this.viewer) {
			this.createEntity();
			this.updatePoly(this.adapCoordi);
		}
	}

	/**
	 * 创建淹没实体
	 */
	private createEntity(): void {
		// 移除已有实体
		if (this.polygonEntity.length > 0) {
			for (const entity of this.polygonEntity) {
				this.viewer.entities.remove(entity);
			}
		}
		this.polygonEntity = [];

		// 创建新的多边形实体
		const nEntity = this.viewer.entities.add({
			polygon: {
				hierarchy: new ConstantProperty(new PolygonHierarchy([])),
				material: this.color,
				// 使用 extrudedHeight 来创建立体效果
				extrudedHeight: new CallbackProperty(() => this.waterHeight, false),
			},
		});

		this.polygonEntity.push(nEntity);
	}

	/**
	 * 更新多边形坐标
	 */
	updatePoly(adapCoordi: number[] | CoordPoint[]): void {
		this.adapCoordi = adapCoordi;
		const transformedCoords = this.coordsTransformation(this.adapCoordi);

		if (this.polygonEntity.length > 0 && this.polygonEntity[0].polygon) {
			this.polygonEntity[0].polygon.hierarchy = new ConstantProperty(
				new PolygonHierarchy(transformedCoords),
			);
		}
	}

	/**
	 * 坐标转换
	 * 将各种坐标格式转换为 Cartesian3 数组
	 */
	private coordsTransformation(
		coords: number[] | CoordPoint[],
	): Cartesian3[] {
		const result: Cartesian3[] = [];

		// 如果是数字数组
		if (Array.isArray(coords) && typeof coords[0] === "number") {
			const numCoords = coords as number[];
			// 检查第一个坐标是否是经纬度范围内
			if (
				numCoords[0] < 180 &&
				numCoords[0] > -180 &&
				numCoords[1] < 90 &&
				numCoords[1] > -90
			) {
				return Cartesian3.fromDegreesArray(numCoords);
			}
			// 否则假定是笛卡尔坐标
			return [Cartesian3.fromArray(numCoords)];
		}

		// 如果是坐标点数组
		const pointCoords = coords as CoordPoint[];
		for (const point of pointCoords) {
			let p: Cartesian3;

			if ("lng" in point && "lat" in point) {
				p = Cartesian3.fromDegrees(point.lng, point.lat);
			} else if ("x" in point && "y" in point) {
				// 检查是否是经纬度
				if (
					point.x < 180 &&
					point.x > -180 &&
					point.y < 90 &&
					point.y > -90
				) {
					p = Cartesian3.fromDegrees(point.x, point.y);
				} else {
					// 假定是笛卡尔坐标
					p = point as unknown as Cartesian3;
				}
			} else {
				continue;
			}

			result.push(p);
		}

		return result;
	}

	/**
	 * 开始淹没分析动画
	 */
	start(): void {
		this.timer = window.setInterval(() => {
			const sp = this.speed / 50;

			if (this.changetype === "up") {
				// 使用精确的浮点数加法
				this.waterHeight = submerge.floatObj.add(this.waterHeight, sp);
				if (this.waterHeight >= this.targetHeight) {
					this.waterHeight = this.targetHeight;
					this.stop();
					this.endCallback();
				}
			} else {
				// 下降
				this.waterHeight = submerge.floatObj.subtract(this.waterHeight, sp);
				if (this.waterHeight <= this.targetHeight) {
					this.waterHeight = this.targetHeight;
					this.stop();
					this.endCallback();
				}
			}

			this.speedCallback(this.waterHeight);
		}, 20) as unknown as number;
	}

	/**
	 * 停止动画（不清除实体）
	 */
	private stop(): void {
		if (this.timer !== null) {
			window.clearInterval(this.timer);
			this.timer = null;
		}
	}

	/**
	 * 清除淹没分析（移除实体并停止动画）
	 */
	clear(): void {
		this.stop();
		this.waterHeight = this.startHeight;

		for (const entity of this.polygonEntity) {
			this.viewer.entities.remove(entity);
		}
		this.polygonEntity = [];
	}

	/**
	 * 重置到初始状态
	 */
	reset(): void {
		this.stop();
		this.waterHeight = this.startHeight;
	}

	/**
	 * 设置目标高度
	 */
	setTargetHeight(height: number): void {
		this.targetHeight = height;
	}

	/**
	 * 设置变化速度
	 */
	setSpeed(speed: number): void {
		this.speed = speed;
	}

	/**
	 * 设置变化类型
	 */
	setChangeType(type: "up" | "down"): void {
		this.changetype = type;
	}

	/**
	 * 获取当前水位高度
	 */
	getCurrentHeight(): number {
		return this.waterHeight;
	}
}

export default SubmergenceAnalysis;
export type { SubmergenceAnalysisOptions, CoordPoint };
