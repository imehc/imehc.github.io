import {
	Cartesian3,
	Math as CesiumMath,
	CesiumTerrainProvider,
	EllipsoidTerrainProvider,
	HeadingPitchRoll,
	ScreenSpaceEventType,
	Transforms,
	UrlTemplateImageryProvider,
	Viewer,
} from "cesium";
import CesiumNavigation, {
	type NavigationOptions,
} from "cesium-navigation-es6";
import { GUI } from "dat.gui";
import positions from "./positions";

/**
 * 3D 模型加载与地形贴合
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

	// 创建 dat.gui 控制面板
	const gui = new GUI();
	gui.domElement.style.position = "fixed";
	gui.domElement.style.bottom = "50%";
	gui.domElement.style.transform = "translateY(-50%)";
	gui.domElement.style.left = "0";

	// 示例配置
	const controls = {
		模型类型: "fengche",
	};

	// 可用的模型类型
	const modelTypes = {
		fengche: () => {
			loadFengcheModel(viewer);
		},
		pudong: () => {
			loadShanghaipudongModel(viewer);
		},
	};

	// 添加模型类型切换控制
	gui
		.add(controls, "模型类型", Object.keys(modelTypes))
		.name("模型类型")
		.onChange((value: keyof typeof modelTypes) => {
			modelTypes[value]();
		});

	// 默认加载风车模型
	loadFengcheModel(viewer);

	return { viewer, gui };
}

function removeEntities(viewer: Viewer) {
	// 清除所有实体
	viewer.entities.removeAll();
}

function loadShanghaipudongModel(viewer: Viewer) {
	removeEntities(viewer);
	const position = Cartesian3.fromDegrees(121.507762, 31.233975, 200); // 上海
	const heading = CesiumMath.toRadians(215); // 方向角，顺时针从北开始计算
	const pitch = CesiumMath.toRadians(0); // 俯仰角，水平线为0，向上为正，向下为负
	const roll = CesiumMath.toRadians(0); // 横滚角，绕前后轴旋转，右侧机翼向下为正，左侧机翼向下为负
	const hpr = new HeadingPitchRoll(heading, pitch, roll); // 创建一个 HeadingPitchRoll 实例
	const orientation = Transforms.headingPitchRollQuaternion(position, hpr); // 创建一个四元数

	const entity = viewer.entities.add({
		position: position,
		orientation: orientation,
		model: {
			// uri: "https://data.mars3d.cn/gltf/mars/shanghai/pudong/scene.gltf",
			uri: "/cesium/09/scene/scene.gltf",
			scale: 520,
		},
	});

	viewer.flyTo(entity);
}

async function loadFengcheModel(viewer: Viewer) {
	removeEntities(viewer);
	// 先加载地形
	const terrainProvider = await CesiumTerrainProvider.fromUrl(
		"//data.mars3d.cn/terrain",
	);
	viewer.terrainProvider = terrainProvider;

	viewer.camera.setView({
		destination: Cartesian3.fromDegrees(112.245269, 39.066518, 2913),
		orientation: {
			heading: CesiumMath.toRadians(226),
			pitch: CesiumMath.toRadians(-21),
			roll: 0.0,
		},
	});
	positions.forEach((item) => {
		const position = Cartesian3.fromDegrees(item.lng, item.lat, item.alt);
		const heading = CesiumMath.toRadians(135);
		const pitch = CesiumMath.toRadians(0);
		const roll = CesiumMath.toRadians(0);

		const hpr = new HeadingPitchRoll(heading, pitch, roll);
		const orientation = Transforms.headingPitchRollQuaternion(position, hpr);

		viewer.entities.add({
			position: position,
			orientation: orientation,
			model: {
				// uri: "https://data.mars3d.cn/gltf/mars/fengche.gltf",
				uri: "/cesium/09/fengche/fengche.gltf",
				scale: 40,
				runAnimations: true,
			},
		});
	});

	viewer.clock.shouldAnimate = true;

	viewer.flyTo(viewer.entities);
}
