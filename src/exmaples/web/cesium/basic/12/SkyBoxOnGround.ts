import type { Scene } from "cesium";
import SkyBox from "./cesium-modified/Scene/SkyBox.js";

interface SkyBoxOnGroundSources {
	positiveX: string;
	negativeX: string;
	positiveY: string;
	negativeY: string;
	positiveZ: string;
	negativeZ: string;
}

export interface SkyBoxOnGroundOption {
	sources: SkyBoxOnGroundSources;
	show?: boolean;
	maxHeight?: number; // 最大高度（米），超过此高度将切换回默认天空盒
}

export default class SkyBoxOnGround {
	private scene: Scene;
	private option: SkyBoxOnGroundOption;
	private groundSkyBox = null;
	private defaultSkyBox = null;
	private removePostRenderListener: (() => void) | null = null;
	private isDestroyed = false;

	constructor(scene: Scene, option: SkyBoxOnGroundOption) {
		this.scene = scene;
		this.option = {
			show: option.show ?? true,
			maxHeight: option.maxHeight ?? 10000, // 默认10km
			sources: option.sources,
		};

		// 保存默认天空盒
		this.defaultSkyBox = this.scene.skyBox;

		// 创建近地天空盒
		this.groundSkyBox = new SkyBox({
			sources: this.option.sources,
			show: this.option.show ?? true,
		});

		// 初始化时根据相机高度设置天空盒
		this.updateSkyBox();

		// 监听相机高度变化
		this.setupCameraHeightListener();
	}

	/**
	 * 设置相机高度监听器
	 */
	private setupCameraHeightListener() {
		const postRender = this.scene.postRender;
		const listener = () => {
			if (!this.isDestroyed) {
				this.updateSkyBox();
			}
		};
		postRender.addEventListener(listener);

		// 保存移除监听器的函数
		this.removePostRenderListener = () => {
			postRender.removeEventListener(listener);
		};
	}

	/**
	 * 根据相机高度更新天空盒显示
	 */
	private updateSkyBox() {
		const cameraHeight = this.scene.camera.positionCartographic.height;
		const maxHeight = this.option.maxHeight ?? 10000;

		if (cameraHeight <= maxHeight) {
			// 低空：显示近地天空盒，隐藏默认天空盒和大气层
			if (this.scene.skyBox !== this.groundSkyBox) {
				this.scene.skyBox = this.groundSkyBox;
			}
			this.scene.skyAtmosphere.show = false;
		} else {
			// 高空：显示默认天空盒，显示大气层
			if (this.scene.skyBox !== this.defaultSkyBox) {
				this.scene.skyBox = this.defaultSkyBox;
			}
			this.scene.skyAtmosphere.show = true;
		}
	}

	/**
	 * 设置是否显示近地天空盒
	 */
	setShow(show: boolean) {
		this.option.show = show;
		if (this.groundSkyBox) {
			this.groundSkyBox.show = show;
		}
	}

	/**
	 * 设置最大高度阈值
	 */
	setMaxHeight(height: number) {
		this.option.maxHeight = height;
		this.updateSkyBox();
	}

	/**
	 * 销毁资源
	 */
	destroy() {
		if (this.isDestroyed) {
			return;
		}

		// 移除相机监听器
		if (this.removePostRenderListener) {
			this.removePostRenderListener();
			this.removePostRenderListener = null;
		}

		// 销毁近地天空盒
		if (this.groundSkyBox?.destroy) {
			this.groundSkyBox.destroy();
			this.groundSkyBox = null;
		}

		// 恢复默认天空盒和大气层
		if (this.defaultSkyBox) {
			this.scene.skyBox = this.defaultSkyBox;
			this.scene.skyAtmosphere.show = true;
		}

		this.isDestroyed = true;
	}
}
