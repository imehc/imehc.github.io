import { SkyBox as CesiumSkyBox, type Viewer } from "cesium";
import SkyBoxOnGround, { type SkyBoxOnGroundOption } from "./SkyBoxOnGround";

export default class SkyBox {
	private viewer: Viewer;
	private defaultSkyBox: CesiumSkyBox | null = null;
	private skyBoxOnGroundInstance: SkyBoxOnGround | null = null;

	constructor(viewer: Viewer) {
		this.viewer = viewer;
		this.defaultSkyBox = this.viewer.scene.skyBox;
	}

	/** 自定义天空盒 */
	customSkyBox(sources: unknown) {
		this.viewer.scene.skyBox = new CesiumSkyBox({
			sources: sources,
		});
	}

	/** 移除自定义天空盒，恢复默认 */
	removeCustomSkyBox() {
		// 先移除近地天空盒
		if (this.skyBoxOnGroundInstance) {
			this.skyBoxOnGroundInstance.destroy();
			this.skyBoxOnGroundInstance = null;
		}

		// 恢复默认天空盒
		this.viewer.scene.skyBox = this.defaultSkyBox;
		this.viewer.scene.skyAtmosphere.show = true;
	}

	/**
	 * 近地天空盒
	 * 创建一个跟随相机移动的天空盒，用于近地视角的场景
	 * 当相机高度超过 maxHeight 时，自动切换回默认天空盒
	 */
	skyBoxOnGround(option: SkyBoxOnGroundOption) {
		// 先清理已存在的近地天空盒
		if (this.skyBoxOnGroundInstance) {
			this.skyBoxOnGroundInstance.destroy();
		}

		// 初始化时不隐藏默认天空盒，让 SkyBoxOnGround 根据高度自动管理
		// 创建新的近地天空盒
		this.skyBoxOnGroundInstance = new SkyBoxOnGround(this.viewer.scene, option);
	}
}
