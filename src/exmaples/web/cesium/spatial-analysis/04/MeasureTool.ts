import {
	ArcType,
	CallbackProperty,
	Cartesian2,
	Cartesian3,
	Cartographic,
	Math as CesiumMath,
	Color,
	ConstantPositionProperty,
	ConstantProperty,
	EllipsoidGeodesic,
	type Entity,
	HeightReference,
	LabelStyle,
	Matrix4,
	NearFarScalar,
	PolylineArrowMaterialProperty,
	PolylineDashMaterialProperty,
	PolylineOutlineMaterialProperty,
	ScreenSpaceEventHandler,
	type ScreenSpaceEventHandler as ScreenSpaceEventHandlerType,
	ScreenSpaceEventType,
	Transforms,
	VerticalOrigin,
	type Viewer,
} from "cesium";

/**
 * 测量工具配置选项
 */
interface MeasureToolOptions {
	viewer: Viewer;
	terrainProvider?: unknown;
	onMeasureStart?: () => void;
	onMeasureEnd?: () => void;
}

/**
 * 测量结果
 */
interface MeasureResult {
	distance?: number;
	area?: number;
	height?: number;
	angle?: number;
}

/**
 * 测量工具类
 * 支持空间距离、地表距离、地表面积、高度差、三角测量和方位角测量
 */
class MeasureTool {
	private viewer: Viewer;
	private terrainProvider?: unknown;
	private handler: ScreenSpaceEventHandlerType | null = null;
	private measureIds: string[] = [];
	private bMeasuring = false;
	private onMeasureStart?: () => void;
	private onMeasureEnd?: () => void;

	constructor(options: MeasureToolOptions) {
		this.viewer = options.viewer;
		this.terrainProvider = options.terrainProvider;
		this.onMeasureStart = options.onMeasureStart;
		this.onMeasureEnd = options.onMeasureEnd;
	}

	/**
	 * 空间距离测量
	 * 测量两点之间的直线距离（不考虑地形）
	 */
	measureLineSpace(): void {
		this.bMeasuring = true;
		this.onMeasureStart?.();

		const positions: Cartesian3[] = [];
		let poly: Entity | null = null;
		let distance = 0;

		this.handler = new ScreenSpaceEventHandler(this.viewer.scene.canvas);

		// 监听鼠标移动事件
		this.handler.setInputAction((movement) => {
			// 获取鼠标位置的三维坐标
			let cartesian = this.viewer.scene.pickPosition(movement.endPosition);
			if (!cartesian) {
				const ray = this.viewer.camera.getPickRay(movement.endPosition);
				if (ray) {
					cartesian = this.viewer.scene.globe.pick(ray, this.viewer.scene);
				}
			}

			if (cartesian && positions.length >= 2) {
				if (!poly) {
					// 创建线实体
					poly = this.createPolyline(positions, Color.CHARTREUSE, 2);
				} else {
					positions.pop();
					positions.push(cartesian);
				}
			}
		}, ScreenSpaceEventType.MOUSE_MOVE);

		// 监听单击事件
		this.handler.setInputAction((movement) => {
			let cartesian = this.viewer.scene.pickPosition(movement.position);
			if (!cartesian) {
				const ray = this.viewer.camera.getPickRay(movement.position);
				if (ray) {
					cartesian = this.viewer.scene.globe.pick(ray, this.viewer.scene);
				}
			}

			if (cartesian) {
				if (positions.length === 0) {
					positions.push(cartesian.clone());
				}
				positions.push(cartesian);

				// 计算距离增量
				const distanceAdd = Number.parseFloat(this.getSpaceDistance(positions));
				distance += distanceAdd;

				// 添加标注
				const textDistance =
					(distance > 1000
						? `${(distance / 1000).toFixed(3)}千米`
						: `${distance.toFixed(2)}米`) +
					`\n(+${
						distanceAdd > 1000
							? `${(distanceAdd / 1000).toFixed(3)}千米`
							: `${distanceAdd.toFixed(2)}米`
					})`;

				const entity = this.viewer.entities.add({
					name: "空间直线距离",
					position: positions[positions.length - 1],
					point: {
						pixelSize: 5,
						color: Color.RED,
						outlineColor: Color.WHITE,
						outlineWidth: 2,
						heightReference: HeightReference.NONE,
					},
					label: {
						text: textDistance,
						font: "18px sans-serif",
						fillColor: Color.CHARTREUSE,
						style: LabelStyle.FILL_AND_OUTLINE,
						outlineWidth: 2,
						verticalOrigin: VerticalOrigin.BOTTOM,
						pixelOffset: new Cartesian2(20, -20),
						disableDepthTestDistance: Number.POSITIVE_INFINITY,
						heightReference: HeightReference.NONE,
					},
				});
				this.measureIds.push(entity.id);
			}
		}, ScreenSpaceEventType.LEFT_CLICK);

		// 监听右键结束测量
		this.handler.setInputAction(() => {
			this.finishMeasure();
		}, ScreenSpaceEventType.RIGHT_CLICK);
	}

	/**
	 * 地表距离测量
	 * 测量沿地形表面的距离
	 */
	measureGroundDistance(): void {
		this.bMeasuring = true;
		this.onMeasureStart?.();
		this.viewer.scene.globe.depthTestAgainstTerrain = true;

		const positions: Cartesian3[] = [];
		let poly: Entity | null = null;
		const distance = 0;

		this.handler = new ScreenSpaceEventHandler(this.viewer.scene.canvas);

		// 监听鼠标移动事件
		this.handler.setInputAction((movement) => {
			let cartesian = this.viewer.scene.pickPosition(movement.endPosition);
			if (!cartesian) {
				const ray = this.viewer.camera.getPickRay(movement.endPosition);
				if (ray) {
					cartesian = this.viewer.scene.globe.pick(ray, this.viewer.scene);
				}
			}

			if (cartesian) {
				// 采样地形高度
				const p = Cartographic.fromCartesian(cartesian);
				p.height = this.viewer.scene.sampleHeight(p);
				cartesian =
					this.viewer.scene.globe.ellipsoid.cartographicToCartesian(p);

				if (positions.length >= 2) {
					if (!poly) {
						poly = this.createGroundPolyline(positions);
					} else {
						positions.pop();
						positions.push(cartesian);
					}
				}
			}
		}, ScreenSpaceEventType.MOUSE_MOVE);

		// 监听单击事件
		this.handler.setInputAction((movement) => {
			let cartesian = this.viewer.scene.pickPosition(movement.position);
			if (!cartesian) {
				const ray = this.viewer.camera.getPickRay(movement.position);
				if (ray) {
					cartesian = this.viewer.scene.globe.pick(ray, this.viewer.scene);
				}
			}

			if (cartesian) {
				// 采样地形高度
				const p = Cartographic.fromCartesian(cartesian);
				p.height = this.viewer.scene.sampleHeight(p);
				cartesian =
					this.viewer.scene.globe.ellipsoid.cartographicToCartesian(p);

				if (positions.length === 0) {
					positions.push(cartesian.clone());
				}
				positions.push(cartesian);
				this.calculateGroundDistance(positions, distance);
			}
		}, ScreenSpaceEventType.LEFT_CLICK);

		// 监听右键结束测量
		this.handler.setInputAction(() => {
			this.finishMeasure();
		}, ScreenSpaceEventType.RIGHT_CLICK);
	}

	/**
	 * 创建线实体
	 */
	private createPolyline(
		positions: Cartesian3[],
		color: Color,
		width: number,
	): Entity {
		const entity = this.viewer.entities.add({
			name: "直线",
			polyline: {
				show: true,
				positions: new CallbackProperty(() => positions, false),
				arcType: ArcType.NONE,
				material: color,
				width: width,
			},
		});
		this.measureIds.push(entity.id);
		return entity;
	}

	/**
	 * 创建贴地线实体
	 */
	private createGroundPolyline(positions: Cartesian3[]): Entity {
		const entity = this.viewer.entities.add({
			name: "直线",
			polyline: {
				show: true,
				positions: new CallbackProperty(() => positions, false),
				material: Color.GOLD,
				width: 2,
				clampToGround: true,
			},
		});
		this.measureIds.push(entity.id);
		return entity;
	}

	/**
	 * 计算空间距离
	 */
	private getSpaceDistance(positions: Cartesian3[]): string {
		let distance = 0;
		if (positions.length > 2) {
			const point1cartographic = Cartographic.fromCartesian(
				positions[positions.length - 3],
			);
			const point2cartographic = Cartographic.fromCartesian(
				positions[positions.length - 2],
			);

			// 根据经纬度计算出距离
			const geodesic = new EllipsoidGeodesic();
			geodesic.setEndPoints(point1cartographic, point2cartographic);
			const s = geodesic.surfaceDistance;

			// 返回两点之间的距离（包含高度差）
			distance = Math.sqrt(
				s ** 2 + (point2cartographic.height - point1cartographic.height) ** 2,
			);
		}
		return distance.toFixed(2);
	}

	/**
	 * 计算地表距离
	 */
	private calculateGroundDistance(
		positions: Cartesian3[],
		distance: number,
	): void {
		if (positions.length > 2) {
			const positions_: Cartographic[] = [];
			const sp = Cartographic.fromCartesian(positions[positions.length - 3]);
			const ep = Cartographic.fromCartesian(positions[positions.length - 2]);
			const geodesic = new EllipsoidGeodesic();
			geodesic.setEndPoints(sp, ep);
			const s = geodesic.surfaceDistance;

			positions_.push(sp);
			let num = Math.floor(s / 100);
			num = num > 200 ? 200 : num;
			num = num < 20 ? 20 : num;

			// 插值获取中间点
			for (let i = 1; i < num; i++) {
				const res = geodesic.interpolateUsingSurfaceDistance(
					(s / num) * i,
					new Cartographic(),
				);
				res.height = this.viewer.scene.sampleHeight(res);
				positions_.push(res);
			}
			positions_.push(ep);

			// 计算总距离
			let distanceAdd = 0;
			for (let ii = 0; ii < positions_.length - 1; ii++) {
				geodesic.setEndPoints(positions_[ii], positions_[ii + 1]);
				const d = geodesic.surfaceDistance;
				distanceAdd += Math.sqrt(
					d ** 2 + (positions_[ii + 1].height - positions_[ii].height) ** 2,
				);
			}

			distance += distanceAdd;

			// 添加标注
			const textDistance =
				(distance > 1000
					? `${(distance / 1000).toFixed(3)}千米`
					: `${distance.toFixed(2)}米`) +
				`\n(+${
					distanceAdd > 1000
						? `${(distanceAdd / 1000).toFixed(3)}千米`
						: `${distanceAdd.toFixed(2)}米`
				})`;

			const entity = this.viewer.entities.add({
				name: "地表距离",
				position: positions[positions.length - 1],
				point: {
					pixelSize: 5,
					color: Color.RED,
					outlineColor: Color.WHITE,
					outlineWidth: 2,
				},
				label: {
					text: textDistance,
					font: "18px sans-serif",
					fillColor: Color.GOLD,
					style: LabelStyle.FILL_AND_OUTLINE,
					outlineWidth: 2,
					verticalOrigin: VerticalOrigin.BOTTOM,
					disableDepthTestDistance: Number.POSITIVE_INFINITY,
					pixelOffset: new Cartesian2(20, -20),
				},
			});
			this.measureIds.push(entity.id);
		}
	}

	/**
	 * 结束测量
	 */
	private finishMeasure(): void {
		if (this.handler && !this.handler.isDestroyed()) {
			this.handler.destroy();
			this.handler = null;
		}
		this.bMeasuring = false;
		this.onMeasureEnd?.();
	}

	/**
	 * 清除所有测量结果
	 */
	clear(): void {
		// 删除所有实体
		for (const id of this.measureIds) {
			this.viewer.entities.removeById(id);
		}
		this.measureIds.length = 0;

		// 销毁事件处理器
		if (this.handler && !this.handler.isDestroyed()) {
			this.handler.destroy();
			this.handler = null;
		}

		this.bMeasuring = false;
		this.onMeasureEnd?.();
	}

	/**
	 * 地表面积测量
	 * 测量多边形区域的面积
	 */
	measureAreaSpace(): void {
		this.bMeasuring = true;
		this.onMeasureStart?.();

		const positions: Cartesian3[] = [];
		const tempPoints: Array<{ lon: number; lat: number; hei: number }> = [];
		let polygon: Entity | null = null;

		this.handler = new ScreenSpaceEventHandler(this.viewer.scene.canvas);

		// 监听鼠标移动事件
		this.handler.setInputAction((movement) => {
			let cartesian = this.viewer.scene.pickPosition(movement.endPosition);
			if (!cartesian) {
				const ray = this.viewer.camera.getPickRay(movement.endPosition);
				if (ray) {
					cartesian = this.viewer.scene.globe.pick(ray, this.viewer.scene);
				}
			}

			if (cartesian && positions.length >= 2) {
				if (!polygon) {
					polygon = this.createPolygon(positions);
				} else {
					positions.pop();
					positions.push(cartesian);
				}
			}
		}, ScreenSpaceEventType.MOUSE_MOVE);

		// 监听单击事件
		this.handler.setInputAction((movement) => {
			let cartesian = this.viewer.scene.pickPosition(movement.position);
			if (!cartesian) {
				const ray = this.viewer.camera.getPickRay(movement.position);
				if (ray) {
					cartesian = this.viewer.scene.globe.pick(ray, this.viewer.scene);
				}
			}

			if (cartesian) {
				if (positions.length === 0) {
					positions.push(cartesian.clone());
				}
				positions.push(cartesian);

				// 记录经纬度高度
				const cartographic = Cartographic.fromCartesian(
					positions[positions.length - 1],
				);
				const longitudeString = CesiumMath.toDegrees(cartographic.longitude);
				const latitudeString = CesiumMath.toDegrees(cartographic.latitude);
				const heightString = cartographic.height;
				tempPoints.push({
					lon: longitudeString,
					lat: latitudeString,
					hei: heightString,
				});

				// 添加点标记
				const entity = this.viewer.entities.add({
					name: "多边形面积",
					position: positions[positions.length - 1],
					point: {
						pixelSize: 3,
						color: Color.RED,
						outlineColor: Color.WHITE,
						outlineWidth: 2,
						heightReference: HeightReference.CLAMP_TO_GROUND,
					},
				});
				this.measureIds.push(entity.id);
			}
		}, ScreenSpaceEventType.LEFT_CLICK);

		// 监听右键结束测量
		this.handler.setInputAction(() => {
			if (this.handler && !this.handler.isDestroyed()) {
				this.handler.destroy();
				this.handler = null;
			}
			positions.pop();

			// 计算面积
			const area = this.getArea(tempPoints, positions);
			let areaText: string;
			if (area < 0.001) {
				areaText = `${(area * 1000000).toFixed(4)}平方米`;
			} else {
				areaText = `${area.toFixed(4)}平方公里`;
			}

			// 添加面积标注
			const entity = this.viewer.entities.add({
				name: "多边形面积",
				position: positions[positions.length - 1],
				label: {
					text: areaText,
					font: "18px sans-serif",
					fillColor: Color.CYAN,
					style: LabelStyle.FILL_AND_OUTLINE,
					outlineWidth: 2,
					verticalOrigin: VerticalOrigin.BOTTOM,
					pixelOffset: new Cartesian2(20, -40),
					disableDepthTestDistance: Number.POSITIVE_INFINITY,
					heightReference: HeightReference.CLAMP_TO_GROUND,
				},
			});
			this.measureIds.push(entity.id);

			this.bMeasuring = false;
			this.onMeasureEnd?.();
		}, ScreenSpaceEventType.RIGHT_CLICK);
	}

	/**
	 * 高度差测量
	 * 测量两点之间的高度差
	 */
	measureAltitude(): void {
		this.bMeasuring = true;
		this.onMeasureStart?.();

		const trianArr: number[] = [];
		let distanceLineNum = 0;
		let Line1: Entity | undefined;
		let Line2: Entity | undefined;
		let H: Entity | undefined;

		this.handler = new ScreenSpaceEventHandler(this.viewer.scene.canvas);

		// 监听鼠标移动事件
		this.handler.setInputAction((movement) => {
			let cartesian = this.viewer.scene.pickPosition(movement.endPosition);
			if (!cartesian) {
				const ray = this.viewer.camera.getPickRay(movement.endPosition);
				if (ray) {
					cartesian = this.viewer.scene.globe.pick(ray, this.viewer.scene);
				}
			}

			if (cartesian && distanceLineNum === 1) {
				const cartographic = Cartographic.fromCartesian(cartesian);
				const lon = CesiumMath.toDegrees(cartographic.longitude);
				const lat = CesiumMath.toDegrees(cartographic.latitude);
				const mouseHeight = cartographic.height;
				trianArr.length = 3;
				trianArr.push(lon, lat, mouseHeight);
				const result = this.drawAltitudeTriangle(trianArr, Line1, Line2, H);
				Line1 = result.Line1;
				Line2 = result.Line2;
				H = result.H;
			}
		}, ScreenSpaceEventType.MOUSE_MOVE);

		// 监听单击事件
		this.handler.setInputAction((movement) => {
			let cartesian = this.viewer.scene.pickPosition(movement.position);
			if (!cartesian) {
				const ray = this.viewer.camera.getPickRay(movement.position);
				if (ray) {
					cartesian = this.viewer.scene.globe.pick(ray, this.viewer.scene);
				}
			}

			if (cartesian) {
				const cartographic = Cartographic.fromCartesian(cartesian);
				const lon = CesiumMath.toDegrees(cartographic.longitude);
				const lat = CesiumMath.toDegrees(cartographic.latitude);
				const mouseHeight = cartographic.height;

				// 添加点标记
				const entity = this.viewer.entities.add({
					name: "高度差",
					position: cartesian,
					point: {
						pixelSize: 3,
						color: Color.RED,
						outlineColor: Color.WHITE,
						outlineWidth: 2,
						heightReference: HeightReference.CLAMP_TO_GROUND,
					},
				});
				this.measureIds.push(entity.id);

				distanceLineNum++;
				if (distanceLineNum === 1) {
					trianArr.push(lon, lat, mouseHeight);
				} else {
					trianArr.length = 3;
					trianArr.push(lon, lat, mouseHeight);
					this.finishMeasure();
					const result = this.drawAltitudeTriangle(trianArr, Line1, Line2, H);
					Line1 = result.Line1;
					Line2 = result.Line2;
					H = result.H;
				}
			}
		}, ScreenSpaceEventType.LEFT_CLICK);

		// 监听右键取消测量
		this.handler.setInputAction(() => {
			this.finishMeasure();
		}, ScreenSpaceEventType.RIGHT_CLICK);
	}

	/**
	 * 三角测量
	 * 测量两点之间的水平距离、高度差和空间距离
	 */
	measureTriangle(): void {
		this.bMeasuring = true;
		this.onMeasureStart?.();

		const trianArr: number[] = [];
		let distanceLineNum = 0;
		let XLine: Entity | undefined;
		let X: Entity | undefined;
		let Y: Entity | undefined;
		let H: Entity | undefined;

		this.handler = new ScreenSpaceEventHandler(this.viewer.scene.canvas);

		// 监听鼠标移动事件
		this.handler.setInputAction((movement) => {
			let cartesian = this.viewer.scene.pickPosition(movement.endPosition);
			if (!cartesian) {
				const ray = this.viewer.camera.getPickRay(movement.endPosition);
				if (ray) {
					cartesian = this.viewer.scene.globe.pick(ray, this.viewer.scene);
				}
			}

			if (cartesian && distanceLineNum === 1) {
				const cartographic = Cartographic.fromCartesian(cartesian);
				const lon = CesiumMath.toDegrees(cartographic.longitude);
				const lat = CesiumMath.toDegrees(cartographic.latitude);
				const mouseHeight = cartographic.height;
				trianArr.length = 3;
				trianArr.push(lon, lat, mouseHeight);
				const result = this.drawTriangle(trianArr, XLine, X, Y, H);
				XLine = result.XLine;
				X = result.X;
				Y = result.Y;
				H = result.H;
			}
		}, ScreenSpaceEventType.MOUSE_MOVE);

		// 监听单击事件
		this.handler.setInputAction((movement) => {
			let cartesian = this.viewer.scene.pickPosition(movement.position);
			if (!cartesian) {
				const ray = this.viewer.camera.getPickRay(movement.position);
				if (ray) {
					cartesian = this.viewer.scene.globe.pick(ray, this.viewer.scene);
				}
			}

			if (cartesian) {
				const cartographic = Cartographic.fromCartesian(cartesian);
				const lon = CesiumMath.toDegrees(cartographic.longitude);
				const lat = CesiumMath.toDegrees(cartographic.latitude);
				const mouseHeight = cartographic.height;

				// 添加点标记
				const entity = this.viewer.entities.add({
					name: "三角测量",
					position: cartesian,
					point: {
						pixelSize: 3,
						color: Color.RED,
						outlineColor: Color.WHITE,
						outlineWidth: 2,
						heightReference: HeightReference.CLAMP_TO_GROUND,
					},
				});
				this.measureIds.push(entity.id);

				distanceLineNum++;
				if (distanceLineNum === 1) {
					trianArr.push(lon, lat, mouseHeight);
				} else {
					trianArr.length = 3;
					trianArr.push(lon, lat, mouseHeight);
					this.finishMeasure();
					const result = this.drawTriangle(trianArr, XLine, X, Y, H);
					XLine = result.XLine;
					X = result.X;
					Y = result.Y;
					H = result.H;
				}
			}
		}, ScreenSpaceEventType.LEFT_CLICK);

		// 监听右键取消测量
		this.handler.setInputAction(() => {
			this.finishMeasure();
		}, ScreenSpaceEventType.RIGHT_CLICK);
	}

	/**
	 * 方位角测量
	 * 测量两点之间的方位角和距离
	 */
	measureAngle(): void {
		this.bMeasuring = true;
		this.onMeasureStart?.();

		const pArr: Cartesian3[] = [];
		let distanceLineNum = 0;
		let Line1: Entity | undefined;
		let Line2: Entity | undefined;
		let angleT: Entity | undefined;

		this.handler = new ScreenSpaceEventHandler(this.viewer.scene.canvas);

		// 监听鼠标移动事件
		this.handler.setInputAction((movement) => {
			let cartesian = this.viewer.scene.pickPosition(movement.endPosition);
			if (!cartesian) {
				const ray = this.viewer.camera.getPickRay(movement.endPosition);
				if (ray) {
					cartesian = this.viewer.scene.globe.pick(ray, this.viewer.scene);
				}
			}

			if (cartesian && distanceLineNum === 1) {
				pArr.length = 1;
				pArr.push(cartesian);
				const result = this.drawAngle(pArr, Line1, Line2, angleT);
				Line1 = result.Line1;
				Line2 = result.Line2;
				angleT = result.angleT;
			}
		}, ScreenSpaceEventType.MOUSE_MOVE);

		// 监听单击事件
		this.handler.setInputAction((movement) => {
			let cartesian = this.viewer.scene.pickPosition(movement.position);
			if (!cartesian) {
				const ray = this.viewer.camera.getPickRay(movement.position);
				if (ray) {
					cartesian = this.viewer.scene.globe.pick(ray, this.viewer.scene);
				}
			}

			if (cartesian) {
				distanceLineNum++;
				if (distanceLineNum === 1) {
					pArr.push(cartesian);
					const entity = this.viewer.entities.add({
						name: "方位角",
						position: cartesian,
						point: {
							pixelSize: 3,
							color: Color.RED,
							outlineColor: Color.WHITE,
							outlineWidth: 2,
							heightReference: HeightReference.CLAMP_TO_GROUND,
						},
					});
					this.measureIds.push(entity.id);
				} else {
					pArr.length = 1;
					pArr.push(cartesian);
					this.finishMeasure();
					const result = this.drawAngle(pArr, Line1, Line2, angleT);
					Line1 = result.Line1;
					Line2 = result.Line2;
					angleT = result.angleT;
				}
			}
		}, ScreenSpaceEventType.LEFT_CLICK);

		// 监听右键取消测量
		this.handler.setInputAction(() => {
			this.finishMeasure();
		}, ScreenSpaceEventType.RIGHT_CLICK);
	}

	/**
	 * 获取是否正在测量
	 */
	isMeasuring(): boolean {
		return this.bMeasuring;
	}

	/**
	 * 创建多边形实体
	 */
	private createPolygon(positions: Cartesian3[]): Entity {
		const entity = this.viewer.entities.add({
			name: "多边形",
			polygon: {
				hierarchy: new CallbackProperty(() => ({ positions }), false),
				material: Color.DARKTURQUOISE.withAlpha(0.4),
				outline: true,
				outlineColor: Color.CYAN.withAlpha(0.8),
			},
		});
		this.measureIds.push(entity.id);
		return entity;
	}

	/**
	 * 计算多边形面积
	 */
	private getArea(
		points: Array<{ lon: number; lat: number; hei: number }>,
		positions: Cartesian3[],
	): number {
		const radiansPerDegree = Math.PI / 180.0;
		const degreesPerRadian = 180.0 / Math.PI;

		let res = 0;

		// 拆分三角曲面
		for (let i = 0; i < points.length - 2; i++) {
			const j = (i + 1) % points.length;
			const k = (i + 2) % points.length;
			const totalAngle = this.calculateAngle(
				points[i],
				points[j],
				points[k],
				radiansPerDegree,
				degreesPerRadian,
			);

			const disTemp1 = this.calculateDistance(positions[i], positions[j]);
			const disTemp2 = this.calculateDistance(positions[j], positions[k]);
			res += disTemp1 * disTemp2 * Math.abs(Math.sin(totalAngle));
		}
		return res / 1000000.0;
	}

	/**
	 * 计算角度
	 */
	private calculateAngle(
		p1: { lon: number; lat: number },
		p2: { lon: number; lat: number },
		p3: { lon: number; lat: number },
		radiansPerDegree: number,
		degreesPerRadian: number,
	): number {
		const bearing21 = this.calculateBearing(
			p2,
			p1,
			radiansPerDegree,
			degreesPerRadian,
		);
		const bearing23 = this.calculateBearing(
			p2,
			p3,
			radiansPerDegree,
			degreesPerRadian,
		);
		let angle = bearing21 - bearing23;
		if (angle < 0) {
			angle += 360;
		}
		return angle;
	}

	/**
	 * 计算方位角
	 */
	private calculateBearing(
		from: { lon: number; lat: number },
		to: { lon: number; lat: number },
		radiansPerDegree: number,
		degreesPerRadian: number,
	): number {
		const lat1 = from.lat * radiansPerDegree;
		const lon1 = from.lon * radiansPerDegree;
		const lat2 = to.lat * radiansPerDegree;
		const lon2 = to.lon * radiansPerDegree;
		let angle = -Math.atan2(
			Math.sin(lon1 - lon2) * Math.cos(lat2),
			Math.cos(lat1) * Math.sin(lat2) -
				Math.sin(lat1) * Math.cos(lat2) * Math.cos(lon1 - lon2),
		);
		if (angle < 0) {
			angle += Math.PI * 2.0;
		}
		angle = angle * degreesPerRadian;
		return angle;
	}

	/**
	 * 计算两点之间的距离
	 */
	private calculateDistance(point1: Cartesian3, point2: Cartesian3): number {
		const point1cartographic = Cartographic.fromCartesian(point1);
		const point2cartographic = Cartographic.fromCartesian(point2);

		const geodesic = new EllipsoidGeodesic();
		geodesic.setEndPoints(point1cartographic, point2cartographic);
		const s = geodesic.surfaceDistance;

		// 返回两点之间的距离（包含高度差）
		return Math.sqrt(
			s ** 2 + (point2cartographic.height - point1cartographic.height) ** 2,
		);
	}

	/**
	 * 绘制高度差三角形
	 */
	private drawAltitudeTriangle(
		trianArr: number[],
		Line1?: Entity,
		Line2?: Entity,
		H?: Entity,
	): { Line1: Entity; Line2: Entity; H: Entity } {
		if (Line1 && Line2 && H) {
			// 更新三角线
			if (Line1.polyline) {
				Line1.polyline.positions = new ConstantProperty(
					trianArr[5] > trianArr[2]
						? Cartesian3.fromDegreesArrayHeights([
								trianArr[0],
								trianArr[1],
								trianArr[5],
								trianArr[0],
								trianArr[1],
								trianArr[2],
							])
						: Cartesian3.fromDegreesArrayHeights([
								trianArr[3],
								trianArr[4],
								trianArr[2],
								trianArr[3],
								trianArr[4],
								trianArr[5],
							]),
				);
			}
			if (Line2.polyline) {
				Line2.polyline.positions = new ConstantProperty(
					trianArr[5] > trianArr[2]
						? Cartesian3.fromDegreesArrayHeights([
								trianArr[0],
								trianArr[1],
								trianArr[5],
								trianArr[3],
								trianArr[4],
								trianArr[5],
							])
						: Cartesian3.fromDegreesArrayHeights([
								trianArr[3],
								trianArr[4],
								trianArr[2],
								trianArr[0],
								trianArr[1],
								trianArr[2],
							]),
				);
			}

			// 高度
			const height = Math.abs(trianArr[2] - trianArr[5]).toFixed(2);
			H.position = new ConstantPositionProperty(
				trianArr[5] > trianArr[2]
					? Cartesian3.fromDegrees(
							trianArr[0],
							trianArr[1],
							(trianArr[2] + trianArr[5]) / 2,
						)
					: Cartesian3.fromDegrees(
							trianArr[3],
							trianArr[4],
							(trianArr[2] + trianArr[5]) / 2,
						),
			);
			if (H.label) {
				H.label.text = new ConstantProperty(`高度差:${height}米`);
			}
			return { Line1, Line2, H };
		}

		// 创建新的三角线
		Line1 = this.viewer.entities.add({
			name: "triangleLine",
			polyline: {
				positions:
					trianArr[5] > trianArr[2]
						? Cartesian3.fromDegreesArrayHeights([
								trianArr[0],
								trianArr[1],
								trianArr[5],
								trianArr[0],
								trianArr[1],
								trianArr[2],
							])
						: Cartesian3.fromDegreesArrayHeights([
								trianArr[3],
								trianArr[4],
								trianArr[2],
								trianArr[3],
								trianArr[4],
								trianArr[5],
							]),
				arcType: ArcType.NONE,
				width: 2,
				material: new PolylineOutlineMaterialProperty({
					color: Color.CHARTREUSE,
				}),
				depthFailMaterial: new PolylineOutlineMaterialProperty({
					color: Color.RED,
				}),
			},
		});
		this.measureIds.push(Line1.id);

		Line2 = this.viewer.entities.add({
			name: "triangleLine",
			polyline: {
				positions:
					trianArr[5] > trianArr[2]
						? Cartesian3.fromDegreesArrayHeights([
								trianArr[0],
								trianArr[1],
								trianArr[5],
								trianArr[3],
								trianArr[4],
								trianArr[5],
							])
						: Cartesian3.fromDegreesArrayHeights([
								trianArr[3],
								trianArr[4],
								trianArr[2],
								trianArr[0],
								trianArr[1],
								trianArr[2],
							]),
				arcType: ArcType.NONE,
				width: 2,
				material: new PolylineDashMaterialProperty({
					color: Color.CHARTREUSE,
				}),
				depthFailMaterial: new PolylineDashMaterialProperty({
					color: Color.RED,
				}),
			},
		});
		this.measureIds.push(Line2.id);

		// 高度
		const height = Math.abs(trianArr[2] - trianArr[5]).toFixed(2);
		H = this.viewer.entities.add({
			name: "lineZ",
			position:
				trianArr[5] > trianArr[2]
					? Cartesian3.fromDegrees(
							trianArr[0],
							trianArr[1],
							(trianArr[2] + trianArr[5]) / 2,
						)
					: Cartesian3.fromDegrees(
							trianArr[3],
							trianArr[4],
							(trianArr[2] + trianArr[5]) / 2,
						),
			label: {
				text: `高度差:${height}米`,
				translucencyByDistance: new NearFarScalar(1.5e2, 2.0, 1.5e5, 0),
				font: "45px 楷体",
				fillColor: Color.WHITE,
				outlineColor: Color.BLACK,
				style: LabelStyle.FILL_AND_OUTLINE,
				outlineWidth: 3,
				disableDepthTestDistance: Number.POSITIVE_INFINITY,
				scale: 0.5,
				pixelOffset: new Cartesian2(0, -10),
				backgroundColor: Color.fromCssColorString("rgba(0, 0, 0, 0.7)"),
				backgroundPadding: new Cartesian2(10, 10),
				verticalOrigin: VerticalOrigin.BOTTOM,
			},
		});
		this.measureIds.push(H.id);

		return { Line1, Line2, H };
	}

	/**
	 * 绘制三角测量图形
	 */
	private drawTriangle(
		trianArr: number[],
		XLine?: Entity,
		X?: Entity,
		Y?: Entity,
		H?: Entity,
	): { XLine: Entity; X: Entity; Y: Entity; H: Entity } {
		if (XLine && X && Y && H) {
			// 更新三角线
			if (XLine.polyline) {
				XLine.polyline.positions = new ConstantProperty(
					trianArr[5] > trianArr[2]
						? Cartesian3.fromDegreesArrayHeights([
								trianArr[0],
								trianArr[1],
								trianArr[2],
								trianArr[0],
								trianArr[1],
								trianArr[5],
								trianArr[3],
								trianArr[4],
								trianArr[5],
								trianArr[0],
								trianArr[1],
								trianArr[2],
							])
						: Cartesian3.fromDegreesArrayHeights([
								trianArr[0],
								trianArr[1],
								trianArr[2],
								trianArr[3],
								trianArr[4],
								trianArr[5],
								trianArr[3],
								trianArr[4],
								trianArr[2],
								trianArr[0],
								trianArr[1],
								trianArr[2],
							]),
				);
			}

			// 计算距离
			const lineDistance = Cartesian3.distance(
				Cartesian3.fromDegrees(trianArr[0], trianArr[1]),
				Cartesian3.fromDegrees(trianArr[3], trianArr[4]),
			).toFixed(2);
			const height = Math.abs(trianArr[2] - trianArr[5]).toFixed(2);
			const strLine = Math.sqrt(
				Number.parseFloat(lineDistance) ** 2 + Number.parseFloat(height) ** 2,
			).toFixed(2);

			X.position = new ConstantPositionProperty(
				Cartesian3.fromDegrees(
					(trianArr[0] + trianArr[3]) / 2,
					(trianArr[1] + trianArr[4]) / 2,
					Math.max(trianArr[2], trianArr[5]),
				),
			);
			H.position = new ConstantPositionProperty(
				trianArr[5] > trianArr[2]
					? Cartesian3.fromDegrees(
							trianArr[0],
							trianArr[1],
							(trianArr[2] + trianArr[5]) / 2,
						)
					: Cartesian3.fromDegrees(
							trianArr[3],
							trianArr[4],
							(trianArr[2] + trianArr[5]) / 2,
						),
			);
			Y.position = new ConstantPositionProperty(
				Cartesian3.fromDegrees(
					(trianArr[0] + trianArr[3]) / 2,
					(trianArr[1] + trianArr[4]) / 2,
					(trianArr[2] + trianArr[5]) / 2,
				),
			);

			if (X.label) {
				X.label.text = new ConstantProperty(`水平距离:${lineDistance}米`);
			}
			if (H.label) {
				H.label.text = new ConstantProperty(`高度差:${height}米`);
			}
			if (Y.label) {
				Y.label.text = new ConstantProperty(`空间距离:${strLine}米`);
			}

			return { XLine, X, Y, H };
		}

		// 创建新的三角线
		XLine = this.viewer.entities.add({
			name: "triangleLine",
			polyline: {
				positions:
					trianArr[5] > trianArr[2]
						? Cartesian3.fromDegreesArrayHeights([
								trianArr[0],
								trianArr[1],
								trianArr[2],
								trianArr[0],
								trianArr[1],
								trianArr[5],
								trianArr[3],
								trianArr[4],
								trianArr[5],
								trianArr[0],
								trianArr[1],
								trianArr[2],
							])
						: Cartesian3.fromDegreesArrayHeights([
								trianArr[0],
								trianArr[1],
								trianArr[2],
								trianArr[3],
								trianArr[4],
								trianArr[5],
								trianArr[3],
								trianArr[4],
								trianArr[2],
								trianArr[0],
								trianArr[1],
								trianArr[2],
							]),
				arcType: ArcType.NONE,
				width: 2,
				material: new PolylineOutlineMaterialProperty({
					color: Color.YELLOW,
				}),
				depthFailMaterial: new PolylineOutlineMaterialProperty({
					color: Color.RED,
				}),
			},
		});
		this.measureIds.push(XLine.id);

		// 计算距离
		const lineDistance = Cartesian3.distance(
			Cartesian3.fromDegrees(trianArr[0], trianArr[1]),
			Cartesian3.fromDegrees(trianArr[3], trianArr[4]),
		).toFixed(2);
		const height = Math.abs(trianArr[2] - trianArr[5]).toFixed(2);
		const strLine = Math.sqrt(
			Number.parseFloat(lineDistance) ** 2 + Number.parseFloat(height) ** 2,
		).toFixed(2);

		X = this.viewer.entities.add({
			name: "lineX",
			position: Cartesian3.fromDegrees(
				(trianArr[0] + trianArr[3]) / 2,
				(trianArr[1] + trianArr[4]) / 2,
				Math.max(trianArr[2], trianArr[5]),
			),
			label: {
				text: `水平距离:${lineDistance}米`,
				translucencyByDistance: new NearFarScalar(1.5e2, 2.0, 1.5e5, 0),
				font: "45px 楷体",
				fillColor: Color.WHITE,
				outlineColor: Color.BLACK,
				style: LabelStyle.FILL_AND_OUTLINE,
				outlineWidth: 3,
				disableDepthTestDistance: Number.POSITIVE_INFINITY,
				scale: 0.5,
				pixelOffset: new Cartesian2(0, -10),
				backgroundColor: Color.fromCssColorString("rgba(0, 0, 0, 0.7)"),
				backgroundPadding: new Cartesian2(10, 10),
				verticalOrigin: VerticalOrigin.BOTTOM,
			},
		});
		this.measureIds.push(X.id);

		H = this.viewer.entities.add({
			name: "lineZ",
			position:
				trianArr[5] > trianArr[2]
					? Cartesian3.fromDegrees(
							trianArr[0],
							trianArr[1],
							(trianArr[2] + trianArr[5]) / 2,
						)
					: Cartesian3.fromDegrees(
							trianArr[3],
							trianArr[4],
							(trianArr[2] + trianArr[5]) / 2,
						),
			label: {
				text: `高度差:${height}米`,
				translucencyByDistance: new NearFarScalar(1.5e2, 2.0, 1.5e5, 0),
				font: "45px 楷体",
				fillColor: Color.WHITE,
				outlineColor: Color.BLACK,
				style: LabelStyle.FILL_AND_OUTLINE,
				outlineWidth: 3,
				disableDepthTestDistance: Number.POSITIVE_INFINITY,
				scale: 0.5,
				pixelOffset: new Cartesian2(0, -10),
				backgroundColor: Color.fromCssColorString("rgba(0, 0, 0, 0.7)"),
				backgroundPadding: new Cartesian2(10, 10),
				verticalOrigin: VerticalOrigin.BOTTOM,
			},
		});
		this.measureIds.push(H.id);

		Y = this.viewer.entities.add({
			name: "lineY",
			position: Cartesian3.fromDegrees(
				(trianArr[0] + trianArr[3]) / 2,
				(trianArr[1] + trianArr[4]) / 2,
				(trianArr[2] + trianArr[5]) / 2,
			),
			label: {
				text: `空间距离:${strLine}米`,
				translucencyByDistance: new NearFarScalar(1.5e2, 2.0, 1.5e5, 0),
				font: "45px 楷体",
				fillColor: Color.WHITE,
				outlineColor: Color.BLACK,
				style: LabelStyle.FILL_AND_OUTLINE,
				outlineWidth: 3,
				disableDepthTestDistance: Number.POSITIVE_INFINITY,
				scale: 0.5,
				pixelOffset: new Cartesian2(0, -10),
				backgroundColor: Color.fromCssColorString("rgba(0, 0, 0, 0.7)"),
				backgroundPadding: new Cartesian2(10, 10),
				verticalOrigin: VerticalOrigin.BOTTOM,
			},
		});
		this.measureIds.push(Y.id);

		return { XLine, X, Y, H };
	}

	/**
	 * 绘制方位角
	 */
	private drawAngle(
		pArr: Cartesian3[],
		Line1?: Entity,
		Line2?: Entity,
		angleT?: Entity,
	): { Line1: Entity; Line2: Entity; angleT: Entity } {
		const cartographic1 = Cartographic.fromCartesian(pArr[0]);
		const lon1 = CesiumMath.toDegrees(cartographic1.longitude);
		const lat1 = CesiumMath.toDegrees(cartographic1.latitude);
		const cartographic2 = Cartographic.fromCartesian(pArr[1]);
		const lon2 = CesiumMath.toDegrees(cartographic2.longitude);
		const lat2 = CesiumMath.toDegrees(cartographic2.latitude);

		const lineDistance = Cartesian3.distance(
			Cartesian3.fromDegrees(lon1, lat1),
			Cartesian3.fromDegrees(lon2, lat2),
		);

		// 计算北方向点
		const localToWorldMatrix = Transforms.eastNorthUpToFixedFrame(
			Cartesian3.fromDegrees(lon1, lat1),
		);
		const northPoint = Cartographic.fromCartesian(
			Matrix4.multiplyByPoint(
				localToWorldMatrix,
				Cartesian3.fromElements(0, lineDistance, 0),
				new Cartesian3(),
			),
		);
		const npLon = CesiumMath.toDegrees(northPoint.longitude);
		const npLat = CesiumMath.toDegrees(northPoint.latitude);

		// 计算方位角
		const angle = this.courseAngle(lon1, lat1, lon2, lat2);
		const textDistance =
			lineDistance > 1000
				? `${(lineDistance / 1000).toFixed(3)}千米`
				: `${lineDistance.toFixed(2)}米`;

		if (Line1 && Line2 && angleT) {
			// 更新线和标注
			if (Line1.polyline) {
				Line1.polyline.positions = new ConstantProperty(
					Cartesian3.fromDegreesArray([lon1, lat1, npLon, npLat]),
				);
			}
			if (Line2.polyline) {
				Line2.polyline.positions = new ConstantProperty(
					Cartesian3.fromDegreesArray([lon1, lat1, lon2, lat2]),
				);
			}
			if (angleT.label) {
				angleT.label.text = new ConstantProperty(
					`角度:${angle}°\n距离:${textDistance}`,
				);
			}
			angleT.position = new ConstantPositionProperty(pArr[1]);
			return { Line1, Line2, angleT };
		}

		// 创建北方线
		Line1 = this.viewer.entities.add({
			name: "Angle1",
			polyline: {
				positions: new ConstantProperty(
					Cartesian3.fromDegreesArray([lon1, lat1, npLon, npLat]),
				),
				width: 3,
				material: new PolylineDashMaterialProperty({
					color: Color.RED,
				}),
				clampToGround: true,
			},
		});
		this.measureIds.push(Line1.id);

		// 创建方向线
		Line2 = this.viewer.entities.add({
			name: "Angle2",
			polyline: {
				positions: new ConstantProperty(
					Cartesian3.fromDegreesArray([lon1, lat1, lon2, lat2]),
				),
				width: 10,
				material: new PolylineArrowMaterialProperty(Color.YELLOW),
				clampToGround: true,
			},
		});
		this.measureIds.push(Line2.id);

		// 创建文字标注
		angleT = this.viewer.entities.add({
			name: "AngleT",
			position: pArr[1],
			label: {
				text: `角度:${angle}°\n距离:${textDistance}`,
				translucencyByDistance: new NearFarScalar(1.5e2, 2.0, 1.5e5, 0),
				font: "45px 楷体",
				fillColor: Color.WHITE,
				outlineColor: Color.BLACK,
				style: LabelStyle.FILL_AND_OUTLINE,
				outlineWidth: 4,
				scale: 0.5,
				pixelOffset: new Cartesian2(0, -40),
				disableDepthTestDistance: Number.POSITIVE_INFINITY,
				backgroundColor: Color.fromCssColorString("rgba(0, 0, 0, 1)"),
				backgroundPadding: new Cartesian2(10, 10),
				verticalOrigin: VerticalOrigin.BASELINE,
			},
		});
		this.measureIds.push(angleT.id);

		return { Line1, Line2, angleT };
	}

	/**
	 * 计算方位角
	 */
	private courseAngle(
		lngA: number,
		latA: number,
		lngB: number,
		latB: number,
	): number {
		let dRotateAngle = Math.atan2(Math.abs(lngA - lngB), Math.abs(latA - latB));
		if (lngB >= lngA) {
			if (latB < latA) {
				dRotateAngle = Math.PI - dRotateAngle;
			}
		} else {
			if (latB >= latA) {
				dRotateAngle = 2 * Math.PI - dRotateAngle;
			} else {
				dRotateAngle = Math.PI + dRotateAngle;
			}
		}
		dRotateAngle = (dRotateAngle * 180) / Math.PI;
		return Math.floor(dRotateAngle * 100) / 100;
	}
}

export { MeasureTool };
export default MeasureTool;
