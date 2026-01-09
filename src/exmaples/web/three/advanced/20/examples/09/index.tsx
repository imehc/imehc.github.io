import ContainerWrapper from "@site/src/exmaples/web/componets/ContainerWrapper";
import { useContainerSize } from "@site/src/exmaples/web/hooks/useContainerSize";
import { csvParse } from "d3";
import Globe, { type GlobeInstance } from "globe.gl";
import { useEffect, useEffectEvent, useRef } from "react";

export default function WorldPopulationComponent() {
	const containerRef = useRef<HTMLDivElement>(null);
	const [width, height] = useContainerSize(containerRef);

	const getWorldPopulation = useEffectEvent(async (world: GlobeInstance) => {
		try {
			fetch("/datasets/world_population.csv")
				.then((res) => res.text())
				.then((csv) =>
					csvParse(csv, ({ lat, lng, pop }) => ({
						lat: +lat,
						lng: +lng,
						pop: +pop,
					})),
				)
				.then((data) => world.heatmapsData([data]));
		} catch (error) {
			console.log(error);
		}
	});

	useEffect(() => {
		const { current: el } = containerRef;
		if (!el || !width || !height) return;

		const world = new Globe(el)
			.width(width)
			.height(height)
			.globeImageUrl("/three-globe/example/img/earth-night.png")
			.heatmapPointLat("lat")
			.heatmapPointLng("lng")
			.heatmapPointWeight("pop")
			.heatmapBandwidth(0.9)
			.heatmapColorSaturation(2.8)
			.enablePointerInteraction(false);

		getWorldPopulation(world)

		return () => {
			world?._destructor();
		};
	}, [width, height]);

	return <ContainerWrapper ref={containerRef} />;
}
