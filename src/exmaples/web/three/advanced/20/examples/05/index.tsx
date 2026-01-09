import ContainerWrapper from "@site/src/exmaples/web/componets/ContainerWrapper";
import { useContainerSize } from "@site/src/exmaples/web/hooks/useContainerSize";
import Globe, { type GlobeInstance } from "globe.gl";
import { useEffect, useEffectEvent, useRef, useState } from "react";
import { ShaderMaterial, TextureLoader, Vector2 } from "three";
import { dayNightShader } from "./shader";
import { century, declination, equationOfTime } from "./sun-position";

// 时间加速倍率（每帧模拟的分钟数）
const TIME_VELOCITY = 1;

export default function DayNightCycleComponent() {
	const [currentTime, setCurrentTime] = useState(new Date());
	const containerRef = useRef<HTMLDivElement>(null);
	const [width, height] = useContainerSize(containerRef);

	const initScene = useEffectEvent(async (world: GlobeInstance) => {
		function sunPosAt(dt: number) {
			const day = new Date(+dt).setUTCHours(0, 0, 0, 0);
			const t = century(dt);
			const longitude = ((day - dt) / 864e5) * 360 - 180;
			return [longitude - equationOfTime(t) / 4, declination(t)];
		}

		let dt = Date.now();

		try {
			const [dayTexture, nightTexture] = await Promise.all([
				new TextureLoader().loadAsync("/three-globe/example/img/earth-day.png"),
				new TextureLoader().loadAsync(
					"/three-globe/example/img/earth-night.png",
				),
			]);
			const material = new ShaderMaterial({
				uniforms: {
					dayTexture: { value: dayTexture },
					nightTexture: { value: nightTexture },
					sunPosition: { value: new Vector2() },
					globeRotation: { value: new Vector2() },
				},
				vertexShader: dayNightShader.vertexShader,
				fragmentShader: dayNightShader.fragmentShader,
			});
			world
				.globeMaterial(material)
				.backgroundImageUrl("/three-globe/example/img/night-sky.png")
				// Update globe rotation on shader
				.onZoom(({ lng, lat }) =>
					material.uniforms.globeRotation.value.set(lng, lat),
				);

			function animate() {
				dt += TIME_VELOCITY * 60 * 1000;
				setCurrentTime(new Date(dt));
				const sunPos = sunPosAt(dt);
				material.uniforms.sunPosition.value.set(sunPos[0], sunPos[1]);
				requestAnimationFrame(animate);
			}
			animate();
		} catch (error) {
			console.error("Failed to initialize scene:", error);
		}
	});

	useEffect(() => {
		const { current: el } = containerRef;
		if (!el || !width || !height) return;

		const world = new Globe(el).width(width).height(height);

		initScene(world);

		return () => {
			world?._destructor();
		};
	}, [width, height]);

	return (
		<>
			<ContainerWrapper ref={containerRef}></ContainerWrapper>
			<div className="tw:absolute tw:bottom-4 tw:left-4 tw:text-lightblue tw:font-mono tw:text-sm tw:pointer-events-none tw:text-[lightblue]">
				{currentTime.toLocaleString("zh-CN", {
					year: "numeric",
					month: "2-digit",
					day: "2-digit",
					hour: "2-digit",
					minute: "2-digit",
					second: "2-digit",
					hour12: false,
				})}
			</div>
		</>
	);
}
