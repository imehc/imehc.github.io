import EventEmitter from "../utils/event-emitter"
import { AxesHelper, Mesh, Scene } from 'three'
import { Sizes } from "../utils/sizes"
import Time from "../utils/time"
import Camera from "./camera"
import Renderer from "./renderer"

const defaultConfig = {
    isOrthographic: false,
}

export type WorldCoreConfig = {
    /** 是否使用正交投影  */
    isOrthographic: boolean
}

export default class WorldCore extends EventEmitter {
    #canvas: HTMLCanvasElement
    #config: WorldCoreConfig
    #scene: Scene
    #sizes: Sizes
    #time: Time
    #camera: Camera
    #renderer: Renderer

    constructor(canvas: HTMLCanvasElement, config: WorldCoreConfig = { isOrthographic: false }) {
        super()
        this.#canvas = canvas
        this.#config = Object.assign({}, defaultConfig, config)
        this.#scene = new Scene()
        this.#sizes = new Sizes({ canvas })
        this.#time = new Time()
        this.#camera = new Camera({
            sizes: this.#sizes,
            scene: this.#scene,
            canvas: this.#canvas
        }, { isOrthographic: this.#config.isOrthographic })
        this.#renderer = new Renderer({
            sizes: this.#sizes,
            scene: this.#scene,
            canvas: this.#canvas,
            camera: this.#camera,
        })
        this.#sizes.on("resize", () => {
            this.resize();
        });
        this.#time.on("tick", (delta) => {
            this.update(delta);
        });
    }

    get canvas() {
        return this.#canvas;
    }

    get sizes() {
        return this.#sizes;
    }

    get scene() {
        return this.#scene;
    }

    get camera() {
        return this.#camera;
    }

    get time() {
        return this.#time;
    }

    get renderer() {
        return this.#renderer;
    }

    /** 设置AxesHelper @default 250 */
    setAxesHelper(size = 250) {
        if (!size) {
            return
        }
        const axes = new AxesHelper(size)
        this.#scene.add(axes)
    }

    resize() {
        this.#camera.resize()
        this.#renderer.resize()
    }
    update(delta?: number) {
        this.#camera.update(delta)
        this.#renderer.update(delta)
    }
    /**
     * 销毁
     */
    destroy() {
        this.#sizes.destroy()
        this.#time.destroy()
        this.#camera.destroy()
        this.#renderer.destroy()
        this.#scene.traverse((child) => {
            if (child instanceof Mesh) {
                child.geometry.dispose()
                for (const key in child.material) {
                    const value = child.material[key]
                    if (value && typeof value.dispose === "function") {
                        value.dispose()
                    }
                }
            }
        });
        (this.#canvas.parentNode as HTMLElement | null)?.removeChild(this.#canvas)
    }
}