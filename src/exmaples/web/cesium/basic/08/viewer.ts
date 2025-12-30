import {
	CzmlDataSource,
	EllipsoidTerrainProvider,
	ScreenSpaceEventType,
	UrlTemplateImageryProvider,
	Viewer,
} from "cesium";
import CesiumNavigation, {
	type NavigationOptions,
} from "cesium-navigation-es6";

/**
 * CZML
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
	// 加载火星地形
	// CesiumTerrainProvider.fromUrl("//data.mars3d.cn/terrain").then(
	// 	(terrainProvider) => {
	// 		viewer.terrainProvider = terrainProvider;
	// 	},
	// );

	// 取消默认的单击和双击事件，右上角弹窗很丑
	viewer.cesiumWidget.screenSpaceEventHandler.removeInputAction(
		ScreenSpaceEventType.LEFT_CLICK,
	);
	viewer.cesiumWidget.screenSpaceEventHandler.removeInputAction(
		ScreenSpaceEventType.LEFT_DOUBLE_CLICK,
	);

	const options = {
		enableCompass: true,
		enableZoomControls: true,
	} satisfies NavigationOptions;
	new CesiumNavigation(viewer, options);

	return viewer;
}

export async function loadCZML(viewer: Viewer) {
	const czmldata = await CzmlDataSource.load('/cesium/08/wx.czml')
	viewer.dataSources.add(czmldata)
	viewer.clock.shouldAnimate = true;
}