import ContainerWrapper from "@site/src/exmaples/web/componets/ContainerWrapper";
import { useContainerSize } from "@site/src/exmaples/web/hooks/useContainerSize";
import type { GeoJSON } from "geojson";
import Globe, { type GlobeInstance } from "globe.gl";
import { useEffect, useEffectEvent, useRef } from "react";

type SubmarineCablesPath = {
	properties: {
		name: string;
		color: string;
	};
};

export default function SubmarineCablesComponent() {
	const containerRef = useRef<HTMLDivElement>(null);
	const [width, height] = useContainerSize(containerRef);

	const loadData = useEffectEvent(async (world: GlobeInstance) => {
		fetch(
			// "//http-proxy.vastur.com?url=https://www.submarinecablemap.com/api/v3/cable/cable-geo.json",
			"/datasets/cable-geo.json",
		)
			.then((r) => r.json())
			.then((cablesGeo) => {
				const cablePaths = [];
				cablesGeo.features.forEach(({ geometry, properties }) => {
					geometry.coordinates.forEach((coords: GeoJSON) => {
						cablePaths.push({ coords, properties });
					});
				});

				world
					.pathsData(cablePaths)
					.pathPoints("coords")
					.pathPointLat((p) => p[1])
					.pathPointLng((p) => p[0])
					.pathColor((path: SubmarineCablesPath) => path.properties.color)
					.pathLabel((path: SubmarineCablesPath) => path.properties.name)
					.pathDashLength(0.1)
					.pathDashGap(0.008)
					.pathDashAnimateTime(12000);
			});
	});

	useEffect(() => {
		const { current: el } = containerRef;
		if (!el || !width || !height) return;

		const world = new Globe(el)
			.width(width)
			.height(height)
			.globeImageUrl("/three-globe/example/img/earth-night.png")
			.bumpImageUrl("/three-globe/example/img/earth-topology.png")
			.backgroundImageUrl("/three-globe/example/img/night-sky.png");

		loadData(world);

		return () => {
			world?._destructor();
		};
	}, [width, height]);

	return <ContainerWrapper ref={containerRef} />;
}
