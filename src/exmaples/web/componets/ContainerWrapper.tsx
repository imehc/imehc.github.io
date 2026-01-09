import type React from "react";
import { forwardRef, useImperativeHandle, useRef } from "react";
import { useContainerSize } from "../hooks/useContainerSize";
import type { ContainerProps } from "./Container";
import Container from "./Container";
import Loading from "./Loading";

export type Size = {
	width: number;
	height: number;
};

export interface ContainerWrapperProps extends ContainerProps {
	/**
	 * 子元素可以是：
	 * 1. 函数：接收 size 对象，返回 ReactNode
	 * 2. 普通 ReactNode
	 */
	children?: ((size: Size) => React.ReactNode) | React.ReactNode;
	/**
	 * 加载文本
	 */
	loadingText?: string;
	/**
	 * 是否在尺寸为 0 时显示 Loading
	 * @default true
	 */
	showLoading?: boolean;
	/**
	 * 是否使用固定尺寸的内部容器（防止子元素撑开父容器导致高度无限增长）
	 * 推荐在使用 Globe、Canvas 等可能撑开容器的组件时启用
	 * @default true
	 */
	useFixedWrapper?: boolean;
}

/**
 * 容器包装组件，自动获取容器尺寸
 *
 * @example
 * ```tsx
 * // Render props 模式
 * <ContainerWrapper>
 *   {({ width, height }) => (
 *     <Canvas width={width} height={height} />
 *   )}
 * </ContainerWrapper>
 *
 * // 普通子元素
 * <ContainerWrapper>
 *   <div>普通内容</div>
 * </ContainerWrapper>
 * ```
 */
export default forwardRef<HTMLDivElement, ContainerWrapperProps>(
	(
		{
			children,
			loadingText = "Initializing...",
			showLoading = true,
			useFixedWrapper = true,
			...containerProps
		},
		forwardedRef,
	) => {
		// 内部 ref 用于 useContainerSize
		const internalRef = useRef<HTMLDivElement>(null);
		const [width, height] = useContainerSize(internalRef);

		// 同步内部 ref 到外部 forwardedRef
		useImperativeHandle(forwardedRef, () => internalRef.current!, []);

		// 判断 children 是否为函数
		const isFunction = typeof children === "function";
		const size: Size = { width, height };

		// 渲染内容
		const renderContent = () => {
			if (isFunction) {
				return (children as (size: Size) => React.ReactNode)?.(size);
			}
			return children;
		};

		return (
			<Container ref={internalRef} {...containerProps}>
				{width > 0 && height > 0 ? (
					useFixedWrapper ? (
						// 使用绝对定位 wrapper 完全脱离文档流，防止子元素撑开容器
						<div
							className="tw:absolute tw:top-0 tw:left-0 tw:overflow-hidden"
							style={{ width, height }}
						>
							{renderContent()}
						</div>
					) : (
						renderContent()
					)
				) : showLoading ? (
					<Loading loadText={loadingText} />
				) : null}
			</Container>
		);
	},
);
