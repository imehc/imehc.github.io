import {
	Cartesian3,
	CesiumTerrainProvider,
	Color,
	EllipsoidTerrainProvider,
	ScreenSpaceEventType,
	UrlTemplateImageryProvider,
	Viewer,
} from "cesium";
import CesiumNavigation, {
	type NavigationOptions,
} from "cesium-navigation-es6";
import { GUI } from "dat.gui";
import SubmergenceAnalysis from "./SubmergenceAnalysis";

/**
 * 淹没分析
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

	viewer.scene.debugShowFramesPerSecond = true; // 显示帧率
	viewer.imageryLayers.remove(viewer.imageryLayers.get(0)); // 移除默认影像
	viewer.scene.terrainProvider = new EllipsoidTerrainProvider({}); // 移除默认地形

	// 添加影像图层
	const xyz = new UrlTemplateImageryProvider({
		url: "//data.mars3d.cn/tile/img/{z}/{x}/{y}.jpg",
	});
	viewer.imageryLayers.addImageryProvider(xyz);

	// 异步加载地形
	CesiumTerrainProvider.fromUrl("https://data.mars3d.cn/terrain", {
		requestWaterMask: true,
		requestVertexNormals: true,
	})
		.then((terrainProvider) => {
			viewer.scene.terrainProvider = terrainProvider;
			viewer.scene.globe.depthTestAgainstTerrain = true; // 启用深度检测
		})
		.catch((error) => {
			console.error("加载地形失败:", error);
		});

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

	// 创建 dat.gui 控制面板
	const gui = new GUI();
	gui.domElement.style.position = "fixed";
	gui.domElement.style.top = "50%";
	gui.domElement.style.transform = "translateY(-50%)";
	gui.domElement.style.left = "0";

	// 淹没区域坐标（经纬度）
	const floodAreaCoords = [
		98.676842346815, 27.571578111198868, 98.86252156624968, 27.77444519911974,
		98.76756234288729, 27.800244194152533, 98.57088699052892, 27.72492584876768,
		98.676842346815, 27.571578111198868,
	];

	// 淹没分析实例
	let submergence: SubmergenceAnalysis | null = null;

	// 控制参数
	const controls = {
		startHeight: 1000,
		targetHeight: 2500,
		speed: 200,
		currentHeight: 0,
		isRunning: false,
		飞行到区域: () => {
			viewer.camera.setView({
				destination: Cartesian3.fromDegrees(
					98.71707797694049,
					27.677299704639537,
					50000.0,
				),
			});
		},
		开始淹没: () => {
			if (controls.isRunning) {
				console.warn("淹没分析已在运行中");
				return;
			}

			// 清除之前的实例
			if (submergence) {
				submergence.clear();
			}

			// 创建新的淹没分析实例
			submergence = new SubmergenceAnalysis({
				viewer: viewer,
				targetHeight: controls.targetHeight,
				startHeight: controls.startHeight,
				waterHeight: controls.startHeight,
				adapCoordi: floodAreaCoords,
				speed: controls.speed,
				color: Color.fromBytes(64, 157, 253, 150),
				changetype: "up",
				speedCallback: (height: number) => {
					controls.currentHeight = Number.parseFloat(height.toFixed(2));
				},
				endCallback: () => {
					controls.isRunning = false;
					console.log("淹没分析完成");
				},
			});

			controls.isRunning = true;
			controls.currentHeight = controls.startHeight;
			submergence.start();
		},
		清除: () => {
			if (submergence) {
				submergence.clear();
				submergence = null;
			}
			controls.isRunning = false;
			controls.currentHeight = 0;
		},
		重置: () => {
			controls.清除();
			controls.startHeight = 1000;
			controls.targetHeight = 2500;
			controls.speed = 200;
			controls.currentHeight = 0;
		},
	};

	// 创建GUI控制器
	const paramsFolder = gui.addFolder("参数设置");
	paramsFolder
		.add(controls, "startHeight", 0, 5000, 10)
		.name("起始高度 (米)")
		.listen();
	paramsFolder
		.add(controls, "targetHeight", 0, 5000, 10)
		.name("目标高度 (米)")
		.listen();
	paramsFolder.add(controls, "speed", 1, 1000, 1).name("速度 (米/秒)").listen();
	paramsFolder.open();

	const statusFolder = gui.addFolder("状态显示");
	statusFolder.add(controls, "currentHeight").name("当前高度 (米)").listen();
	statusFolder.add(controls, "isRunning").name("运行状态").listen();
	statusFolder.open();

	const actionsFolder = gui.addFolder("操作");
	actionsFolder.add(controls, "飞行到区域");
	actionsFolder.add(controls, "开始淹没");
	actionsFolder.add(controls, "清除");
	actionsFolder.add(controls, "重置");
	actionsFolder.open();

	// 清理函数
	const cleanup = () => {
		if (submergence) {
			submergence.clear();
		}
	};

	return { viewer, gui, cleanup };
}
