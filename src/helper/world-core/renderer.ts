import { type Scene, WebGLRenderer } from "three"
import type { Sizes } from "../utils/sizes"
import type Camera from "./camera"
import { CameraConfig } from "./camera"

interface RendererConfig extends CameraConfig {
    camera: Camera
    postprocessing?: boolean
    composer?: null
}

export default class Renderer {
    #canvas: HTMLCanvasElement
    #sizes: Sizes
    #scene: Scene
    #camera: Camera
    #postprocessing: boolean
    #composer: { render: (delta?: number) => void } | null
    #instance!: WebGLRenderer
    constructor({ canvas, sizes, scene, camera, postprocessing = false, composer = null }: RendererConfig) {
        this.#canvas = canvas
        this.#sizes = sizes
        this.#scene = scene
        this.#camera = camera
        this.#postprocessing = postprocessing
        this.#composer = composer
        this.#setInstance()
    }

    get instance() {
        return this.#instance
    }

    #setInstance() {
        this.#instance = new WebGLRenderer({
            alpha: false,
            antialias: true,
            canvas: this.#canvas,
        })
        this.#instance.setSize(this.#sizes.width, this.#sizes.height)
        this.#instance.setPixelRatio(this.#sizes.pixelRatio)
    }

    resize() {
        this.#instance.setSize(this.#sizes.width, this.#sizes.height)
        this.#instance.setPixelRatio(this.#sizes.pixelRatio)
    }
    update(delta?: number) {
        if (this.#postprocessing && this.#composer) {
            this.#composer.render(delta)
        } else {
            this.#instance.render(this.#scene, this.#camera.instance)
        }
    }
    destroy() {
        this.#instance.dispose()
        this.#instance.forceContextLoss()
    }
}