import {
	Cesium3DTileset,
	EllipsoidTerrainProvider,
	ScreenSpaceEventType,
	UrlTemplateImageryProvider,
	Viewer,
} from "cesium";
import CesiumNavigation, {
	type NavigationOptions,
} from "cesium-navigation-es6";
import { GUI } from "dat.gui";
import SunlightAnalysis from "./SunlightAnalysis";

/**
 * 日照分析
 *
 * @param el - 用于承载 Cesium Viewer 的 HTML 元素
 * @returns 返回配置好的 Viewer 实例和 GUI
 */
export function initViewer(el: HTMLElement) {
	const viewer = new Viewer(el, {
		baseLayerPicker: false, // 隐藏底图选择器
		// animation: false, // 隐藏动画控件
		timeline: true, // 显示时间轴以便观察时间变化
		fullscreenButton: false, // 隐藏全屏按钮
		geocoder: false, // 隐藏地理编码搜索框
		homeButton: false, // 隐藏主页按钮
		infoBox: false, // 隐藏信息框
		sceneModePicker: false, // 隐藏场景模式选择器(2D/3D/Columbus)
		selectionIndicator: false, // 隐藏选择指示器
		navigationHelpButton: false, // 隐藏导航帮助按钮
	});

	viewer.scene.debugShowFramesPerSecond = true; // 显示帧率
	viewer.imageryLayers.remove(viewer.imageryLayers.get(0)); // 移除默认影像
	viewer.scene.terrainProvider = new EllipsoidTerrainProvider({}); // 移除默认地形

	// 开启深度检测
	viewer.scene.globe.depthTestAgainstTerrain = true;

	// 添加影像图层
	const xyz = new UrlTemplateImageryProvider({
		url: "//data.mars3d.cn/tile/img/{z}/{x}/{y}.jpg",
	});
	viewer.imageryLayers.addImageryProvider(xyz);

	// 取消默认的单击和双击事件
	viewer.cesiumWidget.screenSpaceEventHandler.removeInputAction(
		ScreenSpaceEventType.LEFT_CLICK,
	);
	viewer.cesiumWidget.screenSpaceEventHandler.removeInputAction(
		ScreenSpaceEventType.LEFT_DOUBLE_CLICK,
	);

	// 添加导航控件
	const options = {
		enableCompass: true,
		enableZoomControls: true,
	} satisfies NavigationOptions;
	new CesiumNavigation(viewer, options);

	// 加载3D Tiles模型
	Cesium3DTileset.fromUrl("/cesium/02/data/tileset.json")
		.then((tileset) => {
			viewer.scene.primitives.add(tileset);
			viewer.zoomTo(tileset);
		})
		.catch((error: Error) => {
			console.error("加载3D Tiles失败:", error);
		});

	// 创建 dat.gui 控制面板
	const gui = new GUI();
	gui.domElement.style.position = "fixed";
	gui.domElement.style.top = "50%";
	gui.domElement.style.transform = "translateY(-50%)";
	gui.domElement.style.left = "0";

	// 日照分析实例
	let sunlightAnalysis: SunlightAnalysis | null = null;

	// 获取今天的日期字符串 (YYYY-MM-DD)
	const today = new Date().toISOString().split("T")[0];

	// 控制参数
	const controls = {
		date: today,
		startTime: 8,
		stopTime: 18,
		multiplier: 500,
		isPlaying: false,
		播放: () => {
			if (controls.isPlaying) {
				console.warn("日照分析已在播放中");
				return;
			}

			// 创建或更新日照分析实例
			if (!sunlightAnalysis) {
				sunlightAnalysis = new SunlightAnalysis({
					viewer,
					play: true,
					day: controls.date,
					startTime: controls.startTime,
					stopTime: controls.stopTime,
					multiplier: controls.multiplier,
				});
			} else {
				sunlightAnalysis.play(
					controls.date,
					controls.startTime,
					controls.stopTime,
					controls.multiplier,
				);
			}

			controls.isPlaying = true;
		},
		暂停: () => {
			if (sunlightAnalysis) {
				sunlightAnalysis.pause();
				controls.isPlaying = false;
			}
		},
		清除: () => {
			if (sunlightAnalysis) {
				sunlightAnalysis.clear();
				sunlightAnalysis = null;
			}
			controls.isPlaying = false;
		},
	};

	// 创建GUI控制器
	const paramsFolder = gui.addFolder("参数设置");
	paramsFolder.add(controls, "date").name("日期 (YYYY-MM-DD)").listen();
	paramsFolder
		.add(controls, "startTime", 0, 23, 1)
		.name("开始时间 (小时)")
		.listen();
	paramsFolder.add(controls, "stopTime", 0, 23, 1).name("结束时间 (小时)").listen();
	paramsFolder
		.add(controls, "multiplier", 1, 2000, 10)
		.name("时间流逝速率")
		.listen();
	paramsFolder.open();

	const statusFolder = gui.addFolder("状态显示");
	statusFolder.add(controls, "isPlaying").name("播放状态").listen();
	statusFolder.open();

	const actionsFolder = gui.addFolder("操作");
	actionsFolder.add(controls, "播放");
	actionsFolder.add(controls, "暂停");
	actionsFolder.add(controls, "清除");
	actionsFolder.open();

	// 清理函数
	const cleanup = () => {
		if (sunlightAnalysis) {
			sunlightAnalysis.clear();
		}
	};

	return { viewer, gui, cleanup };
}
