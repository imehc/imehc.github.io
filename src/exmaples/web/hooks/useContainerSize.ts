import { type RefObject, useEffect, useState } from "react";

/**
 * 监听容器尺寸变化的 Hook
 * 使用 ResizeObserver 监听容器的尺寸变化
 *
 * @param containerRef - 容器元素的 ref
 * @returns [width, height] - 容器的宽度和高度
 *
 * @example
 * ```tsx
 * const containerRef = useRef<HTMLDivElement>(null);
 * const [width, height] = useContainerSize(containerRef);
 *
 * return (
 *   <div ref={containerRef} className="tw:size-full">
 *     {width > 0 && height > 0 && (
 *       <YourComponent width={width} height={height} />
 *     )}
 *   </div>
 * );
 * ```
 */
export function useContainerSize<T extends HTMLElement = HTMLDivElement>(
	containerRef: RefObject<T>,
): [number, number] {
	const [dimensions, setDimensions] = useState<[number, number]>([0, 0]);

	useEffect(() => {
		const updateSize = () => {
			if (containerRef.current) {
				const { width, height } =
					containerRef.current.getBoundingClientRect();
				setDimensions([width, height]);
			}
		};

		// 初始测量
		updateSize();

		// 监听窗口大小变化
		const resizeObserver = new ResizeObserver(updateSize);
		if (containerRef.current) {
			resizeObserver.observe(containerRef.current);
		}

		return () => {
			resizeObserver.disconnect();
		};
	}, [containerRef]);

	return dimensions;
}
