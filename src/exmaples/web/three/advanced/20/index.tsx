import { OrbitControls } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { GUI } from "dat.gui";
import { Suspense, useEffect, useMemo, useState } from "react";
import Container from "../../../componets/Container";
import LoadingNormal from "../../../componets/Loading";
import {
	currentComponent,
	type GlobeCompKey,
	transformGuiParam,
} from "./constant";
import Loading from "./loading";

export default function Viewer() {
	const [currentExample, setCurrentExample] = useState<GlobeCompKey>("03");

	useEffect(() => {
		const gui = new GUI();
		gui.domElement.style.position = "fixed";
		gui.domElement.style.top = "50%";
		gui.domElement.style.transform = "translateY(-50%)";
		gui.domElement.style.left = "0";

		// GUI控制参数对象
		const params = {
			example: currentExample,
		};

		// 添加下拉选择器
		gui
			.add(params, "example", transformGuiParam())
			.name("切换示例")
			.onChange(setCurrentExample);

		return () => {
			gui.destroy();
		};
	}, [currentExample]);

	// 动态获取组件
	const ExampleComponent = useMemo(() => {
		return currentComponent(currentExample);
	}, [currentExample]);

	// 独立场景，不需要 Canvas
	if (Object.values(transformGuiParam("detachment")).includes(currentExample)) {
		return (
			<Container>
				<Suspense fallback={<LoadingNormal />}>
					<ExampleComponent />
				</Suspense>
			</Container>
		);
	}

	return (
		<Container>
			<Canvas camera={{ position: [0, 0, 300], fov: 75 }}>
				<ambientLight intensity={5} />
				<OrbitControls makeDefault />
				<Suspense fallback={<Loading />}>
					<ExampleComponent />
				</Suspense>
			</Canvas>
		</Container>
	);
}
