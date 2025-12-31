import { Camera, Cartesian3, MaterialProperty, ScreenSpaceEventHandler, Viewer, Math as CesiumMath, Transforms, Matrix4, ScreenSpaceEventType, Cartesian2, Scene, defined, Cartographic, SceneMode, Primitive } from "cesium";

type VideoConfig = {
    videoElement: HTMLVideoElement;
    positions: number[];
    clampToGround?: any;
    /** @default 60.0 */
    horizontalViewAngle?: number;
    /** @default 40.0 */
    verticalViewAngle?: number
    viewPosition?: Cartesian3
    viewPositionEnd?: Cartesian3
}

export default class Video {

    private viewer: Viewer;
    private config: VideoConfig;

    private lightCamera: Camera;
    private handler: ScreenSpaceEventHandler;
    private horizontalViewAngle: number;
    private verticalViewAngle: number;
    private option: VideoConfig;
    private posArray: Cartesian3[];
    private state: string;
    private viewPosition: Cartesian3;
    private viewPositionEnd: Cartesian3;
    private viewDistance: number;
    private viewHeading: number;
    private viewPitch: number;
    private frustumGeometry: Primitive;
    private frustumOutlineGeometry: Primitive;

    constructor(viewer: Viewer, config: VideoConfig) {
        this.viewer = viewer;
        this.config = config;

    }

    public creat() {
        const viewer = this.viewer;
        const { videoElement, positions, clampToGround } = this.config;
        if (clampToGround) {
            viewer.entities.add({
                name: 'video',
                polygon: {
                    hierarchy: Cartesian3.fromDegreesArray(positions),
                    material: videoElement as unknown as MaterialProperty
                }
            })
        } else {
            viewer.entities.add({
                name: "video",
                polygon: {
                    hierarchy: Cartesian3.fromDegreesArrayHeights(positions),
                    material: videoElement as unknown as MaterialProperty,
                    perPositionHeight: true,
                    outline: true
                },
            })
        }
    }

    public clearAll() {
        const dd = viewer.entities.values;
        for (let index = 0; index < dd.length; index++) {
            if (dd[index].name = "video") {
                viewer.entities.remove(dd[index])
                index--;
            }
        }
        videos.forEach((v) => {
            v.destroy();
        })
    }

    public change(object) {
        for (const key in object) {
            const element = object[key];
            this.lightCamera.frustum[key] = element;
            this.clear()
            this.drawFrustumOutline();
        }
    }

    public drawVideo() {
        this.handler = new ScreenSpaceEventHandler(this.viewer.scene.canvas)
        const { horizontalViewAngle = 60.0, verticalViewAngle = 40.0, viewPosition, viewPositionEnd } = this.config
        this.horizontalViewAngle = horizontalViewAngle;
        this.verticalViewAngle = verticalViewAngle;
        this.option = this.config;
        this.posArray = [];
        this.state = "PREPARE";
        if (viewPosition && viewPositionEnd) {
            this.viewPosition = viewPosition;
            this.viewPositionEnd = viewPositionEnd;
            this.viewDistance = Cartesian3.distance(viewPosition, viewPositionEnd);
            this.viewHeading = this.getHeading(this.viewPosition, this.viewPositionEnd);
            this.viewPitch = this.getPitch(this.viewPosition, this.viewPositionEnd);
            this.createLightCamera()
        } else {
            this.action()
        }
    }

    public action() {
        this.handler.setInputAction((movement: { position: Cartesian2; }) => {
            const cartesian = this.getCurrentMousePosition(this.viewer.scene, movement.position);
            if (!cartesian) {
                return;
            }
            if (!this.posArray.length) {
                this.posArray.push(cartesian);
                this.state = "OPERATING";
            } else if (this.posArray.length == 1) {
                this.viewPosition = this.posArray[0];
                this.viewPositionEnd = cartesian;
                this.viewDistance = Cartesian3.distance(this.viewPosition, this.viewPositionEnd);
                this.viewHeading = getHeading(this.viewPosition, this.viewPositionEnd);
                this.viewPitch = getPitch(this.viewPosition, this.viewPositionEnd);

                this.state = "END";
                this.handler.destroy();
                this.handler = null;
                this.createLightCamera();
            }
        }, ScreenSpaceEventType.LEFT_CLICK)
    }
    /** 创建相机 */
    public createLightCamera() { }
    /** 创建视锥线  */
    public drawFrustumOutline() { }

    public clear() {
        this.frustumGeometry.destroy()
        this.frustumGeometry.destroy()
    }

    /** 获取偏航角 */
    private getHeading(fromPosition: Cartesian3, toPosition: Cartesian3) {
        let finalPosition = new Cartesian3();
        let matrix4 = Transforms.eastNorthUpToFixedFrame(fromPosition);
        Matrix4.inverse(matrix4, matrix4);
        Matrix4.multiplyByPoint(matrix4, toPosition, finalPosition);
        Cartesian3.normalize(finalPosition, finalPosition);
        return CesiumMath.toDegrees(Math.atan2(finalPosition.x, finalPosition.y));
    }

    /** 获取俯仰角 */
    private getPitch(fromPosition: Cartesian3, toPosition: Cartesian3) {
        let finalPosition = new Cartesian3();
        let matrix4 = Transforms.eastNorthUpToFixedFrame(fromPosition);
        Matrix4.inverse(matrix4, matrix4);
        Matrix4.multiplyByPoint(matrix4, toPosition, finalPosition);
        Cartesian3.normalize(finalPosition, finalPosition);
        return CesiumMath.toDegrees(Math.asin(finalPosition.z));
    }

    private getCurrentMousePosition(scene: Scene, position: Cartesian2, noPickEntity?: ReturnType<typeof scene.pick>) {
        const pickedObject = scene.pick(position);
        if (scene.pickPositionSupported && defined(pickedObject)) {
            const entity = pickedObject.id;
            if (noPickEntity == null || (noPickEntity && entity !== noPickEntity)) {
                var cartesian = scene.pickPosition(position);
                if (defined(cartesian)) {
                    var cartographic = Cartographic.fromCartesian(cartesian);
                    var height = cartographic.height;
                    if (height >= 0) return cartesian;

                    if (!defined(pickedObject.id) && height >= -500)
                        return cartesian;
                }
            }
        }
        if (scene.mode === SceneMode.SCENE3D) {
            const pickRay = scene.camera.getPickRay(position);
            cartesian = scene.globe.pick(pickRay, scene);
        } else {
            cartesian = scene.camera.pickEllipsoid(position, scene.globe.ellipsoid);
        }
        return cartesian;
    }
}