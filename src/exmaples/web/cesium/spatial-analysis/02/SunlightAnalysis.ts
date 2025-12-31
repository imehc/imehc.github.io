import {
	ClockRange,
	ClockStep,
	JulianDate,
	type Viewer,
} from "cesium";

/** 日照分析配置选项 */
interface SunlightAnalysisOptions {
	/** Cesium Viewer 实例 */
	viewer: Viewer;
	/** 是否播放动画 */
	play: boolean;
	/** 日期字符串 (YYYY-MM-DD) */
	day?: string;
	/** 开始时间（小时，0-23） */
	startTime?: number;
	/** 结束时间（小时，0-23） */
	stopTime?: number;
	/** 时钟范围模式 */
	clockRange?: ClockRange;
	/** 时钟步进模式 */
	clockStep?: ClockStep;
	/** 时间流逝速率倍数 */
	multiplier?: number;
}

/**
 * 日照分析类
 * 用于在Cesium场景中模拟不同时间段的日照效果
 */
class SunlightAnalysis {
	private viewer: Viewer;
	private stopTime: JulianDate | null = null;

	constructor(options: SunlightAnalysisOptions) {
		this.viewer = options.viewer;
		this.analysis(options);
	}

	/**
	 * 执行日照分析
	 */
	private analysis(config: SunlightAnalysisOptions): void {
		const viewer = this.viewer;

		if (!config.play) {
			// 暂停动画
			this.stopTime = viewer.clock.currentTime.clone();
			viewer.clock.shouldAnimate = false;
		} else {
			// 启用光照和阴影
			viewer.scene.globe.enableLighting = true;
			viewer.shadows = true;

			// 设置日期和时间
			const dayString = config.day || new Date().toISOString().split("T")[0];
			const date = new Date(dayString);
			const startHour = config.startTime ?? 8;
			const stopHour = config.stopTime ?? 18;

			const startDate = new Date(date);
			startDate.setHours(startHour, 0, 0, 0);

			const stopDate = new Date(date);
			stopDate.setHours(stopHour, 0, 0, 0);

			// 配置时钟
			viewer.clock.startTime = JulianDate.fromDate(startDate);
			viewer.clock.stopTime = JulianDate.fromDate(stopDate);
			viewer.clock.clockRange = config.clockRange ?? ClockRange.LOOP_STOP;
			viewer.clock.clockStep = config.clockStep ?? ClockStep.SYSTEM_CLOCK_MULTIPLIER;
			viewer.clock.multiplier = config.multiplier ?? 500;

			// 设置当前时间
			if (this.stopTime) {
				viewer.clock.currentTime = this.stopTime.clone();
			} else {
				viewer.clock.currentTime = JulianDate.fromDate(startDate);
			}

			// 启动动画
			viewer.clock.shouldAnimate = true;
		}
	}

	/**
	 * 播放日照动画
	 */
	play(day: string, startTime: number, stopTime: number, multiplier: number): void {
		this.analysis({
			viewer: this.viewer,
			play: true,
			day,
			startTime,
			stopTime,
			multiplier,
			clockRange: ClockRange.LOOP_STOP,
			clockStep: ClockStep.SYSTEM_CLOCK_MULTIPLIER,
		});
	}

	/**
	 * 暂停日照动画
	 */
	pause(): void {
		this.analysis({
			viewer: this.viewer,
			play: false,
		});
	}

	/**
	 * 重置日照分析
	 */
	reset(): void {
		this.stopTime = null;
		this.viewer.scene.globe.enableLighting = false;
		this.viewer.shadows = false;
		this.viewer.clock.shouldAnimate = false;
	}

	/**
	 * 清除日照分析效果
	 */
	clear(): void {
		this.reset();
	}
}

export default SunlightAnalysis;
export type { SunlightAnalysisOptions };
