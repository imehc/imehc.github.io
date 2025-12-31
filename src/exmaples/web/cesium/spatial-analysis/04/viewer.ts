import {
	Cartesian3,
	Math as CesiumMath,
	CesiumTerrainProvider,
	EllipsoidTerrainProvider,
	ScreenSpaceEventType,
	UrlTemplateImageryProvider,
	Viewer,
} from "cesium";
import CesiumNavigation, {
	type NavigationOptions,
} from "cesium-navigation-es6";
import { GUI } from "dat.gui";
import MeasureTool from "./MeasureTool";

/**
 * 空间测量工具
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

	// 开启深度检测
	viewer.scene.globe.depthTestAgainstTerrain = true;

	// 添加影像图层
	const xyz = new UrlTemplateImageryProvider({
		url: "//data.mars3d.cn/tile/img/{z}/{x}/{y}.jpg",
	});
	viewer.imageryLayers.addImageryProvider(xyz);

	// 异步加载地形
	CesiumTerrainProvider.fromUrl("//data.mars3d.cn/terrain", {
		requestWaterMask: true,
		requestVertexNormals: true,
	})
		.then((terrainProvider) => {
			viewer.scene.terrainProvider = terrainProvider;
			console.log("地形加载成功");
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

	// 设置初始视角
	viewer.camera.setView({
		destination: Cartesian3.fromDegrees(98.685331, 27.780325, 7318.6),
		orientation: {
			heading: CesiumMath.toRadians(73),
			pitch: CesiumMath.toRadians(-52.2),
			roll: 0.0,
		},
	});

	// 创建测量工具实例
	const measureTool = new MeasureTool({
		viewer,
		onMeasureStart: () => {
			(viewer.container as HTMLElement).style.cursor = "crosshair";
		},
		onMeasureEnd: () => {
			(viewer.container as HTMLElement).style.cursor = "";
		},
	});

	// 创建 dat.gui 控制面板
	const gui = new GUI();
	gui.domElement.style.position = "fixed";
	gui.domElement.style.top = "50%";
	gui.domElement.style.transform = "translateY(-50%)";
	gui.domElement.style.left = "0";

	// 控制参数
	const controls = {
		空间距离: () => {
			measureTool.measureLineSpace();
		},
		地表距离: () => {
			measureTool.measureGroundDistance();
		},
		地表面积: () => {
			measureTool.measureAreaSpace();
		},
		高度差: () => {
			measureTool.measureAltitude();
		},
		三角测量: () => {
			measureTool.measureTriangle();
		},
		方位角: () => {
			measureTool.measureAngle();
		},
		清除结果: () => {
			measureTool.clear();
		},
	};

	// 创建GUI控制器
	const measureFolder = gui.addFolder("测量工具");
	measureFolder.add(controls, "空间距离");
	measureFolder.add(controls, "地表距离");
	measureFolder.add(controls, "地表面积");
	measureFolder.add(controls, "高度差");
	measureFolder.add(controls, "三角测量");
	measureFolder.add(controls, "方位角");
	measureFolder.add(controls, "清除结果");
	measureFolder.open();

	// 添加说明
	console.log("空间测量工具已加载");
	console.log("提示：左键点击开始测量，右键结束测量");

	// 清理函数
	const cleanup = () => {
		measureTool.clear();
	};

	return { viewer, gui, cleanup };
}
