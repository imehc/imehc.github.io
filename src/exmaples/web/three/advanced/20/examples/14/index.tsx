import ContainerWrapper from "@site/src/exmaples/web/componets/ContainerWrapper";
import { useContainerSize } from "@site/src/exmaples/web/hooks/useContainerSize";
import { scaleOrdinal } from "d3";
import Globe, { type GlobeInstance } from "globe.gl";
import { useEffect, useEffectEvent, useRef } from "react";

type MoonLandingSite = {
	label: string;
	agency: string;
	program: string;
	date: string;
	url: string;
};

export default function MoonLandingSitesComponent() {
	const containerRef = useRef<HTMLDivElement>(null);
	const [width, height] = useContainerSize(containerRef);

	const loadData = useEffectEvent(async (world: GlobeInstance) => {
		fetch("/datasets/moon_landings.json")
			.then((r) => r.json())
			.then((landingSites) => {
				world.labelsData(landingSites);
			});
	});

	useEffect(() => {
		const { current: el } = containerRef;
		if (!el || !width || !height) return;

		const colorScale = scaleOrdinal([
			"orangered",
			"mediumblue",
			"darkgreen",
			"yellow",
		]);
		const labelsTopOrientation = new Set([
			"Apollo 12",
			"Luna 2",
			"Luna 20",
			"Luna 21",
			"Luna 24",
			"LCROSS Probe",
		]); // avoid label collisions

		const world = new Globe(el)
			.width(width)
			.height(height)
			.globeImageUrl("/three-globe/example/img/lunar_surface.jpg")
			.bumpImageUrl("/three-globe/example/img/lunar_bumpmap.jpg")
			.backgroundImageUrl("/three-globe/example/img/night-sky.png")
			.showGraticules(true)
			.showAtmosphere(false) // moon has no atmosphere
			.labelText("label")
			.labelSize(1.7)
			.labelDotRadius(0.4)
			.labelDotOrientation((d: MoonLandingSite) =>
				labelsTopOrientation.has(d.label) ? "top" : "bottom",
			)
			.labelColor((d: MoonLandingSite) => colorScale(d.agency))
			.labelLabel(
				(d: MoonLandingSite) => `
				<div><b>${d.label}</b></div>
				<div>${d.agency} - ${d.program} Program</div>
				<div>Landing on <i>${new Date(d.date).toLocaleDateString()}</i></div>
			`,
			)
			.onLabelClick((d: MoonLandingSite) => window.open(d.url, "_blank"));

		loadData(world);

		return () => {
			world?._destructor();
		};
	}, [width, height]);

	return <ContainerWrapper ref={containerRef} />;
}
