import type { Viewer } from "cesium";
import { useEffect, useRef } from "react";
import Container from "../../../componets/Container";
import type PointCluster from "./point-cluster";

export default function App() {
	const ref = useRef<HTMLDivElement>(null);

	useEffect(() => {
		const container = ref.current;
		if (!container) return;

		let viewer: Viewer;
		let cluster: PointCluster;

		// Dynamic import to ensure Cesium is only loaded on the client side
		import("./viewer").then(({ initViewer }) => {
			const result = initViewer(container);
			viewer = result.viewer;
			cluster = result.cluster;
		});

		return () => {
			if (viewer && !viewer.isDestroyed()) {
				viewer.destroy();
			}
			if (cluster) {
				cluster.remove();
			}
		};
	}, []);

	return (
		<Container>
			<div className="tw:size-full" ref={ref} />
		</Container>
	);
}
