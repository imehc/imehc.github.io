import EventEmitter from "./event-emitter";

interface SizesOption {
    canvas: HTMLCanvasElement;
}

export class Sizes extends EventEmitter {
    private _canvas: HTMLCanvasElement;
    private _pixelRatio: number;
    private _width: number = 0;
    private _height: number = 0;

    get pixelRatio() {
        return this._pixelRatio;
    }

    get width() {
        return this._width;
    }

    get height() {
        return this._height;
    }

    constructor({ canvas }: SizesOption) {
        super();
        this._canvas = canvas;
        this._pixelRatio = 2;
        this.init();
        window.addEventListener("resize", () => {
            this.init();
            this.emit("resize");
        });
    }
    init() {
        this._width = (this._canvas.parentNode as HTMLElement | null)?.offsetWidth || 0;
        this._height = (this._canvas.parentNode as HTMLElement | null)?.offsetHeight || 0;
        this._pixelRatio = this._pixelRatio || Math.min(window.devicePixelRatio, 2);
    }
    destroy() {
        this.off("resize");
    }
}
