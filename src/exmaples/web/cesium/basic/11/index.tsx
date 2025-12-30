import type { Viewer } from "cesium";
import { useEffect, useRef } from "react";
import Container from "../../../componets/Container";

export default function App() {
	const ref = useRef<HTMLDivElement>(null);

	useEffect(() => {
		const container = ref.current;
		if (!container) return;

		let viewer: Viewer;

		// Dynamic import to ensure Cesium is only loaded on the client side
		import("./viewer").then(async ({ initViewer, loadPointInfo }) => {
			viewer = initViewer(container);
			loadPointInfo(viewer)
		});

		return () => {
			if (viewer && !viewer.isDestroyed()) {
				viewer.destroy();
			}
		};
	}, []);

	return (
		<Container>
			<div className="tw:size-full" ref={ref} />
		</Container>
	);
}
