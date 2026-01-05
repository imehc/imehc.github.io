import {
	Cartesian3,
	Math as CesiumMath,
	Color,
	EllipsoidTerrainProvider,
	UrlTemplateImageryProvider,
	Viewer,
} from "cesium";
import CesiumNavigation, {
	type NavigationOptions,
} from "cesium-navigation-es6";
import { GUI } from "dat.gui";
import Cloud from "./cloud";
import Lightning from "./lightning";
import SkyBox from "./sky-box";
import type { WeatherOption } from "./weather";
import Weather from "./weather";

/**
 * 场景
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
		contextOptions: {
			webgl: {
				alpha: true,
			},
		},
	});
	viewer.scene.globe.depthTestAgainstTerrain = true; // 启用深度检测
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

	// 创建 dat.gui 控制面板
	const gui = new GUI();
	gui.domElement.style.position = "fixed";
	gui.domElement.style.top = "50%";
	gui.domElement.style.transform = "translateY(-50%)";
	gui.domElement.style.left = "0";

	let weather: Weather | null = null;
	let skyBox: SkyBox | null = null;
	let cloud: Cloud | null = null;
	let lightning: Lightning | null = null;

	const controls = {
		场景类型: "雨",
	};

	const cloudControls = {
		x轴: 25,
		y轴: 12,
		亮度: 1,
	};

	let cloudFolder: GUI | null = null;

	const sceneTypes = {
		雨: () => {
			renderDefault({ name: "雨", type: "rain" });
		},
		雪: () => {
			renderDefault({ name: "雪", type: "snow" });
		},
		// 雾: () => {
		// 	renderDefault({ name: "雾", type: "fog" });
		// },
		闪电: () => {
			removeAll(weather, skyBox);
			viewer.camera.setView({
				destination: Cartesian3.fromDegrees(-95.166493, 39.9060534, 2000000),
			});
			skyBox = null;
			cloud = null;
			const { weather: a, lightning: b } = loadLightning(viewer);
			weather = a;
			lightning = b;
		},
		云: () => {
			removeAll(weather, skyBox);
			viewer.camera.flyTo({
				destination: Cartesian3.fromDegrees(114.401867, 30.520423, 243.7),
				duration: 2,
				orientation: {
					heading: CesiumMath.toRadians(281.8),
					pitch: CesiumMath.toRadians(-6.6),
					roll: 0.0,
				},
			});
			cloud = loadCloud(viewer);
			weather = null;
			skyBox = null;
			lightning = null;

			// 移除旧的云控制文件夹
			if (cloudFolder) {
				gui.removeFolder(cloudFolder);
			}

			// 添加云参数控制
			cloudFolder = gui.addFolder("云参数");
			cloudFolder
				.add(cloudControls, "x轴", 1, 100)
				.name("X轴")
				.onChange((value: number) => {
					if (cloud) {
						cloud.update(value, cloudControls.y轴, cloudControls.亮度);
					}
				});
			cloudFolder
				.add(cloudControls, "y轴", 1, 100)
				.name("Y轴")
				.onChange((value: number) => {
					if (cloud) {
						cloud.update(cloudControls.x轴, value, cloudControls.亮度);
					}
				});
			cloudFolder
				.add(cloudControls, "亮度", 0, 2)
				.name("亮度")
				.onChange((value: number) => {
					if (cloud) {
						cloud.update(cloudControls.x轴, cloudControls.y轴, value);
					}
				});
			cloudFolder.open();
		},
		天空盒: () => {
			removeAll(weather, skyBox);
			viewer.camera.flyHome(1);
			weather = null;
			cloud = null;
			lightning = null;
			skyBox = loadSkyBox(viewer);
		},
		"近地天空盒-蓝天": () => {
			renderOnGround("lantian");
		},
		"近地天空盒-晴天": () => {
			renderOnGround("qingtian");
		},
		"近地天空盒-晚霞": () => {
			renderOnGround("wanxia");
		},
		背景图: () => {
			removeAll(weather, skyBox);
			viewer.camera.flyHome(1);
			loadBackgroundImage(viewer);
			weather = null;
			skyBox = null;
			cloud = null;
			lightning = null;
		},
	};

	function renderDefault(option?: WeatherOption) {
		removeAll(weather, skyBox);
		viewer.camera.setView({
			destination: Cartesian3.fromDegrees(-95.166493, 39.9060534, 2000000),
		});
		weather = loadSceneType(viewer, option);
		skyBox = null;
		cloud = null;
		lightning = null;
	}

	function renderOnGround(type: OnGroundType) {
		removeAll(weather, skyBox);
		viewer.camera.flyTo({
			destination: Cartesian3.fromDegrees(-95.166493, 39.9060534, 20000),
		});

		viewer.camera.flyTo({
			destination: Cartesian3.fromDegrees(-95.166493, 39.9060534, 3336.6),
			orientation: {
				heading: CesiumMath.toRadians(351.2), // 水平旋转，围绕Y轴，0为正北方向
				pitch: CesiumMath.toRadians(-6.7), // 上下旋转，围绕X轴，-90为俯视地面
				roll: 0.0, // 视口的翻滚角度，围绕Z轴，0为不翻转
			},
		});
		skyBox = loadSkyBox(viewer, type, true);
		weather = null;
		cloud = null;
		lightning = null;
	}

	/**
	 * 清理场景中的天气效果和天空盒
	 * @param weather - 天气效果实例
	 * @param skyBox - 天空盒实例
	 */
	function removeAll(weather: Weather | null, skyBox: SkyBox | null) {
		if (weather) {
			weather.removePostProcessStage();
		}
		if (skyBox) {
			skyBox.removeCustomSkyBox();
		}
		if (cloud) {
			cloud.destroy();
		}
		if (lightning) {
			lightning.destroy();
		}
		// 移除云控制文件夹
		if (cloudFolder) {
			gui.removeFolder(cloudFolder);
			cloudFolder = null;
		}
		(viewer.scene.canvas as HTMLCanvasElement).style.backgroundImage = ""; //清除背景图片
		viewer.scene.skyBox.show = true; //显示天空盒
		viewer.scene.backgroundColor = Color.BLACK; //恢复默认背景色
	}

	// 添加模型类型切换控制
	gui
		.add(controls, "场景类型", Object.keys(sceneTypes))
		.name("场景类型")
		.onChange((value: keyof typeof sceneTypes) => {
			sceneTypes[value]();
		});

	renderDefault({ name: "雨", type: "rain" });
	return viewer;
}

type OnGroundType = "lantian" | "qingtian" | "wanxia";

function loadSceneType(viewer: Viewer, option?: WeatherOption) {
	return new Weather(viewer, option);
}

function loadSkyBox(viewer: Viewer, type?: OnGroundType, onGround = false) {
	const skyBox = new SkyBox(viewer);
	if (!onGround) {
		skyBox.customSkyBox({
			positiveX: "/cesium/basic/12/SkyBox/tycho2t3_80_px.jpg",
			negativeX: "/cesium/basic/12/SkyBox/tycho2t3_80_mx.jpg",
			positiveY: "/cesium/basic/12/SkyBox/tycho2t3_80_py.jpg",
			negativeY: "/cesium/basic/12/SkyBox/tycho2t3_80_my.jpg",
			positiveZ: "/cesium/basic/12/SkyBox/tycho2t3_80_pz.jpg",
			negativeZ: "/cesium/basic/12/SkyBox/tycho2t3_80_mz.jpg",
		});
	} else {
		switch (type) {
			case "lantian":
				skyBox.skyBoxOnGround({
					sources: {
						positiveX: "/cesium/basic/12/ground/lantian/Right.jpg",
						negativeX: "/cesium/basic/12/ground/lantian/Left.jpg",
						positiveY: "/cesium/basic/12/ground/lantian/Front.jpg",
						negativeY: "/cesium/basic/12/ground/lantian/Back.jpg",
						positiveZ: "/cesium/basic/12/ground/lantian/Up.jpg",
						negativeZ: "/cesium/basic/12/ground/lantian/Down.jpg",
					},
					maxHeight: 50000, // 在 50km 以下显示近地天空盒
				});
				break;
			case "qingtian":
				skyBox.skyBoxOnGround({
					sources: {
						positiveX: "/cesium/basic/12/ground/qingtian/rightav9.jpg",
						negativeX: "/cesium/basic/12/ground/qingtian/leftav9.jpg",
						positiveY: "/cesium/basic/12/ground/qingtian/frontav9.jpg",
						negativeY: "/cesium/basic/12/ground/qingtian/backav9.jpg",
						positiveZ: "/cesium/basic/12/ground/qingtian/topav9.jpg",
						negativeZ: "/cesium/basic/12/ground/qingtian/bottomav9.jpg",
					},
					maxHeight: 50000, // 在 50km 以下显示近地天空盒
				});
				break;
			case "wanxia":
				skyBox.skyBoxOnGround({
					sources: {
						positiveX: "/cesium/basic/12/ground/wanxia/SunSetRight.png",
						negativeX: "/cesium/basic/12/ground/wanxia/SunSetLeft.png",
						positiveY: "/cesium/basic/12/ground/wanxia/SunSetFront.png",
						negativeY: "/cesium/basic/12/ground/wanxia/SunSetBack.png",
						positiveZ: "/cesium/basic/12/ground/wanxia/SunSetUp.png",
						negativeZ: "/cesium/basic/12/ground/wanxia/SunSetDown.png",
					},
					maxHeight: 50000, // 在 50km 以下显示近地天空盒
				});
				break;
		}
	}
	return skyBox;
}

function loadBackgroundImage(viewer: Viewer) {
	viewer.scene.canvas.style.backgroundImage =
		"url('/cesium/basic/12/backGroundImg.jpg')"; //设置背景图片
	viewer.scene.skyBox.show = false; //不显示天空盒
	viewer.scene.backgroundColor = new Color(0.0, 0.0, 0.0, 0.0); //设置背景色透明
}

function loadCloud(viewer: Viewer) {
	return new Cloud(viewer);
}

function loadLightning(viewer: Viewer) {
	const lightning = new Lightning(viewer);
	lightning.add({
		mix_factor: 0.35,
		fall_interval: 0.8,
	});
	return {
		weather: new Weather(viewer, { name: "雨", type: "rain" }),
		lightning: lightning,
	};
}
