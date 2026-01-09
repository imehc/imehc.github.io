import ContainerWrapper from "@site/src/exmaples/web/componets/ContainerWrapper";
import { useContainerSize } from "@site/src/exmaples/web/hooks/useContainerSize";
import { interpolateYlOrRd, scaleSequentialSqrt } from "d3";
import Globe from "globe.gl";
import { use, useEffect, useRef } from "react";
import { countriesPromiseRaw } from "../03/countries";

export default function ChoroplethCountriesComponent() {
	const countries = use(countriesPromiseRaw);
	const containerRef = useRef<HTMLDivElement>(null);
	const [width, height] = useContainerSize(containerRef);

	useEffect(() => {
		const { current: el } = containerRef;
		if (!el || !width || !height) return;
		const features = countries.features as Features[];
		const colorScale = scaleSequentialSqrt(interpolateYlOrRd);
		// GDP per capita (avoiding countries with small pop)
		const getVal = (feat: Features) =>
			feat.properties.GDP_MD_EST / Math.max(1e5, feat.properties.POP_EST);
		const maxVal = Math.max(...features.map(getVal));
		colorScale.domain([0, maxVal]); // 颜色比例尺
		const world = new Globe(el)
			.width(width)
			.height(height)
			.globeImageUrl("/three-globe/example/img/earth-night.png")
			.backgroundImageUrl("/three-globe/example/img/night-sky.png")
			.lineHoverPrecision(0)
			.polygonsData(features.filter((d) => d.properties.ISO_A2 !== "AQ"))
			.polygonAltitude(0.06)
			.polygonCapColor((feat) => colorScale(getVal(feat as Features)))
			.polygonSideColor(() => "rgba(0, 100, 0, 0.15)")
			.polygonStrokeColor(() => "#111")
			.polygonLabel(
				({ properties: d }: { properties: Features["properties"] }) => `
          <b>${d.ADMIN} (${d.ISO_A2}):</b> <br />
          GDP: <i>${d.GDP_MD_EST}</i> M$<br/>
          Population: <i>${d.POP_EST}</i>
        `,
			)
			.onPolygonHover((hoverD) =>
				world
					.polygonAltitude((d) => (d === hoverD ? 0.12 : 0.06))
					.polygonCapColor((d) =>
						d === hoverD ? "steelblue" : colorScale(getVal(d as Features)),
					),
			)
			.polygonsTransitionDuration(300);

		return () => {
			world?._destructor();
		};
	}, [width, height, countries.features]);

	return <ContainerWrapper ref={containerRef} />;
}

type Features = {
	properties: {
		GDP_MD_EST: number;
		POP_EST: number;
		ISO_A2: string;
		ADMIN: string;
	};
};
