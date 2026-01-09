import ErrorBoundary from "@docusaurus/ErrorBoundary";
import clsx from "clsx";
import { forwardRef, type PropsWithChildren } from "react";

export interface ContainerProps {
	className?: string;
	hiddenBorder?: boolean;
	autoHeight?: boolean;
	fullWidth?: boolean;
}

export default forwardRef<HTMLDivElement, PropsWithChildren<ContainerProps>>(
	(
		{
			children,
			className,
			hiddenBorder = false,
			autoHeight = false,
			fullWidth = false,
		},
		ref,
	) => {
		return (
			<div
				ref={ref}
				className={clsx(
					"tw:w-full tw:relative",
					{ "tw:border tw:border-base-300 tw:box-border": !hiddenBorder },
					{ "tw:aspect-video tw:overflow-hidden": !autoHeight },
					[fullWidth ? "tw:w-full" : "tw:md:w-2xl"],
					className,
				)}
			>
				<ErrorBoundary
					fallback={({ error, tryAgain }) => (
						<div className="tw:h-full tw:flex tw:flex-col tw:justify-center tw:items-center">
							<div>Something went wrong</div>
							<div className="tw:text-error">{error.message}</div>
							<button
								type="button"
								className="tw:btn tw:btn-sm tw:btn-primary"
								onClick={() => tryAgain()}
							>
								Reload
							</button>
						</div>
					)}
				>
					{children}
				</ErrorBoundary>
			</div>
		);
	},
);
