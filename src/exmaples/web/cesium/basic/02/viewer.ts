import {
	type Cartesian2,
	Cesium3DTileset,
	Color,
	defined,
	EllipsoidTerrainProvider,
	PostProcessStageLibrary,
	ScreenSpaceEventType,
	UrlTemplateImageryProvider,
	Viewer,
} from "cesium";
import "cesium/Build/Cesium/Widgets/widgets.css";

/**
 * 3D Tiles
 *
 * @param el - 用于承载 Cesium Viewer 的 HTML 元素
 * @returns 返回配置好的 Viewer 实例
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
	viewer.scene.terrainProvider = new EllipsoidTerrainProvider({}); //移除默认地形
	const xyz = new UrlTemplateImageryProvider({
		url: "//data.mars3d.cn/tile/img/{z}/{x}/{y}.jpg",
	});
	viewer.imageryLayers.addImageryProvider(xyz);

	return viewer;
}

export async function loadFiles(viewer: Viewer) {
	try {
		const tileset = await Cesium3DTileset.fromUrl("/cesium/02/data/tileset.json")
		tileset.debugShowBoundingVolume = true;
		viewer.scene.primitives.add(tileset);
		viewer.zoomTo(tileset);
		// 取消默认的单击和双击事件
		viewer.cesiumWidget.screenSpaceEventHandler.removeInputAction(
			ScreenSpaceEventType.LEFT_CLICK,
		);
		viewer.cesiumWidget.screenSpaceEventHandler.removeInputAction(
			ScreenSpaceEventType.LEFT_DOUBLE_CLICK,
		);

		// const handler = new ScreenSpaceEventHandler(viewer.scene.canvas);
		// handler.setInputAction(function (clickEvent) {

		// }, ScreenSpaceEventType.LEFT_CLICK)
		// 鼠标移动选择开始
		const silhouetteBlue = PostProcessStageLibrary.createEdgeDetectionStage();
		silhouetteBlue.uniforms.color = Color.BLUE;
		silhouetteBlue.uniforms.length = 0.01;
		silhouetteBlue.selected = [];

		const silhouetteGreen = PostProcessStageLibrary.createEdgeDetectionStage();
		silhouetteGreen.uniforms.color = Color.LIME;
		silhouetteGreen.uniforms.length = 0.01;
		silhouetteGreen.selected = [];
		viewer.scene.postProcessStages.add(
			PostProcessStageLibrary.createSilhouetteStage([
				silhouetteBlue,
				silhouetteGreen,
			]),
		);

		viewer.screenSpaceEventHandler.setInputAction(
			function onMouseMove(movement: { endPosition: Cartesian2 }) {
				var pickedFeature = viewer.scene.pick(movement.endPosition);
				if (defined(pickedFeature)) {
					if (pickedFeature === silhouetteGreen.selected[0]) {
						silhouetteBlue.selected = [];
					} else {
						silhouetteBlue.selected = [pickedFeature];
					}
				}
			},
			ScreenSpaceEventType.MOUSE_MOVE,
		);

		const highlighted = {
			feature: undefined,
			originalColor: new Color()
		};

		viewer.screenSpaceEventHandler.setInputAction(function leftClick(movement: { position: Cartesian2; }) {
			var pickedFeature = viewer.scene.pick(movement.position);
			if (defined(pickedFeature)) {
				silhouetteGreen.selected = [pickedFeature];
			}
			// 如果之前有高亮要素，则恢复其原始颜色
			if (defined(highlighted.feature)) {
				highlighted.feature.color = highlighted.originalColor;
				highlighted.feature = undefined;
			}

			// 如果未选中任何要素，则直接返回
			if (!defined(pickedFeature)) {
				return;
			}

			// 存储当前选中要素的原始颜色，并应用新的高亮颜色
			highlighted.feature = pickedFeature;
			if (defined(pickedFeature.color)) { // 确保feature有color属性
				Color.clone(pickedFeature.color, highlighted.originalColor);
				pickedFeature.color = Color.YELLOW; // 设置为高亮颜色，例如黄色
			}
		}, ScreenSpaceEventType.LEFT_CLICK);
		// 鼠标移动选择结束
	} catch (error) {
		console.error(error);
	}
}
