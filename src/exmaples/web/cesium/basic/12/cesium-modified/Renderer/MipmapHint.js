import WebGLConstants from "../Core/WebGLConstants.js";

/**
 * @private
 */
const MipmapHint = {
	DONT_CARE: WebGLConstants.DONT_CARE,
	FASTEST: WebGLConstants.FASTEST,
	NICEST: WebGLConstants.NICEST,

	validate: (mipmapHint) =>
		mipmapHint === MipmapHint.DONT_CARE ||
		mipmapHint === MipmapHint.FASTEST ||
		mipmapHint === MipmapHint.NICEST,
};
export default Object.freeze(MipmapHint);
