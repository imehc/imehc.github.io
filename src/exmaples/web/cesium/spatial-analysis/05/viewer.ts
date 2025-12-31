import {
	Cartesian3,
	EllipsoidTerrainProvider,
	Math as CesiumMath,
	type MaterialProperty,
	UrlTemplateImageryProvider,
	Viewer,
} from "cesium";
import CesiumNavigation, {
	type NavigationOptions,
} from "cesium-navigation-es6";
import { GUI } from "dat.gui";

/**
 * 视频投影示例
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

	// 添加导航控件
	const options = {
		enableCompass: true,
		enableZoomControls: true,
	} satisfies NavigationOptions;
	new CesiumNavigation(viewer, options);

	// 设置初始视角 (武汉区域 - 与视频投影位置一致)
	viewer.camera.setView({
		destination: Cartesian3.fromDegrees(114.260, 30.575, 500),
		orientation: {
			heading: CesiumMath.toRadians(0),
			pitch: CesiumMath.toRadians(-45),
			roll: 0.0,
		},
	});

	// 创建 dat.gui 控制面板
	const gui = new GUI();
	gui.domElement.style.position = "fixed";
	gui.domElement.style.top = "50%";
	gui.domElement.style.transform = "translateY(-50%)";
	gui.domElement.style.left = "0";

	// 视频控制状态
	let currentVideoInstance: any = null;
	let currentVideoElement: HTMLVideoElement | null = null;

	// 视频配置
	const videoConfig = {
		mode: 'video', // 'video' or 'liveVideo'
	};

	// 清理当前视频
	const cleanupCurrentVideo = () => {
		if (currentVideoInstance) {
			currentVideoInstance.clearAll();
			currentVideoInstance = null;
		}
		if (currentVideoElement) {
			currentVideoElement.pause();
			currentVideoElement.remove();
			currentVideoElement = null;
		}
		// 清除所有实体
		viewer.entities.removeAll();
	};

	// 加载视频的函数
	const loadVideoMode = () => {
		cleanupCurrentVideo();
		if (videoConfig.mode === 'video') {
			currentVideoElement = loadVideo(viewer, el);
		} else {
			const result = loadLiveVideo(viewer, el);
			currentVideoInstance = result.videoInstance;
			currentVideoElement = result.videoElement;
		}
	};

	// 添加GUI控制
	gui.add(videoConfig, 'mode', ['video', 'liveVideo'])
		.name('视频模式')
		.onChange(() => {
			loadVideoMode();
		});

	// 初始加载视频
	loadVideoMode();

	// 清理函数
	const cleanup = () => {
		cleanupCurrentVideo();
	};

	return { viewer, gui, cleanup };
}

function loadVideo(viewer: Viewer, container: HTMLElement): HTMLVideoElement {
	// 示例视频URL，实际使用时需要替换为有效的视频URL
	const videoUrl =
		"/cesium/spatial-analysis/05/video.mp4";
	const video = document.createElement('video');
	video.id = 'video_dom';
	video.preload = 'auto';
	video.autoplay = true;
	video.loop = true;
	video.muted = true; // 静音以允许自动播放
	video.crossOrigin = 'anonymous'; // 允许跨域访问
	video.style.display = 'none'; // 隐藏视频元素
	video.style.transform = 'rotate(180deg)'; // 旋转180度
	video.style.position = 'absolute';

	// 创建源元素
	const source = document.createElement('source');
	source.src = videoUrl;
	source.type = 'video/mp4';

	// 将源添加到视频元素
	video.appendChild(source);

	// 添加到 DOM
	container.appendChild(video);

	// 等待视频加载完成后创建多边形
	video.addEventListener('loadedmetadata', () => {
		video.play().then(() => {
			createVideoPolygons(viewer, video);
		}).catch(error => {
			console.error('视频播放失败:', error);
		});
	});

	return video;
}

function createVideoPolygons(viewer: Viewer, video: HTMLVideoElement) {
	const lt = [
		114.25985245208585, 30.5752892693654, 14.23,
		114.25923491594841, 30.5752027998838, 13.62,
		114.25922774520328, 30.5752225398922, 47.51,
		114.25985290311769, 30.5753018567495, 47.57,
		114.25985245208585, 30.5752892693617, 14.23
	]
	viewer.entities.add({
		polygon: {
			hierarchy: Cartesian3.fromDegreesArrayHeights(lt),
			material: video as unknown as MaterialProperty,
			perPositionHeight: true,
			outline: true
		}
	});

	const pm = [114.26109123956515, 30.575196063095532, 114.26002868416131, 30.575029970052253,
		114.25995067898559, 30.575610284720895, 114.26093508652325, 30.57571375633287, 114.26109123956515,
		30.575196063095532
	]

	viewer.entities.add({
		polygon: {
			hierarchy: Cartesian3.fromDegreesArray(pm),
			material: video as unknown as MaterialProperty
		}
	});

	viewer.zoomTo(viewer.entities);
}

function loadLiveVideo(viewer: Viewer, container: HTMLElement): { videoInstance: any; videoElement: HTMLVideoElement } {
	// 创建视频元素用于HLS直播流
	const videoElement = document.createElement('video');
	videoElement.id = 'video_dom';
	videoElement.preload = 'auto';
	videoElement.autoplay = true;
	videoElement.muted = true; // 静音以允许自动播放
	videoElement.loop = true;
	videoElement.style.display = 'none'; // 隐藏视频元素
	videoElement.style.transform = 'rotate(180deg)'; // 旋转180度
	videoElement.style.position = 'absolute';

	// 添加到 DOM
	container.appendChild(videoElement);

	// HLS直播流地址 (示例地址，实际使用时需要替换为有效的HLS流地址)
	const videoSrc = 'https://sqhls2.ys7.com:7989/v3/openlive/FX4619647_2_1.m3u8?expire=1778830562&id=844961679353290752&t=c843557c001d3a833dfb4f5ab347d319f3847d85b63fb1642bf52e754517a28a&ev=100&u=4bcf089e4d424b9583ac48430a7ef177';

	// 视频投影配置 (与参考HTML中的配置一致，但使用武汉附近的坐标)
	const options = {
		horizontalViewAngle: 60, // 水平视角
		verticalViewAngle: 40,   // 垂直视角
		video: "video_dom",       // 视频元素ID
		viewPosition: Cartesian3.fromDegrees(114.260, 30.575, 515), // 观察位置
		viewPositionEnd: Cartesian3.fromDegrees(114.252, 30.576, 270), // 观察终点
	};

	// 创建视频投影实例
	const videoInstance = new video(viewer, options);
	videoInstance.drawVideo();

	// 使用HLS.js加载直播流
	if (Hls.isSupported()) {
		const hls = new Hls();
		hls.loadSource(videoSrc);
		hls.attachMedia(videoElement);
		hls.on(Hls.Events.MANIFEST_PARSED, () => {
			videoElement.play().catch(error => {
				console.error('HLS视频播放失败:', error);
			});
		});
	} else if (videoElement.canPlayType('application/vnd.apple.mpegurl')) {
		// Safari浏览器原生支持HLS
		videoElement.src = videoSrc;
		videoElement.addEventListener('loadedmetadata', () => {
			videoElement.play().catch(error => {
				console.error('视频播放失败:', error);
			});
		});
	} else {
		console.error('浏览器不支持HLS播放');
	}

	return { videoInstance, videoElement };
}