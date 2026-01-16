/**
 * Text Controller - 框架无关的 Text 核心逻辑
 * 负责渲染、交互处理、状态管理
 *
 * 设计原则：只处理通用的文本项，不区分业务类型（datetime/textOverlay）
 */

/** rgba 颜色 */
export type Color = [number, number, number, number];

export type Point = { x: number; y: number };

/** 通用文本项 */
export type TextItem = {
	/** 唯一标识 */
	id: string | number;
	/** 文本内容 */
	text: string;
	/** 位置 */
	position: Point;
};

export type Size = {
	width: number;
	height: number;
};

export interface TextControllerOptions {
	/** 颜色 @default [0, 0, 0, 1] */
	color?: Color;
	/** 文本项列表 */
	items?: TextItem[];
	/** 值变化回调（拖拽结束时触发） */
	onItemsChange?: (items: TextItem[]) => void;
}

type DragState = {
	itemId: string | number | null;
	offset: Point;
};

/**
 * Text 控制器类
 * 管理文本项的渲染和交互逻辑
 */
export class TextController {
	private ctx: CanvasRenderingContext2D | null = null;
	private canvasWidth = 0;
	private canvasHeight = 0;
	private color: Color;
	private items: TextItem[];
	private onItemsChange?: (items: TextItem[]) => void;

	// 交互状态
	private dragState: DragState = { itemId: null, offset: { x: 0, y: 0 } };
	private selectedItemId: string | number | null = null;
	private tempDragPosition: Point | null = null;
	private cursorStyle = 'default';

	// 渲染配置
	private readonly fontSize = 14;
	private readonly padding = 4;

	constructor(options: TextControllerOptions = {}) {
		this.color = options.color || [0, 0, 0, 1];
		this.items = options.items || [];
		this.onItemsChange = options.onItemsChange;
	}

	/**
	 * 设置 canvas 上下文和尺寸
	 */
	setCanvas(ctx: CanvasRenderingContext2D, width: number, height: number): void {
		this.ctx = ctx;
		this.canvasWidth = width;
		this.canvasHeight = height;
	}

	/**
	 * 更新颜色
	 */
	setColor(color: Color): void {
		this.color = [...color] as Color;
	}

	/**
	 * 更新文本项列表
	 */
	setItems(items: TextItem[]): void {
		this.items = items.map((item) => ({ ...item }));
	}

	/**
	 * 获取文本项列表
	 */
	getItems(): TextItem[] {
		return this.items.map((item) => ({ ...item }));
	}

	/**
	 * 获取尺寸
	 */
	getSize(): Size {
		return { width: this.canvasWidth, height: this.canvasHeight };
	}

	/**
	 * 获取光标样式
	 */
	getCursorStyle(): string {
		return this.cursorStyle;
	}

	/**
	 * 获取选中的项ID
	 */
	getSelectedItemId(): string | number | null {
		return this.selectedItemId;
	}

	/**
	 * 渲染所有文本项
	 */
	render(): void {
		if (!this.ctx) return;

		this.ctx.clearRect(0, 0, this.canvasWidth, this.canvasHeight);

		// 绘制所有文本项
		this.items.forEach((item) => {
			if (item.text) {
				const position = this.getDraggedPosition(item.id, item.position);
				const isSelected = this.selectedItemId === item.id;
				this.drawTextItem(item.text, position, isSelected);
			}
		});
	}

	/**
	 * 获取拖拽中的位置（如果正在拖拽）或原始位置
	 */
	private getDraggedPosition(itemId: string | number, originalPosition: Point): Point {
		// 如果正在拖拽且是当前元素，返回临时位置
		if (this.tempDragPosition && this.dragState.itemId === itemId) {
			return this.tempDragPosition;
		}
		return originalPosition;
	}

	/**
	 * 绘制文本项
	 */
	private drawTextItem(text: string, position: Point, isSelected: boolean): void {
		if (!this.ctx) return;

		this.ctx.font = `normal ${this.fontSize}px sans-serif`;
		const metrics = this.ctx.measureText(text);
		const textWidth = metrics.width;
		const textHeight = this.fontSize;

		// 绘制矩形背景
		this.ctx.fillStyle = 'transparent';
		this.ctx.fillRect(
			position.x,
			position.y,
			textWidth + this.padding * 2,
			textHeight + this.padding * 2
		);

		// 绘制文本
		this.ctx.fillStyle = this.colorToRgba(this.color);
		this.ctx.textAlign = 'left';
		this.ctx.textBaseline = 'top';
		this.ctx.fillText(text, position.x + this.padding, position.y + this.padding);

		// 绘制边框
		this.ctx.strokeStyle = this.colorToRgba(this.color);
		this.ctx.lineWidth = 1;
		this.ctx.strokeRect(
			position.x,
			position.y,
			textWidth + this.padding * 2,
			textHeight + this.padding * 2
		);

		// 如果选中，可以添加高亮效果
		if (isSelected) {
			// TODO: 可扩充样式
		}
	}

	/**
	 * 处理鼠标按下
	 */
	handleMouseDown(x: number, y: number): void {
		const clickPoint = this.clampPoint({ x, y });

		// 检查是否点击了某个文本项
		const clickedItem = this.findClickedItem(clickPoint.x, clickPoint.y);
		if (clickedItem) {
			this.selectedItemId = clickedItem.id;
			this.dragState = {
				itemId: clickedItem.id,
				offset: {
					x: clickPoint.x - clickedItem.position.x,
					y: clickPoint.y - clickedItem.position.y
				}
			};
			this.tempDragPosition = { ...clickedItem.position };
			return;
		}

		// 取消选择
		this.selectedItemId = null;
		this.dragState = { itemId: null, offset: { x: 0, y: 0 } };
		this.tempDragPosition = null;
	}

	/**
	 * 处理鼠标移动
	 */
	handleMouseMove(x: number, y: number): void {
		const point = { x, y };

		this.updateCursorStyle(point.x, point.y);

		// 拖动文本项
		if (this.dragState.itemId !== null) {
			const item = this.items.find((i) => i.id === this.dragState.itemId);
			if (item?.text) {
				// 计算新位置（考虑拖动偏移量）
				const newX = point.x - this.dragState.offset.x;
				const newY = point.y - this.dragState.offset.y;
				const bounds = this.getTextBounds(item.text, { x: newX, y: newY });
				if (bounds) {
					// 确保文本框不超出边界
					const clampedX = Math.max(0, Math.min(this.canvasWidth - bounds.width, newX));
					const clampedY = Math.max(0, Math.min(this.canvasHeight - bounds.height, newY));
					this.tempDragPosition = { x: clampedX, y: clampedY };
					this.render();
				}
			}
		}
	}

	/**
	 * 处理鼠标松开（拖拽结束，通知外部）
	 */
	handleMouseUp(): void {
		// 拖拽结束，将临时位置同步到数据并通知外部
		if (this.dragState.itemId !== null && this.tempDragPosition) {
			const newItems = this.items.map((item) =>
				item.id === this.dragState.itemId
					? { ...item, position: { ...this.tempDragPosition! } }
					: item
			);
			this.items = newItems;

			// 通知外部值已改变
			this.onItemsChange?.(this.getItems());
		}

		// 重置拖拽状态
		this.dragState = { itemId: null, offset: { x: 0, y: 0 } };
		this.tempDragPosition = null;
	}

	/**
	 * 处理鼠标离开
	 */
	handleMouseLeave(): void {
		this.handleMouseUp();
	}

	/**
	 * 更新光标样式
	 */
	private updateCursorStyle(x: number, y: number): void {
		if (this.dragState.itemId !== null) {
			this.cursorStyle = 'grabbing';
			return;
		}

		if (this.findClickedItem(x, y) !== null) {
			this.cursorStyle = 'grab';
			return;
		}

		this.cursorStyle = 'default';
	}

	/**
	 * 查找点击的文本项
	 */
	private findClickedItem(x: number, y: number): TextItem | null {
		for (const item of this.items) {
			if (!item.text) continue;
			const bounds = this.getTextBounds(item.text, item.position);
			if (bounds && this.isPointInBounds({ x, y }, bounds)) {
				return item;
			}
		}
		return null;
	}

	/**
	 * 获取文本边界
	 */
	private getTextBounds(
		text: string,
		position: Point
	): { x: number; y: number; width: number; height: number } | null {
		if (!this.ctx) return null;

		this.ctx.font = `normal ${this.fontSize}px sans-serif`;
		const metrics = this.ctx.measureText(text);
		const textWidth = metrics.width;
		const textHeight = this.fontSize;

		return {
			x: position.x,
			y: position.y,
			width: textWidth + this.padding * 2,
			height: textHeight + this.padding * 2
		};
	}

	/**
	 * 检查点是否在边界内
	 */
	private isPointInBounds(
		point: Point,
		bounds: { x: number; y: number; width: number; height: number }
	): boolean {
		return (
			point.x >= bounds.x &&
			point.x <= bounds.x + bounds.width &&
			point.y >= bounds.y &&
			point.y <= bounds.y + bounds.height
		);
	}

	/**
	 * 限制点在画布范围内
	 */
	private clampPoint(point: Point): Point {
		return {
			x: Math.max(0, Math.min(this.canvasWidth, point.x)),
			y: Math.max(0, Math.min(this.canvasHeight, point.y))
		};
	}

	/**
	 * 颜色转 rgba 字符串
	 */
	private colorToRgba(color: Color): string {
		return `rgba(${color[0]}, ${color[1]}, ${color[2]}, ${color[3]})`;
	}

	/**
	 * 销毁控制器
	 */
	destroy(): void {
		this.ctx = null;
		this.dragState = { itemId: null, offset: { x: 0, y: 0 } };
		this.tempDragPosition = null;
	}
}
