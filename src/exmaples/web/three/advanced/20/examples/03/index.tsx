import ContainerWrapper from "@site/src/exmaples/web/componets/ContainerWrapper";
import { use, useEffect, useRef } from "react";
import Globe, { type GlobeMethods } from "react-globe.gl";
import { countriesPromise } from "./countries";
import { useContainerSize } from "@site/src/exmaples/web/hooks/useContainerSize";

/** 多边形 - 使用 react-globe.gl 独立渲染 */
export default function HexPolygonComponent() {
	const containerRef = useRef<HTMLDivElement>(null);
	const globeEl = useRef<GlobeMethods>(null);
	const countries = use(countriesPromise);
	const [width, height] = useContainerSize(containerRef);

	// 自动旋转
	useEffect(() => {
		const { current } = globeEl;
		if (!current || !width || !height) return;

		// const controls = current.controls();
		// controls.autoRotate = true;
		// controls.autoRotateSpeed = 0.35;

		// return () => {
		// 	controls.autoRotate = false;
		// 	current?.pauseAnimation();
		// };
	}, [width, height]);

	return (
		<ContainerWrapper ref={containerRef}>
			{({ width, height }) => (
				<Globe
					ref={globeEl}
					width={width}
					height={height}
					globeImageUrl="/three-globe/example/img/earth-dark.png"
					hexPolygonsData={countries.features}
					hexPolygonResolution={3}
					hexPolygonMargin={0.3}
					hexPolygonUseDots={true}
					hexPolygonColor={() =>
						`#${Math.round(Math.random() * 2 ** 24)
							.toString(16)
							.padStart(6, "0")}`
					}
					hexPolygonLabel={({
						properties: d,
					}: {
						properties: { [key: string]: string };
					}) => `
						<b>${d.ADMIN} (${d.ISO_A2})</b> <br />
						Population: <i>${d.POP_EST}</i>
					`}
				/>
			)}
		</ContainerWrapper>
	);
}
