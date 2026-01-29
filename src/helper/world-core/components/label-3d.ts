import type { Object3D, Scene } from "three";
import { type Sizes } from "../../utils/sizes";
import { type CameraConfig } from "../camera";
import type Camera from "../camera";
import type Time from "../../utils/time";
import { CSS3DRenderer } from "three/examples/jsm/renderers/CSS3DRenderer.js";
import { uuid } from "../../utils/uuid";
import CSS3DObject from "../extensions/css-3d-object";
import CSS3DSprite from "../extensions/css-3d-sprite";

interface Label3DConfig extends CameraConfig {
    camera: Camera
    time: Time
}

export type Label = CSS3DObject | CSS3DSprite

export default class Label3D {
    #canvas: HTMLCanvasElement
    #sizes: Sizes
    #scene: Scene
    #camera: Camera
    #time: Time
    #parent: Object3D | null
    #css3DRenderer: CSS3DRenderer

    constructor(config: Label3DConfig) {
        this.#canvas = config.canvas
        this.#sizes = config.sizes
        this.#scene = config.scene
        this.#camera = config.camera
        this.#time = config.time
        this.#parent = null
        let { width, height } = this.#sizes
        this.#css3DRenderer = new CSS3DRenderer()
        this.#css3DRenderer.setSize(width, height)
        this.#css3DRenderer.domElement.style.position = 'absolute'
        this.#css3DRenderer.domElement.style.top = '0px'
        this.#css3DRenderer.domElement.style.left = '0px'
        this.#css3DRenderer.domElement.style.pointerEvents = 'none'
        this.#css3DRenderer.domElement.className = "label3d-" + uuid()
        this.#canvas.parentNode?.appendChild(this.#css3DRenderer.domElement)
        this.#time.on("tick", () => {
            this.update()
        })
        this.#sizes.on("resize", () => {
            this.resize()
        })
    }

    create(content = "", className = "", isSprite = false) {
        const tag = document.createElement("div")
        tag.innerHTML = content
        tag.className = className
        tag.style.visibility = "hidden"
        tag.style.position = "absolute"
        if (!className) {
            tag.style.padding = "10px"
            tag.style.color = "#fff"
            tag.style.fontSize = "12px"
            tag.style.textAlign = "center"
            tag.style.background = "rgba(0,0,0,0.6)"
            tag.style.borderRadius = "4px"
        }
        let label: Label
        if (!isSprite) {
            label = new CSS3DObject(tag)

        } else {
            label = new CSS3DSprite(tag)
        }
        label.init = (content, position) => {
            label.element.innerHTML = content
            label.element.style.visibility = "visible"
            label.position.copy(position)
        }
        label.hide = () => {
            label.element.style.visibility = "hidden"
        }
        label.scaleHide = () => {
            label.element.classList.add("scale-hidden")
        }
        label.show = () => {
            label.element.style.visibility = "visible"
            label.element.classList.remove("scale-hidden")
        }
        label.setParent = (parent) => {
            this.#parent = parent
            parent.add(label)
        }
        label.remove = () => {
            this.#parent?.remove(label)
            return label
        }
        return label
    }

    setLabelStyle(label: Label, scale = 0.1, axis: 'x' | 'y' | 'z' = "x", axisRotation = Math.PI / 2, pointerEvents = "none") {
        label.element.style.pointerEvents = pointerEvents
        label.scale.set(scale, scale, scale)
        //控制HTML标签CSS3对象角度,
        switch (axis) {
            case 'x':
                label.rotation.x = axisRotation;
                break;
            case 'y':
                label.rotation.y = axisRotation;
                break;
            case 'z':
                label.rotation.z = axisRotation;
                break;
            default:
                // 如果传入了无效的轴，默认使用 x 轴
                label.rotation.x = axisRotation;
                break;
        }
    }

    /** 设置层级 */
    setRenderLevel(zIndex: string) {
        this.#css3DRenderer.domElement.style.zIndex = zIndex
    }

    update() {
        this.#css3DRenderer.render(this.#scene, this.#camera.instance)
    }

    resize() {
        let { width, height } = this.#sizes
        this.#css3DRenderer.setSize(width, height)
    }

    destroy() {
        if (this.#css3DRenderer) {
            const domElement = this.#css3DRenderer.domElement
            domElement.parentNode?.removeChild(domElement)
        }
    }
}