import ContainerWrapper from "@site/src/exmaples/web/componets/ContainerWrapper";
import { useContainerSize } from "@site/src/exmaples/web/hooks/useContainerSize";
import { csvParseRows } from "d3";
import Globe, { type GlobeInstance } from "globe.gl";
import { useEffect, useEffectEvent, useRef } from "react";
import { airportParse, type Plane, routeParse } from "./helper";
import indexBy from './index-array-by'

const COUNTRY = "United States";
const OPACITY = 0.22;

export default function USOutboundInternationalAirlineRoutesComponent() {
	const containerRef = useRef<HTMLDivElement>(null);
	const [width, height] = useContainerSize(containerRef);

	const loadData = useEffectEvent(async (world: GlobeInstance) => {
		try {
			const [airports, routes] = await Promise.all([
				fetch(
					"https://raw.githubusercontent.com/jpatokal/openflights/master/data/airports.dat",
				)
					.then((res) => res.text())
					.then((d) => csvParseRows(d, airportParse)),
				fetch(
					"https://raw.githubusercontent.com/jpatokal/openflights/master/data/routes.dat",
				)
					.then((res) => res.text())
					.then((d) => csvParseRows(d, routeParse)),
			]);
			const byIata = indexBy(airports, "iata", false);

			const filteredRoutes = routes
				.filter(
					(d) =>
						Object.hasOwn(byIata, d.srcIata) &&
						Object.hasOwn(byIata, d.dstIata),
				) // exclude unknown airports
				.filter((d) => d.stops === "0") // non-stop flights only
				.map((d) =>
					Object.assign(d, {
						srcAirport: byIata[d.srcIata],
						dstAirport: byIata[d.dstIata],
					}),
				)
				.filter(
					(d) =>
						d.srcAirport.country === COUNTRY &&
						d.dstAirport.country !== COUNTRY,
				); // international routes from country

			world.pointsData(airports).arcsData(filteredRoutes);
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
			.pointOfView({ lat: 39.6, lng: -98.5, altitude: 2 }) // aim at continental US centroid
			.arcLabel(
				(d) =>
					`${(d as Plane).airline}: ${(d as Plane).srcIata} &#8594; ${(d as Plane).dstIata}`,
			)
			.arcStartLat((d) => +(d as Plane).srcAirport.lat)
			.arcStartLng((d) => +(d as Plane).srcAirport.lng)
			.arcEndLat((d) => +(d as Plane).dstAirport.lat)
			.arcEndLng((d) => +(d as Plane).dstAirport.lng)
			.arcDashLength(0.25)
			.arcDashGap(1)
			.arcDashInitialGap(() => Math.random())
			.arcDashAnimateTime(4000)
			.arcColor(() => [
				`rgba(0, 255, 0, ${OPACITY})`,
				`rgba(255, 0, 0, ${OPACITY})`,
			])
			.arcsTransitionDuration(0)

			.pointColor(() => "orange")
			.pointAltitude(0)
			.pointRadius(0.02)
			.pointsMerge(true);

		loadData(world);

		return () => {
			world?._destructor();
		};
	}, [width, height]);

	return <ContainerWrapper ref={containerRef} />;
}
