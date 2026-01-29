import { AdditiveBlending, BufferAttribute, BufferGeometry, CanvasTexture, type HSL, type Object3D, Points, PointsMaterial } from "three";
import type Time from "../../utils/time";

interface ParticlesConfig {
    time: Time
}

type ParticlesOption = typeof defaultOption


export default class Particles {
    #time: Time
    #option: ParticlesOption
    #enable: boolean
    #instance: Points | null = null

    constructor(config: ParticlesConfig, option: Partial<ParticlesOption>) {
        this.#time = config.time
        this.#enable = true
        this.#option = Object.assign({}, defaultOption, option)
        this.create()
    }

    get instance() {
        return this.#instance
    }

    get enable(){
        return this.#enable;
    }

    set enable(value: boolean) {
        this.#enable = value
    }   

    static createTexture() {
        const canvas = document.createElement("canvas")
        canvas.width = 1024
        canvas.height = 1024
        const context = canvas.getContext("2d")
        if (!context) {
            throw new Error("Failed to get 2D context");
        }
        const gradient = context.createRadialGradient(512, 512, 0, 512, 512, 512)
        gradient.addColorStop(0, "rgba(255,255,255,1)")
        gradient.addColorStop(1, "rgba(255,255,255,0)")
        context.fillStyle = gradient
        context.fillRect(0, 0, 1024, 1024)
        const texture = new CanvasTexture(canvas)
        return texture
    }

    create() {
        const { range, speed, dir, material, num, renderOrder } = this.#option
        const position = []
        const colors = []
        const velocities = []
        for (let i = 0; i < num; i++) {
            position.push(
                Math.random() * range - range / 2,
                Math.random() * range - range / 2,
                Math.random() * range - range / 2
            )
            const dirVec = dir === "up" ? 1 : -1
            velocities.push(Math.random() * dirVec, (0.1 + Math.random()) * dirVec, 0.1 + Math.random() * dirVec)
            const color = material.color.clone()
            let hsl: HSL = {} as HSL
            color.getHSL(hsl)
            color.setHSL(hsl.h, hsl.s, hsl.l * Math.random())
            colors.push(color.r, color.g, color.b)
        }
        const geometry = new BufferGeometry()
        geometry.setAttribute("position", new BufferAttribute(new Float32Array(position), 3))
        geometry.setAttribute("velocities", new BufferAttribute(new Float32Array(velocities), 3))
        geometry.setAttribute("color", new BufferAttribute(new Float32Array(colors), 3))
        this.#instance = new Points(geometry, material)
        this.#instance.renderOrder = renderOrder
    }

    update(delta: number, elapsedTime: number) {
        if (!this.instance) return
        const { range, speed, dir } = this.#option
        const dirVec = dir === "up" ? 1 : -1
        const position = this.instance.geometry.getAttribute("position")
        const velocities = this.instance.geometry.getAttribute("velocities")
        const count = position.count
        for (let i = 0; i < count; i++) {
            let pos_x = position.getX(i)
            let pos_y = position.getY(i)
            let pos_z = position.getZ(i)
            let vel_x = velocities.getX(i)
            let vel_y = velocities.getY(i)
            let vel_z = velocities.getZ(i)
            pos_x += Math.sin(vel_x * elapsedTime) * delta
            pos_z += speed * dirVec
            if (pos_z > range / 2 && dirVec === 1) {
                pos_z = -range / 2
            }
            if (pos_z < -range / 2 && dirVec == -1) {
                pos_z = range / 2
            }
            position.setX(i, pos_x)
            position.setZ(i, pos_z)
            velocities.setX(i, vel_x)
            velocities.setY(i, vel_y)
        }
        position.needsUpdate = true
        velocities.needsUpdate = true
    }

    setParent(parent: Object3D) {
        parent.add(this.#instance!)
        this.#time.on("tick", (delta, elapsedTime) => {
            if (this.#enable) {
                this.update(delta, elapsedTime)
            }
        })
    }
}

const defaultOption = {
    num: 100,
    range: 500,
    speed: 0.01,
    renderOrder: 99,
    dir: "up",
    material: new PointsMaterial({
        map: Particles.createTexture(),
        size: 20,
        color: 0xffffff,
        transparent: true,
        opacity: 1.0,
        depthTest: false,
        vertexColors: true,
        blending: AdditiveBlending,
        sizeAttenuation: true,
    }),
}