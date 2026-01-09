interface LoadingProps {
	loadText?: string;
}

export default function Loading({ loadText = "Loading..." }: LoadingProps) {
	return (
		<div className="tw:absolute tw:left-1/2 tw:top-1/2 tw:-translate-1/2">
			<div className="tw:flex tw:flex-col tw:items-center tw:justify-center">
				{/* Spinning loader */}
				<div className="tw:relative tw:w-20 tw:h-20 tw:mb-6">
					<div className="tw:absolute tw:inset-0 tw:border-4 tw:border-primary tw:border-t-transparent tw:rounded-full tw:animate-spin"></div>
					<div className="tw:absolute tw:inset-2 tw:border-4 tw:border-secondary tw:border-b-transparent tw:rounded-full animate-spin-reverse"></div>
				</div>

				{/* Loading text */}
				<div className="tw:text-base-content tw:text-opacity-80 tw:text-sm tw:mb-1">
					{loadText}
				</div>
			</div>

			<style>{`
					@keyframes spin-reverse {
						from {
							transform: rotate(360deg);
						}
						to {
							transform: rotate(0deg);
						}
					}
					.animate-spin-reverse {
						animation: spin-reverse 1.5s linear infinite;
					}
				`}</style>
		</div>
	);
}
