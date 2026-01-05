import BoxGeometry from "../Core/BoxGeometry.js";
import buildModuleUrl from "../Core/buildModuleUrl.js";
import Cartesian3 from "../Core/Cartesian3.js";
import Check from "../Core/Check.js";
import DeveloperError from "../Core/DeveloperError.js";
import defined from "../Core/defined.js";
import destroyObject from "../Core/destroyObject.js";
import GeometryPipeline from "../Core/GeometryPipeline.js";
import Matrix3 from "../Core/Matrix3.js";
import Matrix4 from "../Core/Matrix4.js";
import Transforms from "../Core/Transforms.js";
import VertexFormat from "../Core/VertexFormat.js";
import BufferUsage from "../Renderer/BufferUsage.js";
import CubeMap from "../Renderer/CubeMap.js";
import DrawCommand from "../Renderer/DrawCommand.js";
import loadCubeMap from "../Renderer/loadCubeMap.js";
import RenderState from "../Renderer/RenderState.js";
import ShaderProgram from "../Renderer/ShaderProgram.js";
import ShaderSource from "../Renderer/ShaderSource.js";
import VertexArray from "../Renderer/VertexArray.js";
import BlendingState from "./BlendingState.js";
import SceneMode from "./SceneMode.js";

// 用于存储天空盒旋转矩阵的临时变量
const skyboxMatrix3 = new Matrix3();

/**
 * A sky box around the scene to draw stars.  The sky box is defined using the True Equator Mean Equinox (TEME) axes.
 * <p>
 * This is only supported in 3D.  The sky box is faded out when morphing to 2D or Columbus view.  The size of
 * the sky box must not exceed {@link Scene#maximumCubeMapSize}.
 * </p>
 *
 * @alias SkyBox
 * @constructor
 *
 * @param {object} options Object with the following properties:
 * @param {object} [options.sources] The source URL or <code>Image</code> object for each of the six cube map faces.  See the example below.
 * @param {boolean} [options.show=true] Determines if this primitive will be shown.
 *
 *
 * @example
 * scene.skyBox = new Cesium.SkyBox({
 *   sources : {
 *     positiveX : 'skybox_px.png',
 *     negativeX : 'skybox_nx.png',
 *     positiveY : 'skybox_py.png',
 *     negativeY : 'skybox_ny.png',
 *     positiveZ : 'skybox_pz.png',
 *     negativeZ : 'skybox_nz.png'
 *   }
 * });
 *
 * @see Scene#skyBox
 * @see Transforms.computeTemeToPseudoFixedMatrix
 */
function SkyBox(options) {
	/**
	 * The sources used to create the cube map faces: an object
	 * with <code>positiveX</code>, <code>negativeX</code>, <code>positiveY</code>,
	 * <code>negativeY</code>, <code>positiveZ</code>, and <code>negativeZ</code> properties.
	 * These can be either URLs or <code>Image</code> objects.
	 *
	 * @type {object}
	 * @default undefined
	 */
	this.sources = options.sources;
	this._sources = undefined;

	this.nearGround = options.nearGround;

	/**
	 * Determines if the sky box will be shown.
	 *
	 * @type {boolean}
	 * @default true
	 */
	this.show = options.show ?? true;

	this._command = new DrawCommand({
		modelMatrix: Matrix4.clone(Matrix4.IDENTITY),
		owner: this,
	});
	this._cubeMap = undefined;

	this._attributeLocations = undefined;
	this._useHdr = undefined;
	this._hasError = false;
	this._error = undefined;
}

/**
 * Called when {@link Viewer} or {@link CesiumWidget} render the scene to
 * get the draw commands needed to render this primitive.
 * <p>
 * Do not call this function directly.  This is documented just to
 * list the exceptions that may be propagated when the scene is rendered:
 * </p>
 *
 * @exception {DeveloperError} this.sources is required and must have positiveX, negativeX, positiveY, negativeY, positiveZ, and negativeZ properties.
 * @exception {DeveloperError} this.sources properties must all be the same type.
 */
SkyBox.prototype.update = function (frameState, useHdr) {
	const { mode, passes, context } = frameState;

	if (!this.show) {
		return undefined;
	}

	if (mode !== SceneMode.SCENE3D && mode !== SceneMode.MORPHING) {
		return undefined;
	}

	// The sky box is only rendered during the render pass; it is not pickable, it doesn't cast shadows, etc.
	if (!passes.render) {
		return undefined;
	}

	// Throw any errors that had previously occurred asynchronously so they aren't
	// ignored when running.  See https://github.com/CesiumGS/cesium/pull/12307
	if (this._hasError) {
		const error = this._error;
		this._hasError = false;
		this._error = undefined;
		throw error;
	}

	if (this._sources !== this.sources) {
		this._sources = this.sources;
		const sources = this.sources;

		//>>includeStart('debug', pragmas.debug);
		Check.defined("this.sources", sources);
		if (
			Object.values(CubeMap.FaceName).some(
				(faceName) => !defined(sources[faceName]),
			)
		) {
			throw new DeveloperError(
				"this.sources must have positiveX, negativeX, positiveY, negativeY, positiveZ, and negativeZ properties.",
			);
		}

		const sourceType = typeof sources.positiveX;
		if (
			Object.values(CubeMap.FaceName).some(
				(faceName) => typeof sources[faceName] !== sourceType,
			)
		) {
			throw new DeveloperError(
				"this.sources properties must all be the same type.",
			);
		}
		//>>includeEnd('debug');

		if (typeof sources.positiveX === "string") {
			// Given urls for cube-map images.  Load them.
			loadCubeMap(context, this._sources)
				.then((cubeMap) => {
					this._cubeMap = this._cubeMap && this._cubeMap.destroy();
					this._cubeMap = cubeMap;
				})
				.catch((error) => {
					// Defer throwing the error until the next call to update to prevent
					// test from failing in `afterAll` if this is rejected after the test
					// using the Skybox ends.  See https://github.com/CesiumGS/cesium/pull/12307
					this._hasError = true;
					this._error = error;
				});
		} else {
			this._cubeMap = this._cubeMap && this._cubeMap.destroy();
			this._cubeMap = new CubeMap({
				context: context,
				source: sources,
			});
		}
	}

	const command = this._command;
	command.modelMatrix = Transforms.eastNorthUpToFixedFrame(
		frameState.camera._positionWC,
	);

	if (!defined(command.vertexArray)) {
		command.uniformMap = {
			u_cubeMap: () => this._cubeMap,
			u_rotateMatrix: () => {
				if (!defined(Matrix4.getRotation)) {
					return Matrix4.getMatrix3(command.modelMatrix, skyboxMatrix3);
				}
				return Matrix4.getRotation(command.modelMatrix, skyboxMatrix3);
			},
		};

		const geometry = BoxGeometry.createGeometry(
			BoxGeometry.fromDimensions({
				dimensions: new Cartesian3(2.0, 2.0, 2.0),
				vertexFormat: VertexFormat.POSITION_ONLY,
			}),
		);
		const attributeLocations = (this._attributeLocations =
			GeometryPipeline.createAttributeLocations(geometry));

		command.vertexArray = VertexArray.fromGeometry({
			context: context,
			geometry: geometry,
			attributeLocations: attributeLocations,
			bufferUsage: BufferUsage.STATIC_DRAW,
		});

		command.renderState = RenderState.fromCache({
			blending: BlendingState.ALPHA_BLEND,
		});
	}

	if (!defined(command.shaderProgram) || this._useHdr !== useHdr) {
		const fs = new ShaderSource({
			defines: [useHdr ? "HDR" : ""],
			sources: [SkyBoxFS],
		});
		command.shaderProgram = ShaderProgram.fromCache({
			context: context,
			vertexShaderSource: SkyBoxVS,
			fragmentShaderSource: fs,
			attributeLocations: this._attributeLocations,
		});
		this._useHdr = useHdr;
	}

	if (!defined(this._cubeMap)) {
		return undefined;
	}

	return command;
};

/**
 * Returns true if this object was destroyed; otherwise, false.
 * <br /><br />
 * If this object was destroyed, it should not be used; calling any function other than
 * <code>isDestroyed</code> will result in a {@link DeveloperError} exception.
 *
 * @returns {boolean} <code>true</code> if this object was destroyed; otherwise, <code>false</code>.
 *
 * @see SkyBox#destroy
 */
SkyBox.prototype.isDestroyed = () => false;

/**
 * Destroys the WebGL resources held by this object.  Destroying an object allows for deterministic
 * release of WebGL resources, instead of relying on the garbage collector to destroy this object.
 * <br /><br />
 * Once an object is destroyed, it should not be used; calling any function other than
 * <code>isDestroyed</code> will result in a {@link DeveloperError} exception.  Therefore,
 * assign the return value (<code>undefined</code>) to the object as done in the example.
 *
 * @exception {DeveloperError} This object was destroyed, i.e., destroy() was called.
 *
 *
 * @example
 * skyBox = skyBox && skyBox.destroy();
 *
 * @see SkyBox#isDestroyed
 */
SkyBox.prototype.destroy = function () {
	const command = this._command;
	command.vertexArray = command.vertexArray && command.vertexArray.destroy();
	command.shaderProgram =
		command.shaderProgram && command.shaderProgram.destroy();
	this._cubeMap = this._cubeMap && this._cubeMap.destroy();
	return destroyObject(this);
};

function getDefaultSkyBoxUrl(suffix) {
	return buildModuleUrl(`Assets/Textures/SkyBox/tycho2t3_80_${suffix}.jpg`);
}

/**
 * Creates a skybox instance with the default starmap for the Earth.
 * @return {SkyBox} The default skybox for the Earth
 *
 * @example
 * viewer.scene.skyBox = Cesium.SkyBox.createEarthSkyBox();
 */
SkyBox.createEarthSkyBox = () =>
	new SkyBox({
		sources: {
			positiveX: getDefaultSkyBoxUrl("px"),
			negativeX: getDefaultSkyBoxUrl("mx"),
			positiveY: getDefaultSkyBoxUrl("py"),
			negativeY: getDefaultSkyBoxUrl("my"),
			positiveZ: getDefaultSkyBoxUrl("pz"),
			negativeZ: getDefaultSkyBoxUrl("mz"),
		},
	});

//片元着色器
const SkyBoxFS = `uniform samplerCube u_cubeMap;
in vec3 v_texCoord;
void main()
{
  vec4 color = texture(u_cubeMap, normalize(v_texCoord));
  out_FragColor = vec4(color.rgb, czm_morphTime);
}
`;

// 顶点着色器，主要修改是乘了一个旋转矩阵（之前计算出来当前相机方位的旋转矩阵）
const SkyBoxVS = `
  uniform mat3 u_rotateMatrix;
  in vec3 position;
  out vec3 v_texCoord;
  void main()
  {
    vec3 p = czm_viewRotation * u_rotateMatrix * (czm_temeToPseudoFixed * (czm_entireFrustum.y * position));
    gl_Position = czm_projection * vec4(p, 1.0);
    v_texCoord = position.xyz;
  }
 `;

export default SkyBox;
