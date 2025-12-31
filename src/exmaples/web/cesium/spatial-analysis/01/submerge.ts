import {
	Cartesian3,
	type Cartesian3 as Cartesian3Type,
	Cartographic,
	Math as CesiumMath,
	CesiumTerrainProvider,
	clone,
	Ellipsoid,
	EllipsoidGeodesic,
	EllipsoidTerrainProvider,
	type Entity,
	HeadingPitchRoll,
	sampleTerrainMostDetailed,
	Transforms,
	type Viewer,
} from "cesium";

/** 地形折线参数接口 */
interface TerrainPolylineParams {
	/** Cesium Viewer 实例 */
	viewer: Viewer;
	/** 折线的笛卡尔坐标数组 */
	positions: Cartesian3Type[];
	/** 弧线插值粒度，默认 0.00001 */
	granularity?: number;
	/** 高度偏移量（用于增高），默认 2 */
	offset?: number;
	/** 回调函数，返回贴地后的坐标和是否缺少高度数据 */
	callback?: (positions: Cartesian3Type[], noHeight: boolean) => void;
}

/** 模型配置参数接口 */
interface ModelConfig {
	/** 经度 */
	x: number;
	/** 纬度 */
	y: number;
	/** 高度 */
	z?: number;
	/** 航向角（度） */
	heading?: number;
	/** 俯仰角（度） */
	pitch?: number;
	/** 翻滚角（度） */
	roll?: number;
	/** 模型名称 */
	name?: string;
	/** 模型URI */
	uri?: string;
	/** 提示信息 */
	tooltip?: string;
	/** 弹出信息 */
	popup?: string;
	[key: string]: unknown;
}

/** 点坐标接口 */
interface Point {
	x: number;
	y: number;
}

/** GeoJSON Feature 接口 */
interface GeoJSONFeature {
	type: "Feature";
	properties: {
		value: number;
		[key: string]: unknown;
	};
	geometry: {
		type: "Point";
		coordinates: [number, number];
	};
}

/** GeoJSON FeatureCollection 接口 */
interface GeoJSONFeatureCollection {
	type: "FeatureCollection";
	features: GeoJSONFeature[];
}

/** 浏览器信息接口 */
interface BrowserInfo {
	type: string;
	version: number;
}

const submerge = {
	/** 判断是否是数字 */
	isNumber: (obj: unknown) => {
		return typeof obj === "number" && obj.constructor === Number;
	},
	/** 判断是否是字符串 */
	isString: (obj: unknown) => {
		return typeof obj === "string" && obj.constructor === String;
	},
	/** 对象拷贝赋值 */
	extend: (
		dest: Record<string, unknown>,
		...args: Record<string, unknown>[]
	) => {
		for (const source of args) {
			if (source) {
				for (const key in source) {
					if (Object.hasOwn(source, key)) {
						// 忽略特定属性
						if (
							key === "caller" ||
							key === "callee" ||
							key === "length" ||
							key === "arguments"
						) {
							continue;
						}
						dest[key] = source[key];
					}
				}
			}
		}
		return dest;
	},
	/** url参数获取 */
	getRequest: () => {
		const url = location.search;
		const theRequest = new Object();
		if (url.indexOf("?") !== -1) {
			const str = url.substring(1);
			const strs = str.split("&");
			for (let i = 0; i < strs.length; i++) {
				theRequest[strs[i].split("=")[0]] = decodeURI(strs[i].split("=")[1]);
			}
		}
		return theRequest;
	},
	getRequestByName: (name: string) => {
		const reg = new RegExp(`(^|&)${name}=([^&]*)(&|$)`, "i");
		const r = window.location.search.substring(1).match(reg);
		if (r != null) return decodeURI(r[2]);
		return null;
	},
	clone: (obj: unknown) => {
		if (null == obj || "object" !== typeof obj) return obj;
		if (obj instanceof Date) {
			const copy = new Date();
			copy.setTime(obj.getTime());
			return copy;
		}
		if (Array.isArray(obj)) {
			const copy = [];
			for (let i = 0, len = obj.length; i < len; ++i) {
				copy[i] = clone(obj[i]);
			}
			return copy;
		}
		if (typeof obj === "object") {
			const copy = {};
			for (const attr in obj) {
				if (attr === "_layer" || attr === "_layers" || attr === "_parent")
					continue;

				if (Object.hasOwn(obj, attr)) copy[attr] = clone(obj[attr]);
			}
			return copy;
		}
		return obj;
	},
	isPCBroswer: () => {
		const sUserAgent = navigator.userAgent.toLowerCase();

		const bIsIpad = sUserAgent.match(/ipad/i) !== null;
		const bIsIphoneOs = sUserAgent.match(/iphone/i) !== null;
		const bIsMidp = sUserAgent.match(/midp/i) !== null;
		const bIsUc7 = sUserAgent.match(/rv:1.2.3.4/i) !== null;
		const bIsUc = sUserAgent.match(/ucweb/i) !== null;
		const bIsAndroid = sUserAgent.match(/android/i) !== null;
		const bIsCE = sUserAgent.match(/windows ce/i) !== null;
		const bIsWM = sUserAgent.match(/windows mobile/i) !== null;
		if (
			bIsIpad ||
			bIsIphoneOs ||
			bIsMidp ||
			bIsUc7 ||
			bIsUc ||
			bIsAndroid ||
			bIsCE ||
			bIsWM
		) {
			return false;
		} else {
			return true;
		}
	},
	webglreport: () => {
		var exinfo = getExplorerInfo();
		if (exinfo.type === "IE" && exinfo.version < 11) {
			return false;
		}

		try {
			let glContext: WebGL2RenderingContext | RenderingContext | undefined;
			const canvas = document.createElement("canvas");
			const requestWebgl2 = typeof WebGL2RenderingContext !== "undefined";
			if (requestWebgl2) {
				glContext =
					canvas.getContext("webgl2") ||
					canvas.getContext("experimental-webgl2") ||
					undefined;
			}
			if (glContext == null) {
				glContext =
					canvas.getContext("webgl") ||
					canvas.getContext("experimental-webgl") ||
					undefined;
			}
			if (glContext == null) {
				return false;
			}
		} catch (_e) {
			return false;
		}
		return true;
	},
	// 计算贴地路线
	terrainPolyline: async (params: TerrainPolylineParams): Promise<void> => {
		const {
			viewer,
			positions,
			granularity = 0.00001,
			offset = 2,
			callback,
		} = params;

		// 如果没有坐标或坐标数组为空，直接返回
		if (!positions || positions.length === 0) {
			if (callback) {
				callback(positions, false);
			}
			return;
		}

		const ellipsoid = viewer.scene.globe.ellipsoid;
		const cartographicArray: Cartographic[] = [];

		// 在相邻点之间进行测地线插值
		for (let i = 0; i < positions.length - 1; i++) {
			const startCartographic = ellipsoid.cartesianToCartographic(positions[i]);
			const endCartographic = ellipsoid.cartesianToCartographic(
				positions[i + 1],
			);

			if (!startCartographic || !endCartographic) continue;

			// 使用 EllipsoidGeodesic 计算测地线
			const geodesic = new EllipsoidGeodesic(
				startCartographic,
				endCartographic,
			);
			const distance = geodesic.surfaceDistance;

			// 根据粒度计算需要插值的点数
			const numPoints = Math.max(2, Math.ceil(distance * granularity));

			// 在起点和终点之间插值
			for (let j = 0; j < numPoints; j++) {
				const fraction = j / (numPoints - 1);
				const interpolatedCartographic =
					geodesic.interpolateUsingSurfaceDistance(distance * fraction);
				cartographicArray.push(interpolatedCartographic);
			}
		}

		// 用于缺少地形数据时的默认高度
		const tempHeight = Cartographic.fromCartesian(positions[0])?.height ?? 0;

		try {
			// 使用 sampleTerrainMostDetailed 获取地形高度（返回 Promise）
			const samples = await sampleTerrainMostDetailed(
				viewer.terrainProvider,
				cartographicArray,
			);

			let noHeight = false;
			// 获取地形夸张系数
			const terrainExaggeration = viewer.scene.verticalExaggeration ?? 1.0;

			// 处理采样结果
			for (let i = 0; i < samples.length; i++) {
				if (samples[i].height === undefined || samples[i].height === null) {
					noHeight = true;
					samples[i].height = tempHeight;
				} else {
					// 应用地形夸张系数和偏移量
					samples[i].height =
						offset + (samples[i].height as number) * terrainExaggeration;
				}
			}

			// 将地理坐标转换回笛卡尔坐标
			const raisedPositions =
				ellipsoid.cartographicArrayToCartesianArray(samples);

			// 调用回调函数返回结果
			if (callback) {
				callback(raisedPositions, noHeight);
			}
		} catch (error) {
			console.error("计算贴地路线时出错:", error);
			if (callback) {
				callback(positions, true);
			}
		}
	},
	getEllipsoidTerrain: () => {
		return new EllipsoidTerrainProvider({
			ellipsoid: Ellipsoid.WGS84,
		});
	},
	getTerrainProvider: async (
		cfg: {
			url?: string;
			requestWaterMask?: boolean;
			requestVertexNormals?: boolean;
		} & Record<string, unknown>,
	): Promise<CesiumTerrainProvider | EllipsoidTerrainProvider> => {
		if (!("requestWaterMask" in cfg)) cfg.requestWaterMask = true;
		if (!("requestVertexNormals" in cfg)) cfg.requestVertexNormals = true;

		let terrainProvider: CesiumTerrainProvider | EllipsoidTerrainProvider;

		if (cfg.url === "" || cfg.url === null || cfg.url === "cesium") {
			terrainProvider = await CesiumTerrainProvider.fromIonAssetId(1);
		} else if (cfg.url === "ellipsoid" || cfg.url === "null") {
			terrainProvider = submerge.getEllipsoidTerrain();
		} else {
			terrainProvider = await CesiumTerrainProvider.fromUrl(
				cfg.url as string,
				cfg,
			);
		}
		return terrainProvider;
	},

	/** 创建模型 */
	createModel: (cfg: ModelConfig, viewer: Viewer): Entity => {
		const position = Cartesian3.fromDegrees(cfg.x, cfg.y, cfg.z ?? 0);
		const heading = CesiumMath.toRadians(cfg.heading ?? 0);
		const pitch = CesiumMath.toRadians(cfg.pitch ?? 0);
		const roll = CesiumMath.toRadians(cfg.roll ?? 0);
		const hpr = new HeadingPitchRoll(heading, pitch, roll);
		const orientation = Transforms.headingPitchRollQuaternion(position, hpr);

		const model = viewer.entities.add({
			name: cfg.name ?? "",
			position: position,
			orientation: orientation,
			model: {
				uri: cfg.uri,
				...cfg,
			},
			properties: {
				tooltip: cfg.tooltip,
				popup: cfg.popup,
			},
		});
		return model;
	},

	/** 格式化角度为度分秒 */
	formatDegree: (value: number): string => {
		const absValue = Math.abs(value);
		const degrees = Math.floor(absValue);
		const minutes = Math.floor((absValue - degrees) * 60);
		const seconds = Math.round(((absValue - degrees) * 3600) % 60);
		return `${degrees}° ${minutes}' ${seconds}"`;
	},

	/** 浮点数精确运算工具 */
	floatObj: (() => {
		/** 判断是否为整数 */
		const isInteger = (obj: number): boolean => {
			return Math.floor(obj) === obj;
		};

		/** 将浮点数转为整数及其倍数 */
		const toInteger = (floatNum: number): { times: number; num: number } => {
			const ret = { times: 1, num: 0 };
			if (isInteger(floatNum)) {
				ret.num = floatNum;
				return ret;
			}
			const strfi = floatNum.toString();
			const dotPos = strfi.indexOf(".");
			const len = strfi.substring(dotPos + 1).length;
			const times = 10 ** len;
			const intNum = Number.parseInt(String(floatNum * times + 0.5), 10);
			ret.times = times;
			ret.num = intNum;
			return ret;
		};

		/** 核心运算方法 */
		const operation = (
			a: number,
			b: number,
			op: "add" | "subtract" | "multiply" | "divide",
		): number => {
			const o1 = toInteger(a);
			const o2 = toInteger(b);
			const n1 = o1.num;
			const n2 = o2.num;
			const t1 = o1.times;
			const t2 = o2.times;
			const max = t1 > t2 ? t1 : t2;
			let result = 0;

			switch (op) {
				case "add":
					if (t1 === t2) {
						result = n1 + n2;
					} else if (t1 > t2) {
						result = n1 + n2 * (t1 / t2);
					} else {
						result = n1 * (t2 / t1) + n2;
					}
					return result / max;
				case "subtract":
					if (t1 === t2) {
						result = n1 - n2;
					} else if (t1 > t2) {
						result = n1 - n2 * (t1 / t2);
					} else {
						result = n1 * (t2 / t1) - n2;
					}
					return result / max;
				case "multiply":
					result = (n1 * n2) / (t1 * t2);
					return result;
				case "divide":
					result = (n1 / n2) * (t2 / t1);
					return result;
			}
		};

		return {
			add: (a: number, b: number) => operation(a, b, "add"),
			subtract: (a: number, b: number) => operation(a, b, "subtract"),
			multiply: (a: number, b: number) => operation(a, b, "multiply"),
			divide: (a: number, b: number) => operation(a, b, "divide"),
		};
	})(),

	/** 生成矩形范围内的随机点 */
	randomPointsWithinBbox: (
		xmin: number,
		xmax: number,
		ymin: number,
		ymax: number,
		num: number,
		type?: "geojson",
	): Point[] | GeoJSONFeatureCollection => {
		if (type === "geojson") {
			const points: GeoJSONFeatureCollection = {
				type: "FeatureCollection",
				features: [],
			};
			for (let i = 0; i < num; i++) {
				const point: GeoJSONFeature = {
					type: "Feature",
					properties: {
						value: Math.floor(Math.random() * 10000000),
					},
					geometry: {
						type: "Point",
						coordinates: [
							Math.random() * (xmax - xmin) + xmin,
							Math.random() * (ymax - ymin) + ymin,
						],
					},
				};
				points.features.push(point);
			}
			return points;
		}

		const points: Point[] = [];
		for (let i = 0; i < num; i++) {
			const point: Point = {
				x: Math.random() * (xmax - xmin) + xmin,
				y: Math.random() * (ymax - ymin) + ymin,
			};
			points.push(point);
		}
		return points;
	},

	/** 判断点是否在线段上 */
	onSegment: (pi: Point, pj: Point, q: Point): boolean => {
		if (
			(q.x - pi.x) * (pj.y - pi.y) === (pj.x - pi.x) * (q.y - pi.y) &&
			Math.min(pi.x, pj.x) <= q.x &&
			q.x <= Math.max(pi.x, pj.x) &&
			Math.min(pi.y, pj.y) <= q.y &&
			q.y <= Math.max(pi.y, pj.y)
		) {
			return true;
		}
		return false;
	},

	/** 判断点是否在多边形内 */
	isDotInPolygon: (
		point: Point | [number, number],
		polygonPoints: (Point | [number, number])[],
		onborder = true,
	): boolean => {
		let flag = false;
		let p1: Point;
		let p2: Point;

		const pt: Point = Array.isArray(point)
			? { x: point[0], y: point[1] }
			: { x: point.x, y: point.y };

		for (
			let i = 0, j = polygonPoints.length - 1;
			i < polygonPoints.length;
			j = i++
		) {
			const poly1 = polygonPoints[i];
			const poly2 = polygonPoints[j];

			p1 = Array.isArray(poly1)
				? { x: poly1[0], y: poly1[1] }
				: { x: poly1.x, y: poly1.y };
			p2 = Array.isArray(poly2)
				? { x: poly2[0], y: poly2[1] }
				: { x: poly2.x, y: poly2.y };

			if (onborder && submerge.onSegment(p1, p2, pt)) {
				return true;
			}

			if (
				p1.y > pt.y !== p2.y > pt.y &&
				pt.x < ((pt.y - p1.y) * (p1.x - p2.x)) / (p1.y - p2.y) + p1.x
			) {
				flag = !flag;
			}
		}
		return flag;
	},

	/** 生成多边形范围内的随机点 */
	randomPointsWithinPolygon: (
		polygon: (Point | [number, number])[],
		num: number,
		type?: "geojson",
	): Point[] | GeoJSONFeatureCollection => {
		let xmin = Number.POSITIVE_INFINITY;
		let xmax = Number.NEGATIVE_INFINITY;
		let ymin = Number.POSITIVE_INFINITY;
		let ymax = Number.NEGATIVE_INFINITY;

		// 获取多边形的边界框
		for (const p of polygon) {
			const x = Array.isArray(p) ? p[0] : p.x;
			const y = Array.isArray(p) ? p[1] : p.y;
			xmin = Math.min(xmin, x);
			xmax = Math.max(xmax, x);
			ymin = Math.min(ymin, y);
			ymax = Math.max(ymax, y);
		}

		if (type === "geojson") {
			const points: GeoJSONFeatureCollection = {
				type: "FeatureCollection",
				features: [],
			};
			for (let j = 0; j < num; j++) {
				const tempPoints = submerge.randomPointsWithinBbox(
					xmin,
					xmax,
					ymin,
					ymax,
					1,
				) as Point[];
				const point = tempPoints[0];
				if (!submerge.isDotInPolygon(point, polygon)) {
					j--;
				} else {
					const p: GeoJSONFeature = {
						type: "Feature",
						properties: {
							value: Math.floor(Math.random() * 10000000),
						},
						geometry: {
							type: "Point",
							coordinates: [point.x, point.y],
						},
					};
					points.features.push(p);
				}
			}
			return points;
		}

		const points: Point[] = [];
		for (let j = 0; j < num; j++) {
			const tempPoints = submerge.randomPointsWithinBbox(
				xmin,
				xmax,
				ymin,
				ymax,
				1,
			) as Point[];
			const point = tempPoints[0];
			if (!submerge.isDotInPolygon(point, polygon)) {
				j--;
			} else {
				points.push(point);
			}
		}
		return points;
	},

	/** 获取JSON文件 */
	getJSON: async <T = unknown>(url: string): Promise<T> => {
		const response = await fetch(url);
		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}
		return await response.json();
	},
};

function getExplorerInfo(): BrowserInfo {
	const explorer = window.navigator.userAgent.toLowerCase();
	//ie
	if (explorer.indexOf("msie") >= 0) {
		const match = explorer.match(/msie ([\d]+)/);
		const ver = match ? Number(match[1]) : -1;
		return {
			type: "IE",
			version: ver,
		};
	}
	//firefox
	if (explorer.indexOf("firefox") >= 0) {
		const match = explorer.match(/firefox\/([\d]+)/);
		const ver = match ? Number(match[1]) : -1;
		return {
			type: "Firefox",
			version: ver,
		};
	}
	//Chrome
	if (explorer.indexOf("chrome") >= 0) {
		const match = explorer.match(/chrome\/([\d]+)/);
		const ver = match ? Number(match[1]) : -1;
		return {
			type: "Chrome",
			version: ver,
		};
	}
	//Opera
	if (explorer.indexOf("opera") >= 0) {
		const match = explorer.match(/opera.([\d]+)/);
		const ver = match ? Number(match[1]) : -1;
		return {
			type: "Opera",
			version: ver,
		};
	}
	//Safari
	if (explorer.indexOf("Safari") >= 0) {
		const match = explorer.match(/version\/([\d]+)/);
		const ver = match ? Number(match[1]) : -1;
		return {
			type: "Safari",
			version: ver,
		};
	}
	return {
		type: explorer,
		version: -1,
	};
}

export default submerge;
