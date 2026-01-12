import type { Viewer } from "cesium";
import type { GUI } from "dat.gui";
import { useEffect, useRef } from "react";
import Container from "../../../componets/Container";

export default function App() {
	const ref = useRef<HTMLDivElement>(null);

	useEffect(() => {
		const container = ref.current;
		if (!container) return;

		let viewer: Viewer | null = null;
		let gui: GUI | null = null;

		// Dynamic import to ensure Cesium is only loaded on the client side
		import("./viewer").then(({ initViewer }) => {
			const scene = initViewer(container);
			viewer = scene.viewer;
			gui = scene.gui;
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
