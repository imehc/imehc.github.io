import ContainerWrapper from "@site/src/exmaples/web/componets/ContainerWrapper";
import { useContainerSize } from "@site/src/exmaples/web/hooks/useContainerSize";
import Globe from "globe.gl";
import { useEffect, useRef } from "react";
import { Mesh, MeshPhongMaterial, SphereGeometry, TextureLoader } from "three";

export default function CloudsComponent() {
	const containerRef = useRef<HTMLDivElement>(null);
	const animationFrameRef = useRef<number | null>(null);
	const [width, height] = useContainerSize(containerRef);

	useEffect(() => {
		const { current: el } = containerRef
		if (!el || !width || !height) return;

		const world = new Globe(el, { animateIn: false })
			.width(width)
			.height(height)
			.globeImageUrl("/three-globe/example/img/earth-blue-marble.png")
			.bumpImageUrl("/three-globe/example/img/earth-topology.png");

		const controls = world.controls();
		if (controls) {
			controls.autoRotate = true;
			controls.autoRotateSpeed = 0.35;
		}

		const CLOUDS_IMG_URL = "/three-globe/example/img/clouds.png";
		const CLOUDS_ALT = 0.004;
		const CLOUDS_ROTATION_SPEED = -0.006;

		new TextureLoader().load(CLOUDS_IMG_URL, (cloudsTexture) => {
			const clouds = new Mesh(
				new SphereGeometry(world.getGlobeRadius() * (1 + CLOUDS_ALT), 75, 75),
				new MeshPhongMaterial({ map: cloudsTexture, transparent: true }),
			);
			world.scene().add(clouds);

			const rotateClouds = () => {
				clouds.rotation.y += (CLOUDS_ROTATION_SPEED * Math.PI) / 180;
				animationFrameRef.current = requestAnimationFrame(rotateClouds);
			};
			rotateClouds();
		});

		return () => {
			if (animationFrameRef.current) {
				cancelAnimationFrame(animationFrameRef.current);
			}
			world?._destructor()
		};
	}, [width, height]);

	return <ContainerWrapper ref={containerRef} />;
}
