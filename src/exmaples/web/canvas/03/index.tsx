import { useEffect, useRef, useState } from "react";
import Container from "../../componets/Container";
import { TextController, type TextItem } from "./text-controller";

export default function CanvasTextEditor() {
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const controllerRef = useRef<TextController | null>(null);
	const [items, setItems] = useState<TextItem[]>([
		{ id: 1, text: "Hello", position: { x: 10, y: 10 } },
        { id: 2, text: "World", position: { x: 10, y: 30 } },
        { id: 3, text: "Three", position: { x: 10, y: 50 } },
        { id: 4, text: "Four", position: { x: 10, y: 70 } },
        { id: 5, text: "Five", position: { x: 10, y: 90 } },
        { id: 6, text: "Six", position: { x: 10, y: 110 } },
        { id: 7, text: "Seven", position: { x: 10, y: 130 } },
        { id: 8, text: "Eight", position: { x: 10, y: 150 } },
	]);

	useEffect(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;

		const ctx = canvas.getContext("2d");
		if (!ctx) return;

		// 创建控制器
		const controller = new TextController({
			items,
			onItemsChange: setItems,
		});

		controller.setCanvas(ctx, canvas.width, canvas.height);
		controller.render();
		controllerRef.current = controller;

		return () => controller.destroy();
	}, [items]);

	// 当 items 变化时更新
	useEffect(() => {
		if (controllerRef.current) {
			controllerRef.current.setItems(items);
			controllerRef.current.render();
		}
	}, [items]);

	const handleMouseDown = (e: React.MouseEvent) => {
		const canvas = canvasRef.current;
		if (!canvas || !controllerRef.current) return;

		const rect = canvas.getBoundingClientRect();
		controllerRef.current.handleMouseDown(
			e.clientX - rect.left,
			e.clientY - rect.top,
		);
		controllerRef.current.render();
	};

	const handleMouseMove = (e: React.MouseEvent) => {
		const canvas = canvasRef.current;
		if (!canvas || !controllerRef.current) return;

		const rect = canvas.getBoundingClientRect();
		controllerRef.current.handleMouseMove(
			e.clientX - rect.left,
			e.clientY - rect.top,
		);
	};

	const handleMouseUp = () => {
		if (controllerRef.current) {
			controllerRef.current.handleMouseUp();
			controllerRef.current.render();
		}
	};

	return (
		<Container>
			<canvas
				ref={canvasRef}
				width={800}
				height={600}
				onMouseDown={handleMouseDown}
				onMouseMove={handleMouseMove}
				onMouseUp={handleMouseUp}
				style={{ cursor: controllerRef.current?.getCursorStyle() || "default" }}
			/>
		</Container>
	);
}
