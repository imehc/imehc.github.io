import ContainerWrapper from "@site/src/exmaples/web/componets/ContainerWrapper";
import { useContainerSize } from "@site/src/exmaples/web/hooks/useContainerSize";
import Globe from "globe.gl";
import { useEffect, useRef } from "react";

export default function HeatMapComponent() {
	const containerRef = useRef<HTMLDivElement>(null);
	const [width, height] = useContainerSize(containerRef);

	useEffect(() => {
		const { current: el } = containerRef
		if (!el || !width || !height) return;
		const world = new Globe(el)
			.width(width)
			.height(height)
			.globeImageUrl("/three-globe/example/img/earth-dark.png")
			.heatmapsData([gData()])
			.heatmapPointLat("lat")
			.heatmapPointLng("lng")
			.heatmapPointWeight("weight")
			.heatmapTopAltitude(0.7)
			.heatmapsTransitionDuration(3000)
			.enablePointerInteraction(false);

		return () => {
			world?._destructor()
		}
	}, [width, height]);

	return <ContainerWrapper ref={containerRef} />;
}

function gData() {
	const N = 900;
	return [...Array(N).keys()].map(() => ({
		lat: (Math.random() - 0.5) * 160,
		lng: (Math.random() - 0.5) * 360,
		weight: Math.random(),
	}));
}