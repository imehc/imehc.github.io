import { AdditiveBlending, Color, DoubleSide, Mesh, MeshBasicMaterial, Object3D, PlaneGeometry, Texture } from "three"
import type Assets from "../../assets"
import Resource from "../../utils/resource"
import gsap from "gsap"

interface FocusConfig {
    assets: Assets
}

type FocusOption = typeof defaultOption

const defaultOption = {
    color1: 0xfcc957,
    color2: 0xffffff,
}

type GsapElement = {
    focusMidQuan: Mesh
    focusArrows: Mesh
    focusMoveBg: Mesh
}

export default class Focus extends Object3D {
    #assets: { instance: Resource | null }
    #option: FocusOption
    #gsapObjects: gsap.core.Tween[] // gsap对象
    #animateElements: GsapElement // gsap动画对象

    constructor(config: FocusConfig, option: Partial<FocusOption>) {
        super()
        this.#option = Object.assign({}, defaultOption, option)
        this.#assets = { instance: null }
        this.#assets.instance = config.assets.instance
        this.#gsapObjects = [] // gsap对象
        this.#animateElements = {} as GsapElement // gsap动画对象
        this.init()
    }

    init() {
        const color = this.#option.color1
        // 几何体
        const geometry = new PlaneGeometry(1.5, 1.5, 1)
        const barGeometry = new PlaneGeometry(1, 3, 1)
        barGeometry.translate(0, 1, 0)
        // 材质
        const material = new MeshBasicMaterial({
            color,
            transparent: true,
            fog: false,
            side: DoubleSide,
            depthWrite: false,
        })
        const focusArrowsMaterial = material.clone()

        focusArrowsMaterial.map = this.#assets.instance?.getResource("focusArrows") as Texture
        const focusBarMaterial = material.clone()
        focusBarMaterial.map = this.#assets.instance?.getResource("focusBar") as Texture
        const focusBgMaterial = material.clone()
        focusBgMaterial.map = this.#assets.instance?.getResource("focusBg") as Texture
        const focusMidQuanMaterial = material.clone()
        focusMidQuanMaterial.color = new Color(this.#option.color2)
        focusMidQuanMaterial.map = this.#assets.instance?.getResource("focusMidQuan") as Texture
        const focusMoveBgMaterial = material.clone()
        focusMoveBgMaterial.map = this.#assets.instance?.getResource("focusMoveBg") as Texture
        focusMoveBgMaterial.blending = AdditiveBlending
        const focusArrows = new Mesh(geometry, focusArrowsMaterial)
        const focusBar1 = new Mesh(barGeometry, focusBarMaterial)
        focusBar1.rotation.x = Math.PI / 2
        const focusBar2 = focusBar1.clone()
        focusBar2.rotation.y = Math.PI / 2
        const focusBg = new Mesh(geometry, focusBgMaterial)
        const focusMidQuan = new Mesh(geometry, focusMidQuanMaterial)
        const focusMoveBg = new Mesh(geometry, focusMoveBgMaterial)

        const groupElement = [focusMidQuan, focusBg, focusArrows, focusMoveBg, focusBar1, focusBar2]
        groupElement.map((element) => {
            element.renderOrder = 99
        })
        this.add(...groupElement)
        const moveBgScale = 0
        focusMoveBg.scale.setScalar(moveBgScale)
        this.#animateElements = { focusMidQuan, focusArrows, focusMoveBg }
        this.startAnimate()
    }

    startAnimate() {
        const quanTween = gsap.to(this.#animateElements.focusMidQuan.rotation, {
            z: 2 * Math.PI,
            duration: 8,
            repeat: -1,
            ease: "none",
        })

        const focusArrowsTween = gsap.to(this.#animateElements.focusArrows.rotation, {
            z: 2 * Math.PI,
            duration: 5,
            repeat: -1,
            ease: "none",
        })
        const focusMoveBgTween = gsap.to(this.#animateElements.focusMoveBg.scale, {
            x: 1.5,
            y: 1.5,
            z: 1.5,
            duration: 2.5,
            repeat: -1,
            ease: "none",
        })
        const focusMoveBgMaterialTween = gsap.to(this.#animateElements.focusMoveBg.material, {
            opacity: 0,
            duration: 2.5,
            repeat: -1,
            ease: "none",
        })
        this.#gsapObjects = [quanTween, focusArrowsTween, focusMoveBgTween, focusMoveBgMaterialTween]
    }

    /** 暂停动画 */
    pausedAnimate() {
        this.#gsapObjects.map((element) => {
            element.pause()
        })
    }

    /** 结束动画 */
    destroy() {
        // 停止所有 gsap 动画
        this.#gsapObjects.forEach((element) => {
            element.kill()
        })
    }
}