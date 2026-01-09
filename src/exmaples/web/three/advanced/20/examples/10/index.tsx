import ContainerWrapper from "@site/src/exmaples/web/componets/ContainerWrapper";
import { useContainerSize } from "@site/src/exmaples/web/hooks/useContainerSize";
import { scaleLinear } from "d3";
import type { Feature, Point } from "geojson";
import Globe, { type GlobeInstance } from "globe.gl";
import { useEffect, useEffectEvent, useRef } from "react";

export default function RecentEarthquakesComponent() {
	const containerRef = useRef<HTMLDivElement>(null);
	const [width, height] = useContainerSize(containerRef);

	const weightColor = scaleLinear<string>()
		.domain([0, 60])
		.range(["lightblue", "darkred"])
		.clamp(true);

	const getWorldPopulation = useEffectEvent(async (world: GlobeInstance) => {
		try {
			fetch(
				"//earthquake.usgs.gov/earthquakes/feed/v1.0/summary/2.5_month.geojson",
			)
				.then((res) => res.json())
				.then((equakes) => {
					world.hexBinPointsData(equakes.features);
				});
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
			.hexBinPointLat((d) => ((d as Feature).geometry as Point).coordinates[1])
			.hexBinPointLng((d) => ((d as Feature).geometry as Point).coordinates[0])
			.hexBinPointWeight((d) => (d as Feature).properties.mag)
			.hexAltitude(({ sumWeight }) => sumWeight * 0.0025)
			.hexTopColor((d) => weightColor(d.sumWeight))
			.hexSideColor((d) => weightColor(d.sumWeight))
			.hexLabel(
				(d) => `
					<b>${d.points.length}</b> earthquakes in the past month:<ul><li>
					${d.points
						.slice()
						.sort(
							(a, b) =>
								(b as Feature).properties.mag - (a as Feature).properties.mag,
						)
						.map((d) => (d as Feature).properties.title)
						.join("</li><li>")}
					</li></ul>
				`,
			);

		getWorldPopulation(world);

		return () => {
			world?._destructor();
		};
	}, [width, height, weightColor]);

	return <ContainerWrapper ref={containerRef} />;
}
