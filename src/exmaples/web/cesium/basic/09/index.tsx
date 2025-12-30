import type { Viewer } from "cesium";
import type { GUI } from "dat.gui";
import { useEffect, useRef } from "react";
import Container from "../../../componets/Container";

export default function App() {
	const ref = useRef<HTMLDivElement>(null);

	useEffect(() => {
		const container = ref.current;
		if (!container) return;

		let viewer: Viewer;
		let gui: GUI;

		// Dynamic import to ensure Cesium is only loaded on the client side
		import("./viewer").then(({ initViewer }) => {
			const result = initViewer(container);
			viewer = result.viewer;
			gui = result.gui;
		});

		return () => {
			if (viewer && !viewer.isDestroyed()) {
				viewer.destroy();
			}
			if (gui) {
				gui.destroy();
			}
		};
	}, []);

	return (
		<Container>
			<div className="tw:size-full" ref={ref} />
		</Container>
	);
}
