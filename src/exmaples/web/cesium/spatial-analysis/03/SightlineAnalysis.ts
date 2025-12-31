import {
	Cartesian2,
	Cartesian3,
	Cartographic,
	Color,
	ConstantPositionProperty,
	type Entity,
	HeightReference,
	SceneTransforms,
	type Viewer,
} from "cesium";

/** 拾取结果接口 */
interface PickResult {
	/** 笛卡尔坐标（模型或地形） */
	cartesian: Cartesian3;
	/** 模型坐标 */
	CartesianModel?: Cartesian3;
	/** 地形坐标 */
	cartesianTerrain?: Cartesian3;
	/** 窗口坐标 */
	windowCoordinates: Cartesian2;
	/** 高度参考模式 */
	altitudeMode: HeightReference;
}

/** 通视分析配置选项 */
interface SightlineAnalysisOptions {
	/** Cesium Viewer 实例 */
	viewer: Viewer;
	/** 观测点坐标（笛卡尔坐标） */
	startPoint?: Cartesian3;
	/** 目的点坐标（笛卡尔坐标） */
	endPoint?: Cartesian3;
	/** 可见线段颜色 */
	visibleColor?: Color;
	/** 不可见线段颜色 */
	invisibleColor?: Color;
	/** 线段宽度 */
	lineWidth?: number;
	/** 分割段数 */
	segments?: number;
}

/** 通视分析结果 */
interface SightlineResult {
	/** 是否可见 */
	visible: boolean;
	/** 障碍点坐标（如果不可见） */
	barrierPoint: Cartesian3;
	/** 可见距离 */
	visibleDistance: number;
	/** 总距离 */
	totalDistance: number;
}

/**
 * 通视分析类
 * 用于在Cesium场景中分析两点之间是否可见，并可视化显示通视情况
 */
class SightlineAnalysis {
	private viewer: Viewer;
	private startPoint: Cartesian3;
	private endPoint: Cartesian3;
	private visibleColor: Color;
	private invisibleColor: Color;
	private lineWidth: number;
	private segments: number;

	private startEntity: Entity | null = null;
	private endEntity: Entity | null = null;
	private visibleLineEntity: Entity | null = null;
	private invisibleLineEntity: Entity | null = null;

	constructor(options: SightlineAnalysisOptions) {
		this.viewer = options.viewer;
		this.startPoint = options.startPoint;
		this.endPoint = options.endPoint;
		this.visibleColor = options.visibleColor || Color.GREEN;
		this.invisibleColor = options.invisibleColor || Color.RED;
		this.lineWidth = options.lineWidth ?? 3;
		this.segments = options.segments ?? 100;

		this.createPoints();
	}

	/**
	 * 创建观测点和目的点实体
	 */
	private createPoints(): void {
		// 创建观测点
		this.startEntity = this.viewer.entities.add({
			name: "观测点",
			position: this.startPoint,
			point: {
				pixelSize: 8,
				color: Color.RED,
				outlineColor: Color.WHITE,
				outlineWidth: 2,
			},
			label: {
				text: "观测点",
				font: "14pt sans-serif",
				outlineWidth: 2,
				outlineColor: Color.BLACK,
				fillColor: Color.WHITE,
				pixelOffset: new Cartesian2(0, -10),
			},
		});

		// 创建目的点
		this.endEntity = this.viewer.entities.add({
			name: "目的点",
			position: this.endPoint,
			point: {
				pixelSize: 8,
				color: Color.BLUE,
				outlineColor: Color.WHITE,
				outlineWidth: 2,
			},
			label: {
				text: "目的点",
				font: "14pt sans-serif",
				outlineWidth: 2,
				outlineColor: Color.BLACK,
				fillColor: Color.WHITE,
				pixelOffset: new Cartesian2(0, -10),
			},
		});
	}

	/**
	 * 执行通视分析
	 */
	analyze(): SightlineResult {
		const barrierPoint = this.sightline(this.startPoint, this.endPoint);
		const totalDistance = this.calculateSpatialDistance(
			this.startPoint,
			this.endPoint,
		);

		let visible = false;
		let visibleDistance = 0;

		// 判断是否可见
		if (barrierPoint.x === 0 && barrierPoint.y === 0 && barrierPoint.z === 0) {
			// 可见
			visible = true;
			visibleDistance = totalDistance;
			this.drawVisibleLine(this.startPoint, this.endPoint);
		} else {
			// 不可见
			visible = false;
			visibleDistance = this.calculateSpatialDistance(
				this.startPoint,
				barrierPoint,
			);
			this.drawInvisibleLine(this.startPoint, barrierPoint, this.endPoint);
		}

		return {
			visible,
			barrierPoint,
			visibleDistance,
			totalDistance,
		};
	}

	/**
	 * 通视分析核心算法
	 * 将观测点与目的点连成的线段分割成多个小段，检查每段的实际高程与理论高程
	 */
	private sightline(
		startWorldPoint: Cartesian3,
		endWorldPoint: Cartesian3,
	): Cartesian3 {
		let barrierPoint = Cartesian3.ZERO.clone();

		// 转换为屏幕坐标
		const startPoint = this.convertCartesian3ToCartesian2(startWorldPoint);
		const endPoint = this.convertCartesian3ToCartesian2(endWorldPoint);

		if (!startPoint || !endPoint) {
			return barrierPoint;
		}

		// 计算世界距离和窗口距离
		const worldLength = this.calculateSpatialDistance(
			startWorldPoint,
			endWorldPoint,
		);
		const windowLength = this.calculateWindowDistance(startPoint, endPoint);

		// 计算间隔
		const worldInterval = worldLength / this.segments;
		const windowInterval = windowLength / this.segments;

		// 逐段检查通视性
		for (let i = 1; i < this.segments; i++) {
			// 计算屏幕坐标上的中间点
			const tempWindowPoint = this.findWindowPositionByPixelInterval(
				startPoint,
				endPoint,
				windowInterval * i,
			);

			// 计算世界坐标上的理论中间点
			const tempPoint = this.findCartesian3ByDistance(
				startWorldPoint,
				endWorldPoint,
				worldInterval * i,
			);

			// 拾取该屏幕位置对应的实际地表点
			const surfacePoint = this.pickCartesian(tempWindowPoint);

			if (!surfacePoint || !surfacePoint.cartesian) {
				continue;
			}

			// 转换为地理坐标，比较高程
			const tempRad = Cartographic.fromCartesian(tempPoint);
			const surfaceRad = Cartographic.fromCartesian(surfacePoint.cartesian);

			// 如果实际高程 > 理论高程，说明有障碍物
			if (surfaceRad.height > tempRad.height) {
				barrierPoint = tempPoint;
				break;
			}
		}

		return barrierPoint;
	}

	/**
	 * 绘制可见线段（绿色）
	 */
	private drawVisibleLine(start: Cartesian3, end: Cartesian3): void {
		this.clearLines();

		this.visibleLineEntity = this.viewer.entities.add({
			polyline: {
				positions: [start, end],
				width: this.lineWidth,
				material: this.visibleColor,
				clampToGround: false,
			},
		});
	}

	/**
	 * 绘制不可见线段（绿色 + 红色）
	 */
	private drawInvisibleLine(
		start: Cartesian3,
		barrier: Cartesian3,
		end: Cartesian3,
	): void {
		this.clearLines();

		// 可见部分（绿色）
		this.visibleLineEntity = this.viewer.entities.add({
			polyline: {
				positions: [start, barrier],
				width: this.lineWidth,
				material: this.visibleColor,
				clampToGround: false,
			},
		});

		// 不可见部分（红色）
		this.invisibleLineEntity = this.viewer.entities.add({
			polyline: {
				positions: [barrier, end],
				width: this.lineWidth,
				material: this.invisibleColor,
				clampToGround: false,
			},
		});
	}

	/**
	 * 清除线段
	 */
	private clearLines(): void {
		if (this.visibleLineEntity) {
			this.viewer.entities.remove(this.visibleLineEntity);
			this.visibleLineEntity = null;
		}
		if (this.invisibleLineEntity) {
			this.viewer.entities.remove(this.invisibleLineEntity);
			this.invisibleLineEntity = null;
		}
	}

	/**
	 * 将世界坐标转换为屏幕坐标
	 */
	private convertCartesian3ToCartesian2(position: Cartesian3): Cartesian2 {
		return SceneTransforms.worldToWindowCoordinates(
			this.viewer.scene,
			position,
		);
	}

	/**
	 * 计算三维空间距离
	 */
	private calculateSpatialDistance(
		startPoint: Cartesian3,
		endPoint: Cartesian3,
	): number {
		return Math.sqrt(
			(endPoint.x - startPoint.x) ** 2 +
				(endPoint.y - startPoint.y) ** 2 +
				(endPoint.z - startPoint.z) ** 2,
		);
	}

	/**
	 * 计算窗口（2D）距离
	 */
	private calculateWindowDistance(
		startPoint: Cartesian2,
		endPoint: Cartesian2,
	): number {
		return Math.sqrt(
			(endPoint.x - startPoint.x) ** 2 + (endPoint.y - startPoint.y) ** 2,
		);
	}

	/**
	 * 根据像素间隔查找窗口位置
	 */
	private findWindowPositionByPixelInterval(
		startPosition: Cartesian2,
		endPosition: Cartesian2,
		interval: number,
	): Cartesian2 {
		const result = new Cartesian2(0, 0);
		const length = Math.sqrt(
			(endPosition.x - startPosition.x) ** 2 +
				(endPosition.y - startPosition.y) ** 2,
		);

		if (length < interval) {
			return result;
		}

		const x =
			(interval / length) * (endPosition.x - startPosition.x) + startPosition.x;
		const y =
			(interval / length) * (endPosition.y - startPosition.y) + startPosition.y;

		result.x = x;
		result.y = y;

		return result;
	}

	/**
	 * 根据距离查找笛卡尔坐标
	 */
	private findCartesian3ByDistance(
		startPosition: Cartesian3,
		endPosition: Cartesian3,
		interval: number,
	): Cartesian3 {
		const result = new Cartesian3(0, 0, 0);
		const length = Math.sqrt(
			(endPosition.x - startPosition.x) ** 2 +
				(endPosition.y - startPosition.y) ** 2 +
				(endPosition.z - startPosition.z) ** 2,
		);

		if (length < interval) {
			return result;
		}

		const x =
			(interval / length) * (endPosition.x - startPosition.x) + startPosition.x;
		const y =
			(interval / length) * (endPosition.y - startPosition.y) + startPosition.y;
		const z =
			(interval / length) * (endPosition.z - startPosition.z) + startPosition.z;

		result.x = x;
		result.y = y;
		result.z = z;

		return result;
	}

	/**
	 * 拾取笛卡尔坐标
	 */
	private pickCartesian(windowPosition: Cartesian2): PickResult | null {
		// 根据窗口坐标，从场景的深度缓冲区中拾取相应的位置
		const cartesianModel = this.viewer.scene.pickPosition(windowPosition);

		// 场景相机向指定的鼠标位置发射射线
		const ray = this.viewer.camera.getPickRay(windowPosition);
		if (!ray) {
			return null;
		}

		// 获取射线与三维球相交的点
		const cartesianTerrain = this.viewer.scene.globe.pick(
			ray,
			this.viewer.scene,
		);

		if (!cartesianModel && !cartesianTerrain) {
			return null;
		}

		const result: PickResult = {
			cartesian: cartesianModel || cartesianTerrain,
			CartesianModel: cartesianModel,
			cartesianTerrain: cartesianTerrain,
			windowCoordinates: windowPosition.clone(),
			altitudeMode: HeightReference.NONE,
		};

		// 坐标不一致，证明是模型，采用绝对高度。否则是地形，用贴地模式
		if (cartesianModel && cartesianTerrain) {
			result.altitudeMode =
				cartesianModel.z.toFixed(0) !== cartesianTerrain.z.toFixed(0)
					? HeightReference.NONE
					: HeightReference.CLAMP_TO_GROUND;
		}

		return result;
	}

	/**
	 * 更新观测点坐标
	 */
	setStartPoint(point: Cartesian3): void {
		this.startPoint = point;
		if (this.startEntity?.position) {
			this.startEntity.position = new ConstantPositionProperty(point);
		}
		this.clearLines();
	}

	/**
	 * 更新目的点坐标
	 */
	setEndPoint(point: Cartesian3): void {
		this.endPoint = point;
		if (this.endEntity?.position) {
			this.endEntity.position = new ConstantPositionProperty(point);
		}
		this.clearLines();
	}

	/**
	 * 获取观测点坐标
	 */
	getStartPoint(): Cartesian3 {
		return this.startPoint;
	}

	/**
	 * 获取目的点坐标
	 */
	getEndPoint(): Cartesian3 {
		return this.endPoint;
	}

	/**
	 * 清除所有实体
	 */
	clear(): void {
		this.clearLines();

		if (this.startEntity) {
			this.viewer.entities.remove(this.startEntity);
			this.startEntity = null;
		}

		if (this.endEntity) {
			this.viewer.entities.remove(this.endEntity);
			this.endEntity = null;
		}
	}
}

export default SightlineAnalysis;
export type { SightlineAnalysisOptions, SightlineResult, PickResult };
