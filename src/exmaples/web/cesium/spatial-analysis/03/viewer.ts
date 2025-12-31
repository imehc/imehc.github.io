import {
	Cartesian3,
	Cartographic,
	Math as CesiumMath,
	CesiumTerrainProvider,
	EllipsoidTerrainProvider,
	ScreenSpaceEventHandler,
	ScreenSpaceEventType,
	UrlTemplateImageryProvider,
	Viewer,
} from "cesium";
import CesiumNavigation, {
	type NavigationOptions,
} from "cesium-navigation-es6";
import { GUI } from "dat.gui";
import { toast } from "sonner";
import SightlineAnalysis from "./SightlineAnalysis";

/**
 * 通视分析
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

	// 创建 dat.gui 控制面板
	const gui = new GUI();
	gui.domElement.style.position = "fixed";
	gui.domElement.style.top = "50%";
	gui.domElement.style.transform = "translateY(-50%)";
	gui.domElement.style.left = "0";

	// 通视分析实例
	let sightlineAnalysis: SightlineAnalysis | null = null;

	// 控制参数
	const controls = {
		// 观测点坐标
		startLng: 98.71707797694049,
		startLat: 27.77729970463954,
		startHeight: 2800.0,
		// 目的点坐标
		endLng: 98.71707797694049,
		endLat: 27.80729970463954,
		endHeight: 3500.0,
		// 分析结果
		visible: false,
		visibleDistance: 0,
		totalDistance: 0,
		// 操作
		创建分析: () => {
			// 清除旧的分析
			if (sightlineAnalysis) {
				sightlineAnalysis.clear();
			}

			// 创建新的分析
			const startPoint = Cartesian3.fromDegrees(
				controls.startLng,
				controls.startLat,
				controls.startHeight,
			);
			const endPoint = Cartesian3.fromDegrees(
				controls.endLng,
				controls.endLat,
				controls.endHeight,
			);

			sightlineAnalysis = new SightlineAnalysis({
				viewer,
				startPoint,
				endPoint,
			});

			console.log("通视分析已创建");
		},
		执行分析: () => {
			if (!sightlineAnalysis) {
				toast.warning("请先创建分析");
				console.warn("请先创建分析");
				return;
			}

			const result = sightlineAnalysis.analyze();
			controls.visible = result.visible;
			controls.visibleDistance = Number.parseFloat(
				result.visibleDistance.toFixed(2),
			);
			controls.totalDistance = Number.parseFloat(
				result.totalDistance.toFixed(2),
			);

			toast.info(`通视分析结果: ${result.visible ? "可见" : "不可见"}`);
			console.log(`通视分析结果: ${result.visible ? "可见" : "不可见"}`);
			console.log(`可见距离: ${controls.visibleDistance}m`);
			console.log(`总距离: ${controls.totalDistance}m`);

			if (!result.visible) {
				const barrierCartographic = Cartographic.fromCartesian(
					result.barrierPoint,
				);
				console.log(
					`障碍点坐标: lng=${CesiumMath.toDegrees(barrierCartographic.longitude)}, lat=${CesiumMath.toDegrees(barrierCartographic.latitude)}, height=${barrierCartographic.height}`,
				);
			}
		},
		清除: () => {
			if (sightlineAnalysis) {
				sightlineAnalysis.clear();
				sightlineAnalysis = null;
			}
			controls.visible = false;
			controls.visibleDistance = 0;
			controls.totalDistance = 0;
			console.log("已清除分析");
		},
	};

	// 创建GUI控制器 - 观测点
	const startFolder = gui.addFolder("观测点设置");
	startFolder
		.add(controls, "startLng", -180, 180, 0.000001)
		.name("经度")
		.listen();
	startFolder
		.add(controls, "startLat", -90, 90, 0.000001)
		.name("纬度")
		.listen();
	startFolder
		.add(controls, "startHeight", 0, 10000, 10)
		.name("高度 (米)")
		.listen();
	startFolder.open();

	// 创建GUI控制器 - 目的点
	const endFolder = gui.addFolder("目的点设置");
	endFolder.add(controls, "endLng", -180, 180, 0.000001).name("经度").listen();
	endFolder.add(controls, "endLat", -90, 90, 0.000001).name("纬度").listen();
	endFolder.add(controls, "endHeight", 0, 10000, 10).name("高度 (米)").listen();
	endFolder.open();

	// 创建GUI控制器 - 分析结果
	const resultFolder = gui.addFolder("分析结果");
	resultFolder.add(controls, "visible").name("是否可见").listen();
	resultFolder.add(controls, "visibleDistance").name("可见距离 (米)").listen();
	resultFolder.add(controls, "totalDistance").name("总距离 (米)").listen();
	resultFolder.open();

	// 创建GUI控制器 - 操作
	const actionsFolder = gui.addFolder("操作");
	actionsFolder.add(controls, "创建分析");
	actionsFolder.add(controls, "执行分析");
	actionsFolder.add(controls, "清除");
	actionsFolder.open();

	// 添加鼠标点击事件，用于拾取坐标
	let pickingMode: "start" | "end" | null = null;

	const handler = new ScreenSpaceEventHandler(viewer.scene.canvas);
	handler.setInputAction((movement) => {
		if (!pickingMode) return;

		const cartesian = viewer.camera.pickEllipsoid(
			movement.position,
			viewer.scene.globe.ellipsoid,
		);

		if (!cartesian) return;

		const cartographic = Cartographic.fromCartesian(cartesian);
		const lng = CesiumMath.toDegrees(cartographic.longitude);
		const lat = CesiumMath.toDegrees(cartographic.latitude);

		if (pickingMode === "start") {
			controls.startLng = lng;
			controls.startLat = lat;
			console.log(`观测点坐标已更新: lng=${lng}, lat=${lat}`);
		} else if (pickingMode === "end") {
			controls.endLng = lng;
			controls.endLat = lat;
			console.log(`目的点坐标已更新: lng=${lng}, lat=${lat}`);
		}

		pickingMode = null;
	}, ScreenSpaceEventType.LEFT_CLICK);

	// 添加快捷键提示
	console.log("提示：可以通过GUI面板设置观测点和目的点坐标");

	// 清理函数
	const cleanup = () => {
		if (sightlineAnalysis) {
			sightlineAnalysis.clear();
		}
		handler.destroy();
	};

	return { viewer, gui, cleanup };
}
