import { Cartesian2, Cartesian3, CloudCollection, type CumulusCloud, type Viewer } from "cesium";

export interface CloudOption {
    fogX?: number;
    fogY?: number;
    fogBrightness?: number;
}

export default class Cloud {
    private viewer: Viewer;
    private option: CloudOption;
    private cloud: CumulusCloud;

    constructor(viewer: Viewer, option?: CloudOption) {
        this.viewer = viewer;
        this.option = option || { fogX: 25, fogY: 12, fogBrightness: 1 };
        this.init()
    }

    private init() {
        const clouds = this.viewer.scene.primitives.add(
            new CloudCollection({
                noiseDetail: 16.0,
            }),
        );
        this.cloud = clouds.add({
            position: Cartesian3.fromDegrees(114.39264, 30.52252, 200),
            scale: new Cartesian2(this.option.fogX, this.option.fogY),
            slice: 0.36,
            brightness: this.option.fogBrightness,
        })
    }

    update(x: number, y: number, fogBrightness: number) {
        this.cloud.scale = new Cartesian2(x, y);
        this.cloud.brightness = fogBrightness;
    }

    destroy() {
        this.viewer.scene.primitives.remove(this.cloud);
    }
}
