import { Mesh, MeshBasicMaterial, type Object3D, PlaneGeometry, Vector3 } from "three";
import type Time from "../../utils/time";

interface PlaneConfig {
    time: Time
}

type PlaneOption = typeof defaultOption

const defaultOption = {
    width: 10,
    scale: 1,
    position: new Vector3(0, 0, 0),
    needRotate: false,
    rotateSpeed: 0.001,
    material: new MeshBasicMaterial({
        transparent: true,
        opacity: 1,
        depthTest: true,
    }),
}



export default class Plane {
    #time: Time;
    #option: PlaneOption;
    #instance: Mesh;

    constructor(config: PlaneConfig, option: Partial<PlaneOption>) {
        this.#time = config.time
        this.#option = Object.assign({}, defaultOption, option)
        const plane = new PlaneGeometry(this.#option.width, this.#option.width);
        const mesh = new Mesh(plane, this.#option.material);
        mesh.position.copy(this.#option.position);
        mesh.scale.set(this.#option.scale, this.#option.scale, this.#option.scale);
        this.#instance = mesh;
    }

    get instance() {
        return this.#instance;
    }

    setParent(parent: Object3D) {
        parent.add(this.instance);
        this.#time.on("tick", () => {
            this.update();
        });
    }

    update() {
        if (this.#option.needRotate) {
            this.#instance.rotation.z += this.#option.rotateSpeed;
        }
    }
}