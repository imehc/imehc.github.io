import {
	EllipsoidTerrainProvider,
	UrlTemplateImageryProvider,
	Viewer,
} from "cesium";
import CesiumNavigation, {
	type NavigationOptions,
} from "cesium-navigation-es6";
import type { GeoJSON } from "geojson";
import PointCluster, { type Point } from "./point-cluster";

/**
 * 聚合
 *
 * @param el - 用于承载 Cesium Viewer 的 HTML 元素
 * @returns 返回配置好的 Viewer 实例和 GUI
 */
export function initViewer(el: HTMLElement) {
	const viewer = new Viewer(el, {
		baseLayerPicker: false, // 隐藏底图选择器
		animation: false, // 隐藏动画控件
		timeline: false, // 隐藏时间轴
		fullscreenButton: false, // 隐藏全屏按钮
		geocoder: false, // 隐藏地理编码搜索框
		homeButton: false, // 隐藏主页按钮
		infoBox: false, // 隐藏信息框
		sceneModePicker: false, // 隐藏场景模式选择器(2D/3D/Columbus)
		selectionIndicator: false, // 隐藏选择指示器
		navigationHelpButton: false, // 隐藏导航帮助按钮
	});
	// viewer.scene.globe.depthTestAgainstTerrain = true; // 启用深度检测
	viewer.scene.debugShowFramesPerSecond = true; // 显示帧率
	viewer.imageryLayers.remove(viewer.imageryLayers.get(0)); // 移除默认影像
	viewer.scene.terrainProvider = new EllipsoidTerrainProvider({}); //移除默认地形
	const xyz = new UrlTemplateImageryProvider({
		url: "//data.mars3d.cn/tile/img/{z}/{x}/{y}.jpg",
	});
	viewer.imageryLayers.addImageryProvider(xyz);

	const options = {
		enableCompass: true,
		enableZoomControls: true,
	} satisfies NavigationOptions;
	new CesiumNavigation(viewer, options);

	const results = randomPointsWithinBbox(-120, -90, 25, 40, 10000, "geojson");
	const cluster = new PointCluster({
		viewer,
		results,
		pixelRange: 80,
		colorItems: [
			{
				num: 1,
				size: 30,
				color: "#1c86d1cc",
			},
			{
				num: 50,
				size: 32,
				color: "#67c23acc",
			},
			{
				num: 100,
				size: 34,
				color: "#f56c6ccc",
			},
			{
				num: 200,
				size: 36,
				color: "#e6a23ccc",
			},
		],
		img: "/cesium/07/marker6.png",
	});

	return { viewer, cluster };
}

export function randomPointsWithinBbox(
	xmin: number,
	xmax: number,
	ymin: number,
	ymax: number,
	num: number,
	type?: "geojson",
): GeoJSON | Point[] {
	if (type === "geojson") {
		const pointMap = {
			type: "FeatureCollection",
			features: [],
		} satisfies GeoJSON;
		for (let i = 0; i < num; i++) {
			const point = {
				type: "Feature",
				properties: {
					value: parseInt(`${Math.random() * 10000000}`, 10),
				},
				geometry: {
					type: "Point",
					coordinates: [
						Math.random() * (xmax - xmin) + xmin,
						Math.random() * (ymax - ymin) + ymin,
					],
				},
			} satisfies GeoJSON;
			pointMap.features.push(point);
		}
		return pointMap;
	} else {
		const points: Point[] = [];
		for (let i = 0; i < num; i++) {
			const point = {
				x: Math.random() * (xmax - xmin) + xmin,
				y: Math.random() * (ymax - ymin) + ymin,
			};
			points.push(point);
		}
		return points;
	}
}
