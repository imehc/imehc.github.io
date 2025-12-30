import {
	TencentImageryProvider,
	type TencentImageryProviderOptions,
} from "@cesium-china/cesium-map";
import {
	Cesium3DTileset,
	CustomShader,
	EllipsoidTerrainProvider,
	ImageryLayer,
	ScreenSpaceEventType,
	TextureUniform,
	UniformType,
	UrlTemplateImageryProvider,
	VaryingType,
	Viewer,
} from "cesium";
import CesiumNavigation, {
	type NavigationOptions,
} from "cesium-navigation-es6";
import { GUI } from "dat.gui";

/**
 * 自定义 Shader
 *
 * @param el - 用于承载 Cesium Viewer 的 HTML 元素
 * @returns 返回配置好的 Viewer 实例和 GUI
 */

export async function initViewer(el: HTMLElement) {
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
	const layerOptions = {
		crs: "WGS84", // 使用84坐标系，默认为：GCJ02
		style: "4",
	} as unknown as TencentImageryProviderOptions;
	viewer.scene.imageryLayers.add(
		new ImageryLayer(new TencentImageryProvider(layerOptions)),
	);

	// 取消默认的单击和双击事件，右上角弹窗很丑
	viewer.cesiumWidget.screenSpaceEventHandler.removeInputAction(
		ScreenSpaceEventType.LEFT_CLICK,
	);
	viewer.cesiumWidget.screenSpaceEventHandler.removeInputAction(
		ScreenSpaceEventType.LEFT_DOUBLE_CLICK,
	);

	const tileset = await Cesium3DTileset.fromUrl("/cesium/02/data/tileset.json");
	tileset.debugShowBoundingVolume = true;
	viewer.scene.primitives.add(tileset);
	viewer.zoomTo(tileset);

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
		模型类型: "默认",
	};

	// 可用的模型类型
	const modelTypes = {
		默认: () => {
			defaultModel(viewer, tileset);
		},
		纯渐变色: () => {
			pureGradientColor(viewer, tileset);
		},
		"纯渐变色+动态光圈": () => {
			pureGradientColorWithDynamicLight(viewer, tileset);
		},
		贴图: () => {
			texture1(viewer, tileset);
		},
		贴图2: () => {
			texture2(viewer, tileset);
		},
		贴图3: () => {
			texture3(viewer, tileset);
		},
	};

	// 添加模型类型切换控制
	gui
		.add(controls, "模型类型", Object.keys(modelTypes))
		.name("模型类型")
		.onChange((value: keyof typeof modelTypes) => {
			modelTypes[value]();
		});
	defaultModel(viewer, tileset);

	return { viewer, gui };
}

function removeEntities(viewer: Viewer) {
	// 清除所有实体
	viewer.entities.removeAll();
}

// 默认
function defaultModel(viewer: Viewer, tileset: Cesium3DTileset) {
	removeEntities(viewer);
	const customShader = new CustomShader({});
	tileset.customShader = customShader;
}

// 纯渐变色
function pureGradientColor(viewer: Viewer, tileset: Cesium3DTileset) {
	removeEntities(viewer);
	const customShader = new CustomShader({
		// 片元着色器
		fragmentShaderText: `
			void fragmentMain(FragmentInput fsInput, inout czm_modelMaterial material) {
				vec3 positionMC = fsInput.attributes.positionMC;
				material.diffuse = vec3(0.0, 1.0-positionMC.y*0.005, 1.0-positionMC.y*0.0015);
			}
		`,
	});
	tileset.customShader = customShader;
}
// 纯渐变色+动态光圈
function pureGradientColorWithDynamicLight(
	viewer: Viewer,
	tileset: Cesium3DTileset,
) {
	removeEntities(viewer);
	const customShader = new CustomShader({
		// 片元着色器
		fragmentShaderText: `
			void fragmentMain(FragmentInput fsInput, inout czm_modelMaterial material) {
				vec3 positionMC = fsInput.attributes.positionMC;
				material.diffuse = vec3(0.0, 1.0-positionMC.y*0.005, 1.0-positionMC.y*0.0015);

				float _baseHeight = 18.0; // 物体的基础高度，需要修改成一个合适的建筑基础高度
				float _heightRange = 60.0; // 高亮的范围(_baseHeight ~ _baseHeight + _heightRange) 默认是 0-60米
				float _glowRange = 120.0; // 光环的移动范围(高度)

				float vtxf_height = fsInput.attributes.positionMC.y - _baseHeight;
				float vtxf_a11 = fract(czm_frameNumber / 360.0) * 3.14159265 * 2.0; //此处括号内分母为移动速度
				float vtxf_a12 = vtxf_height / _heightRange + sin(vtxf_a11) * 0.1;
				material.diffuse *= vec3(vtxf_a12, vtxf_a12, vtxf_a12);

				float vtxf_a13 = fract(czm_frameNumber / 360.0); //此处括号内分母为移动速度，数值越大，速度越慢
				float vtxf_h = clamp(vtxf_height / _glowRange, 0.0, 1.0);
				vtxf_a13 = abs(vtxf_a13 - 0.5) * 2.0;
				float vtxf_diff = step(0.01, abs(vtxf_h - vtxf_a13)); // 0.1 为高亮光条的范围（粗细）
				material.diffuse += material.diffuse * (1.0 - vtxf_diff);
		}
		`,
	});
	tileset.customShader = customShader;
}
// 贴图1
function texture1(viewer: Viewer, tileset: Cesium3DTileset) {
	removeEntities(viewer);
	const customShader = new CustomShader({
		// lightingModel: Cesium.LightingModel.UNLIT,
		//  lightingModel: Cesium.LightingModel.PBR,
		//设置变量，由顶点着色器传递给片元着色器
		varyings: {
			v_normalMC: VaryingType.VEC3,
			v_st: VaryingType.VEC3,
		},
		//外部传给顶点着色器或者片元着色器
		uniforms: {
			u_texture: {
				value: new TextureUniform({
					url: "/cesium/10/wall.jpg",
				}),
				type: UniformType.SAMPLER_2D,
			},
			u_texture1: {
				value: new TextureUniform({
					url: "/cesium/10/wall1.jpg",
				}),
				type: UniformType.SAMPLER_2D,
			},
		},
		//贴纹理
		//顶点着色器
		//将法向量从顶点着色器设置变量传给片元着色器
		vertexShaderText: `
                    void vertexMain(VertexInput vsInput, inout czm_modelVertexOutput vsOutput) {
                            v_normalMC = vsInput.attributes.normalMC;
                            v_st=vsInput.attributes.positionMC ;   
                }`,
		//片元着色器
		fragmentShaderText: `
                    void fragmentMain(FragmentInput fsInput, inout czm_modelMaterial material) {
                        vec3 positionMC = fsInput.attributes.positionMC;
                        //这里是设置要贴图的图片的尺寸，设置小了会重复
                        float width = 30.0;
                        float height = 70.0;
                        vec3 rgb;
                        //这是是设置了屋顶的颜色，当和法向量平行时，就是屋顶，这里设置0.95，相当于垂直，建筑物四周开始贴图
                        if (dot(vec3(0.0, 1.0, 0.0), v_normalMC) > 0.95) {
                            material.diffuse = vec3(0.65, 0.65, 0.65);
                        } else {
                            float textureX = 0.0;
                            float dotYAxis = dot(vec3(0.0, 0.0, 1.0), v_normalMC);
                            // cos(45deg) 约等于 0.71，这里是建筑物四周的向量与法向量会大于四十五度夹角
                            if (dotYAxis > 0.71 || dotYAxis < -0.71) {
                            //x代表的是前后面
                                textureX = mod(positionMC.x, width) / width;
                            } else {
                            //z代表的是左右面
                                textureX = mod(positionMC.z, width) / width;
                            }
                            float textureY = mod(positionMC.y, height) / height;
                            //我这里是根据建筑物高度贴了两张不同的图片
                            if (positionMC.y > 40.0) {
                                rgb = texture(u_texture, vec2(textureX, textureY)).rgb;       
                            } else {
                                rgb = texture(u_texture1, vec2(textureX, textureY)).rgb;
                            }
                            
                            material.diffuse = rgb;
                        }
                    }`,
	});
	tileset.customShader = customShader;
}
// 贴图2
function texture2(viewer: Viewer, tileset: Cesium3DTileset) {
	removeEntities(viewer);
	const customShader = new CustomShader({
		// lightingModel: Cesium.LightingModel.UNLIT,
		//  lightingModel: Cesium.LightingModel.PBR,
		//设置变量，由顶点着色器传递给片元着色器
		varyings: {
			v_normalMC: VaryingType.VEC3,
			v_st: VaryingType.VEC3,
		},
		//外部传给顶点着色器或者片元着色器
		uniforms: {
			u_texture: {
				value: new TextureUniform({
					url: "/cesium/10/wall.jpg",
				}),
				type: UniformType.SAMPLER_2D,
			},
			u_texture1: {
				value: new TextureUniform({
					url: "/cesium/10/wall.jpg",
				}),
				type: UniformType.SAMPLER_2D,
			},
		},
		//贴纹理
		//顶点着色器
		//将法向量从顶点着色器设置变量传给片元着色器
		vertexShaderText: `
                void vertexMain(VertexInput vsInput, inout czm_modelVertexOutput vsOutput) {
                        v_normalMC = vsInput.attributes.normalMC;
                        v_st=vsInput.attributes.positionMC ;   
                }`,
		//片元着色器
		fragmentShaderText: `
                    void fragmentMain(FragmentInput fsInput, inout czm_modelMaterial material) {
                        vec3 positionMC = fsInput.attributes.positionMC;
                        //这里是设置要贴图的图片的尺寸，设置小了会重复
                        float width = 30.0;
                        float height = 70.0;
                        vec3 rgb;
                        //这是是设置了屋顶的颜色，当和法向量平行时，就是屋顶，这里设置0.95，相当于垂直，建筑物四周开始贴图
                        if (dot(vec3(0.0, 1.0, 0.0), v_normalMC) > 0.95) {
                            material.diffuse = vec3(0.65, 0.65, 0.65);
                        } else {
                            float textureX = 0.0;
                            float dotYAxis = dot(vec3(0.0, 0.0, 1.0), v_normalMC);
                            // cos(45deg) 约等于 0.71，这里是建筑物四周的向量与法向量会大于四十五度夹角
                            if (dotYAxis > 0.71 || dotYAxis < -0.71) {
                            //x代表的是前后面
                                textureX = mod(positionMC.x, width) / width;
                            } else {
                            //z代表的是左右面
                                textureX = mod(positionMC.z, width) / width;
                            }
                            float textureY = mod(positionMC.y, height) / height;
                            //我这里是根据建筑物高度贴了两张不同的图片
                            if (positionMC.y > 30.0) {
                                rgb = texture(u_texture, vec2(textureX, textureY)).rgb;       
                            } else {
                                rgb = texture(u_texture1, vec2(textureX, textureY)).rgb;
                            }
                            
                            material.diffuse = rgb;

                            //此处以下为光线效果
                            float _baseHeight = 10.0; // 物体的基础高度，需要修改成一个合适的建筑基础高度
                            float _glowRange = 120.0; // 光环的移动范围(高度)

                            float vtxf_height = fsInput.attributes.positionMC.y - _baseHeight;

                            float vtxf_a13 = fract(czm_frameNumber / 360.0); //此处括号内分母为移动速度，数值越大，速度越慢
                            float vtxf_h = clamp(vtxf_height / _glowRange, 0.0, 1.0);
                            vtxf_a13 = abs(vtxf_a13 - 0.5) * 2.0;
                            float vtxf_diff = step(0.01, abs(vtxf_h - vtxf_a13)); // 0.1 为高亮光条的范围（粗细）
                            material.diffuse += material.diffuse * (1.0 - vtxf_diff);
                        }
                    }`,
	});

	tileset.customShader = customShader;
}
// 贴图3
function texture3(viewer: Viewer, tileset: Cesium3DTileset) {
	removeEntities(viewer);
	const customShader = new CustomShader({
		varyings: {
			v_normalMC: VaryingType.VEC3,
			v_st: VaryingType.VEC3,
		},
		//外部传给顶点着色器或者片元着色器
		uniforms: {
			u_texture: {
				value: new TextureUniform({
					url: "/cesium/10/wall.jpg",
				}),
				type: UniformType.SAMPLER_2D,
			},
			u_texture1: {
				value: new TextureUniform({
					url: "/cesium/10/wall1.jpg",
				}),
				type: UniformType.SAMPLER_2D,
			},
		},
		//贴纹理
		//顶点着色器
		//将法向量从顶点着色器设置变量传给片元着色器
		vertexShaderText: `
                    void vertexMain(VertexInput vsInput, inout czm_modelVertexOutput vsOutput) {
                            v_normalMC = vsInput.attributes.normalMC;
                            v_st=vsInput.attributes.positionMC ;   
                }`,
		//片元着色器
		fragmentShaderText: `
                    void fragmentMain(FragmentInput fsInput, inout czm_modelMaterial material) {
                        vec3 positionMC = fsInput.attributes.positionMC;
                        //这里是设置要贴图的图片的尺寸，设置小了会重复
                        float width = 30.0;
                        float height = 70.0;
                        vec3 rgb;
                        //这是是设置了屋顶的颜色，当和法向量平行时，就是屋顶，这里设置0.95，相当于垂直，建筑物四周开始贴图
                        if (dot(vec3(0.0, 1.0, 0.0), v_normalMC) > 0.95) {
                            material.diffuse = vec3(0.65, 0.65, 0.65);
                        } else {
                            float textureX = 0.0;
                            float dotYAxis = dot(vec3(0.0, 0.0, 1.0), v_normalMC);
                            // cos(45deg) 约等于 0.71，这里是建筑物四周的向量与法向量会大于四十五度夹角
                            if (dotYAxis > 0.71 || dotYAxis < -0.71) {
                                textureX = mod(positionMC.x, width) / width;
                            } else {
                                textureX = mod(positionMC.z, width) / width;
                            }
                            float textureY = mod(positionMC.y, height) / height;
                            
                            rgb = texture(u_texture1, vec2(textureX, textureY)).rgb;      
                            material.diffuse = rgb;
                        }
                    }`,
	});

	tileset.customShader = customShader;
}
