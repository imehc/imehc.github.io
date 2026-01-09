import ContainerWrapper from "@site/src/exmaples/web/componets/ContainerWrapper";
import { useContainerSize } from "@site/src/exmaples/web/hooks/useContainerSize";
import Globe from "globe.gl";
import { useEffect, useRef } from "react";

const shieldRing = { lat: 90, lng: 0 };

export default function EarthShieldComponent() {
	const containerRef = useRef<HTMLDivElement>(null);
	const [width, height] = useContainerSize(containerRef);

	useEffect(() => {
		const { current: el } = containerRef;
		if (!el || !width || !height) return;

		const world = new Globe(el)
			.width(width)
			.height(height)
			.globeImageUrl("/three-globe/example/img/earth-night.png")
			.ringsData([shieldRing])
			.ringAltitude(0.25)
			.ringColor(() => "lightblue")
			.ringMaxRadius(180)
			.ringPropagationSpeed(20)
			.ringRepeatPeriod(200);

		return () => {
			world?._destructor();
		};
	}, [width, height]);

	return <ContainerWrapper ref={containerRef} />;
}
