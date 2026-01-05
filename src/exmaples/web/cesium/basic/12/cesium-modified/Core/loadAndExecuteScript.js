/**
 * @private
 */
function loadAndExecuteScript(url) {
	const script = document.createElement("script");
	script.async = true;
	script.src = url;

	return new Promise((resolve, reject) => {
		if (window.crossOriginIsolated) {
			script.setAttribute("crossorigin", "anonymous");
		}

		const head = document.getElementsByTagName("head")[0];
		script.onload = () => {
			script.onload = undefined;
			head.removeChild(script);
			resolve();
		};
		script.onerror = (e) => {
			reject(e);
		};

		head.appendChild(script);
	});
}
export default loadAndExecuteScript;
