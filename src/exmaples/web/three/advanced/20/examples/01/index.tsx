import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo } from "react";
import Globe from "three-globe";

/**
 * 创建地球数据
 */
function createGlobeData() {
	const N = 300;
	return [...Array(N).keys()].map(() => ({
		lat: (Math.random() - 0.5) * 180,
		lng: (Math.random() - 0.5) * 360,
		size: Math.random() / 3,
		color: ["red", "white", "blue", "green"][Math.round(Math.random() * 3)],
	}));
}

/**
 * 地球组件
 */
export default function GlobeComponent() {
	const globe = useMemo(() => {
		const g = new Globe()
			.globeImageUrl(
				"/three-globe/example/img/earth-night.png",
			)
			.pointsData(createGlobeData())
			.pointAltitude("size")
			.pointColor("color");
		return g;
	}, []);

	// 每帧旋转
	useFrame(() => {
		globe.rotation.y += 0.002;
	});

	useEffect(() => {
		return () => {
			globe?._destructor();
		}
	}, [globe])

	return <primitive object={globe} />;
}
