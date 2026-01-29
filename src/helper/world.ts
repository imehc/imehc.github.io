import { AddEquation, AdditiveBlending, AmbientLight, BoxGeometry, Color, type ColorRepresentation, CustomBlending, DirectionalLight, DoubleSide, DstColorFactor, Fog, Group, LineBasicMaterial, Mesh, MeshBasicMaterial, MeshLambertMaterial, MeshStandardMaterial, NearestFilter, type Object3D, type Object3DEventMap, OneFactor, PlaneGeometry, PointLight, PointsMaterial, QuadraticBezierCurve3, RepeatWrapping, Sprite, SpriteMaterial, SRGBColorSpace, type Texture, TubeGeometry, Vector3, Vector3Like } from "three";
import Assets from "./assets";
import WorldCore from "./world-core";
import { InteractionManager } from "three.interactive"
import Label3D, { type Label } from "./world-core/components/label-3d";
import Grid from "./world-core/components/grid";
import Plane from "./world-core/components/plane";
import BaseMap from "./world-core/components/base-map";
import Line from "./world-core/components/line";
import ExtrudeMap from "./world-core/components/extrude-map";
import GradientShader from "./world-core/shader/gradient-shader";
import { sortByValue } from "./utils/sort-by-value";
import provincesData from "../maps/guang-dong"
import chinaData from "../maps/china"
import scatterData from "../maps/scatter"
import infoData from "../maps/info"
import { geoMercator } from "d3-geo";
import DiffuseShader from "./world-core/shader/diffuse-shader";
import gsap from "gsap";
import labelIcon from "/texture/label-icon.png"
import Focus from "./world-core/components/focus";
import Particles from "./world-core/components/particles";
import emitter from "../utils/emitter";

export type Point = [number, number]

type PointLightParam = {
    x: number
    y: number
    z: number
    color?: ColorRepresentation
    intensity?: number
    distance?: number
}

interface WorldMapFocusLabelInfo {
    name: string
    enName: string
    center: Point
}

const defaultMapFocusLabelInfo: WorldMapFocusLabelInfo = {
    // name: "中国",
    // enName: "China",
    // center: [116.397428, 39.90923],
    name: "广东省",
    enName: "GUANGDONG PROVINCE",
    center: [113.280637, 20.625178],
}

export default class World extends WorldCore {
    private readonly _assets?: Assets;
    private readonly _interactionManager: InteractionManager

    /** 中心坐标 */
    private _geoProjectionCenter: Point
    /** 缩放比例 */
    private _geoProjectionScale: number
    /** 飞线中心 */
    private _flyLineCenter: Point
    /** 地图拉伸高度 */
    private _depth: number
    private _mapFocusLabelInfo: WorldMapFocusLabelInfo
    /** 是否点击 */
    private _clicked: boolean

    private _labelGroup!: Group
    private _label3d!: Label3D
    private _flyLineFocusGroup!: Group

    private _eventElement!: Object3D[]
    private _defaultMaterial: MeshStandardMaterial | null = null
    private _defaultLightMaterial: MeshStandardMaterial | null = null

    private _rotateBorder1: Mesh | null = null
    private _rotateBorder2: Mesh | null = null
    private _focusMapGroup: Group | null = null

    private _focusMapTopMaterial: MeshLambertMaterial | MeshStandardMaterial | null = null
    private _focusMapSideMaterial: MeshLambertMaterial | MeshStandardMaterial | null = null
    private _mapLineMaterial: LineBasicMaterial | null = null
    private _barGroup: Group | null = null
    private _allBar: Mesh[] = [];
    private _allBarMaterial: MeshBasicMaterial[] = [];
    private _allGuangquan: Group[] = [];
    private _allProvinceLabel: Label[] = [];
    private _quanGroup: Group | null = null;
    private _otherLabel: Label[] = [];
    private _flyLineGroup: Group | null = null;
    private _particles: Particles | null = null;
    private _particleGroup: Group | null = null;
    private _scatterGroup: Group | null = null;
    private _infoPointGroup: Group | null = null;
    private _infoLabelElement: Label[] = [];
    private _infoPointIndex: number = 0;
    private _animateTl: gsap.core.Timeline | null = null;
    private _infoPointLabelTime: ReturnType<typeof setInterval> | null = null;

    constructor(canvas: HTMLCanvasElement, assets?: Assets) {
        super(canvas);
        this._geoProjectionCenter = [113.280637, 23.125178]
        this._geoProjectionScale = 120
        this._flyLineCenter = [113.544372, 23.329249]
        this._depth = 0.5
        this._mapFocusLabelInfo = defaultMapFocusLabelInfo
        this._clicked = false
        this.scene.fog = new Fog(0x102736, 1, 50)// 雾
        this.scene.background = new Color(0x102736)// 背景
        this.camera.instance.position.set(-13.767695123014105, 12.990152163077308, 39.28228164159694) // 相机初始位置
        this.camera.instance.near = 1
        this.camera.instance.far = 10000
        this.camera.instance.updateProjectionMatrix()
        this._interactionManager = new InteractionManager(this.renderer.instance, this.camera.instance, canvas)//交互管理
        this._assets = assets;
        this.initEnvironment()
        this.init()
    }

    get animateTl() {
        return this._animateTl!
    }

    private init() {
        // 标签组
        this._labelGroup = new Group()
        this._label3d = new Label3D({
            canvas: this.canvas,
            sizes: this.sizes,
            scene: this.scene,
            camera: this.camera,
            time: this.time
        })
        this._labelGroup.rotation.x = -Math.PI / 2
        this.scene.add(this._labelGroup)
        // 飞线焦点光圈组
        this._flyLineFocusGroup = new Group()
        this._flyLineFocusGroup.visible = false
        this._flyLineFocusGroup.rotation.x = -Math.PI / 2
        this.scene.add(this._flyLineFocusGroup)
        // 区域事件元素
        this._eventElement = []
        // 鼠标移上移除的材质
        this._defaultMaterial = null // 默认材质
        this._defaultLightMaterial = null // 高亮材质

        this.createBottomBg()
        this.createChinaBlurLine()
        this.createGrid()
        this.createRotateBorder()
        this.createLabel()
        this.createMap()
        this.createEvent()
        this.createFlyLine()
        this.createFocus()
        this.createParticles()
        this.createScatter()
        this.createInfoPoint()
        this.createStorke()
        this.createAnimationTimeline()
    }

    /** 初始化环境光 */
    private initEnvironment() {
        const sun = new AmbientLight(0xffffff, 5)
        this.scene.add(sun)
        const directionalLight = new DirectionalLight(0xffffff, 5)
        directionalLight.position.set(-30, 6, -8)
        directionalLight.castShadow = true
        directionalLight.shadow.radius = 20
        directionalLight.shadow.mapSize.width = 1024
        directionalLight.shadow.mapSize.height = 1024
        this.scene.add(directionalLight)
        this.createPointLight({
            color: "#1d5e5e",
            intensity: 800,
            distance: 10000,
            x: -9,
            y: 3,
            z: -3,
        })
        this.createPointLight({
            color: "#1d5e5e",
            intensity: 200,
            distance: 10000,
            x: 0,
            y: 2,
            z: 5,
        })
    }

    private createPointLight(pointParam: PointLightParam) {
        const pointLight = new PointLight(pointParam.color, pointParam.intensity, pointParam.distance)
        pointLight.position.set(pointParam.x, pointParam.y, pointParam.z)
        this.scene.add(pointLight)
    }

    /** 创建地图 */
    private createMap() {
        const mapGroup = new Group()
        const focusMapGroup = new Group()
        this._focusMapGroup = focusMapGroup
        const { china, chinaTopLine } = this.createChina()
        const { map, mapTop, mapLine } = this.createProvince()
        china.setParent(mapGroup)
        chinaTopLine.setParent(mapGroup)
        // 创建扩散
        this.createDiffuse()
        map.setParent(focusMapGroup)
        mapTop.setParent(focusMapGroup)
        mapLine.setParent(focusMapGroup)
        focusMapGroup.position.set(0, 0, -0.01)
        focusMapGroup.scale.set(1, 1, 0)
        mapGroup.add(focusMapGroup)
        mapGroup.rotation.x = -Math.PI / 2
        mapGroup.position.set(0, 0.2, 0)
        this.scene.add(mapGroup)
        this.createBar()
    }

    private createChina() {
        const params = {
            chinaBgMaterialColor: "#152c47",
            lineColor: "#3f82cd",
        }
        const chinaData = this._assets?.instance.getResource("china") as string
        if (!chinaData) {
            throw new Error("chinaData is not found")
        }
        const chinaBgMaterial = new MeshLambertMaterial({
            color: new Color(params.chinaBgMaterialColor),
            transparent: true,
            opacity: 1,
        })
        const china = new BaseMap({}, {
            //position: new Vector3(0, 0, -0.03),
            data: chinaData,
            geoProjectionCenter: this._geoProjectionCenter,
            geoProjectionScale: this._geoProjectionScale,
            merge: true,
            material: chinaBgMaterial,
            renderOrder: 2,
        })
        const chinaTopLineMaterial = new LineBasicMaterial({
            color: params.lineColor,
        })
        const chinaTopLine = new Line({}, {
            // position: new Vector3(0, 0, -0.02),
            data: chinaData,
            geoProjectionCenter: this._geoProjectionCenter,
            geoProjectionScale: this._geoProjectionScale,
            material: chinaTopLineMaterial,
            renderOrder: 3,
        })
        chinaTopLine.lineGroup.position.z += 0.01
        return { china, chinaTopLine }
    }

    private createProvince() {
        const mapJsonData = this._assets?.instance.getResource("mapJson") as string
        if (!mapJsonData) {
            throw new Error("chinaData is not found")
        }
        const [topMaterial, sideMaterial] = this.createProvinceMaterial()
        this._focusMapTopMaterial = topMaterial
        this._focusMapSideMaterial = sideMaterial
        const map = new ExtrudeMap({ assets: this._assets!, time: this.time }, {
            geoProjectionCenter: this._geoProjectionCenter,
            geoProjectionScale: this._geoProjectionScale,
            position: new Vector3(0, 0, 0.11),
            data: mapJsonData,
            depth: this._depth,
            topFaceMaterial: topMaterial,
            sideMaterial: sideMaterial,
            renderOrder: 9,
        })
        const faceMaterial = new MeshStandardMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0.5,
            // fog: false,
        })
        const faceGradientShader = new GradientShader(faceMaterial, {
            // uColor1: 0x2a6e92,
            // uColor2: 0x102736,
            uColor1: 0x12bbe0,
            uColor2: 0x0094b5,
        })
        this._defaultMaterial = faceMaterial
        this._defaultLightMaterial = this._defaultMaterial.clone()
        this._defaultLightMaterial.color = new Color("rgba(115,208,255,1)")
        this._defaultLightMaterial.opacity = 0.8
        // this.defaultLightMaterial.emissive.setHex(new Color("rgba(115,208,255,1)"));
        // this.defaultLightMaterial.emissiveIntensity = 3.5;
        const mapTop = new BaseMap({}, {
            geoProjectionCenter: this._geoProjectionCenter,
            geoProjectionScale: this._geoProjectionScale,
            position: new Vector3(0, 0, this._depth + 0.22),
            data: mapJsonData,
            material: faceMaterial,
            renderOrder: 2,
        })
        mapTop.mapGroup.children.map((group) => {
            group.children.map((mesh) => {
                if (mesh.type === "Mesh") {
                    this._eventElement.push(mesh)
                }
            })
        })
        this._mapLineMaterial = new LineBasicMaterial({
            color: 0xffffff,
            opacity: 0,
            transparent: true,
            fog: false,
        })
        const mapLine = new Line(this, {
            geoProjectionCenter: this._geoProjectionCenter,
            geoProjectionScale: this._geoProjectionScale,
            data: mapJsonData,
            material: this._mapLineMaterial,
            renderOrder: 3,
        })
        mapLine.lineGroup.position.z += this._depth + 0.23
        return {
            map,
            mapTop,
            mapLine,
        }
    }

    private createProvinceMaterial() {
        const topMaterial = new MeshLambertMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0,
            fog: false,
            side: DoubleSide,
        })
        topMaterial.onBeforeCompile = (shader) => {
            shader.uniforms = {
                ...shader.uniforms,
                uColor1: { value: new Color(0x2a6e92) }, // 419daa
                uColor2: { value: new Color(0x102736) },
            }
            shader.vertexShader = shader.vertexShader.replace(
                "void main() {",
                `
        attribute float alpha;
        varying vec3 vPosition;
        varying float vAlpha;
        void main() {
          vAlpha = alpha;
          vPosition = position;
      `
            )
            shader.fragmentShader = shader.fragmentShader.replace(
                "void main() {",
                `
        varying vec3 vPosition;
        varying float vAlpha;
        uniform vec3 uColor1;
        uniform vec3 uColor2;
        void main() {
      `
            )
            shader.fragmentShader = shader.fragmentShader.replace(
                "#include <opaque_fragment>",
        /* glsl */ `
      #ifdef OPAQUE
      diffuseColor.a = 1.0;
      #endif
            #ifdef USE_TRANSMISSION
      diffuseColor.a *= transmissionAlpha + 0.1;
      #endif
      vec3 gradient = mix(uColor1, uColor2, vPosition.x/15.78);       
      outgoingLight = outgoingLight*gradient;
      float topAlpha = 0.5;
      if(vPosition.z>0.3){
        diffuseColor.a *= topAlpha;
      }
      gl_FragColor = vec4( outgoingLight, diffuseColor.a  );
      `
            )
        }
        const sideMap = this._assets?.instance.getResource("side") as Texture
        if (!sideMap) {
            throw new Error("sideMap is not found")
        }
        sideMap.wrapS = RepeatWrapping
        sideMap.wrapT = RepeatWrapping
        sideMap.repeat.set(1, 1.5)
        sideMap.offset.y += 0.065
        const sideMaterial = new MeshStandardMaterial({
            color: 0xffffff,
            map: sideMap,
            fog: false,
            opacity: 0,
            side: DoubleSide,
        })
        this.time.on("tick", () => {
            sideMap.offset.y += 0.005
        })
        sideMaterial.onBeforeCompile = (shader) => {
            shader.uniforms = {
                ...shader.uniforms,
                uColor1: { value: new Color(0x2a6e92) },
                uColor2: { value: new Color(0x2a6e92) },
            }
            shader.vertexShader = shader.vertexShader.replace(
                "void main() {",
                `
        attribute float alpha;
        varying vec3 vPosition;
        varying float vAlpha;
        void main() {
          vAlpha = alpha;
          vPosition = position;
      `
            )
            shader.fragmentShader = shader.fragmentShader.replace(
                "void main() {",
                `
        varying vec3 vPosition;
        varying float vAlpha;
        uniform vec3 uColor1;
        uniform vec3 uColor2;
        void main() {
      `
            )
            shader.fragmentShader = shader.fragmentShader.replace(
                "#include <opaque_fragment>",
        /* glsl */ `
      #ifdef OPAQUE
      diffuseColor.a = 1.0;
      #endif
            #ifdef USE_TRANSMISSION
      diffuseColor.a *= transmissionAlpha + 0.1;
      #endif
      vec3 gradient = mix(uColor1, uColor2, vPosition.z/1.2);
      outgoingLight = outgoingLight*gradient;
      gl_FragColor = vec4( outgoingLight, diffuseColor.a  );
      `
            )
        }
        return [topMaterial, sideMaterial]
    }

    private createBar() {
        const self = this
        const data = sortByValue(provincesData).filter((_item, index) => index < 7)
        const barGroup = new Group()
        this._barGroup = barGroup
        const factor = 0.7
        const height = 4.0 * factor
        const max = data[0].value
        this._allBar = []
        this._allBarMaterial = []
        this._allGuangquan = []
        this._allProvinceLabel = []
        data.map((item, index) => {
            const geoHeight = height * (item.value / max)
            const material = new MeshBasicMaterial({
                color: 0xffffff,
                transparent: true,
                opacity: 0,
                depthTest: false,
                fog: false,
            })
            new GradientShader(material, {
                uColor1: index > 3 ? 0xfbdf88 : 0x50bbfe,
                uColor2: index > 3 ? 0xfffef4 : 0x77fbf5,
                size: geoHeight,
                dir: "y",
            })
            const geo = new BoxGeometry(0.1 * factor, 0.1 * factor, geoHeight)
            geo.translate(0, 0, geoHeight / 2)
            const mesh = new Mesh(geo, material)
            mesh.renderOrder = 5
            const areaBar = mesh
            const [x, y] = this.geoProjection(item.centroid as [number, number])
            areaBar.position.set(x, -y, this._depth + 0.45)
            areaBar.scale.set(1, 1, 0)
            areaBar.userData = { ...item }
            const guangQuan = this.createQuan(new Vector3(x, this._depth + 0.44, y), index)
            const hg = this.createHUIGUANG(geoHeight, index > 3 ? 0xfffef4 : 0x77fbf5)
            areaBar.add(...hg)
            barGroup.add(areaBar)
            barGroup.rotation.x = -Math.PI / 2
            const barLabel = labelStyle04(item, index, new Vector3(x, -y, this._depth + 1.1 + geoHeight))
            this._allBar.push(areaBar)
            this._allBarMaterial.push(material)
            this._allGuangquan.push(guangQuan)
            this._allProvinceLabel.push(barLabel)
        })
        this.scene.add(barGroup)

        type ProvinceLabel = {
            name: string
            value: number
            enName: string
            center?: number[]
            centroid?: number[]
        }
        function labelStyle04(data: ProvinceLabel, index: number, position: Vector3Like) {
            let label = self._label3d.create("", "provinces-label", false)
            label.init(
                `<div class="provinces-label ${index > 4 ? "yellow" : ""}">
                    <div class="provinces-label-wrap">
                        <div class="number"><span class="value">${data.value}</span><span class="unit">万人</span></div>
                        <div class="name">
                        <span class="zh">${data.name}</span>
                        <span class="en">${data.enName.toUpperCase()}</span>
                        </div>
                        <div class="no">${index + 1}</div>
                    </div>
                </div>`,
                position
            )
            self._label3d.setLabelStyle(label, 0.01, "x")
            label.setParent(self._labelGroup)
            return label
        }
    }

    /** 添加事件 */
    private createEvent() {
        let objectsHover: Object3D[] = []
        const reset = (mesh: Object3D) => {
            mesh.traverse((obj) => {
                if ('isMesh' in obj && obj.isMesh) {
                    (obj as Mesh).material = this._defaultMaterial!
                }
            })
        }
        const move = (mesh: Object3D) => {
            mesh.traverse((obj) => {
                if ('isMesh' in obj && obj.isMesh) {
                    (obj as Mesh).material = this._defaultLightMaterial!
                }
            })
        }
        this._eventElement.map((mesh) => {
            this._interactionManager.add(mesh)
            mesh.addEventListener("mousedown" as keyof Object3DEventMap, (ev) => {
                console.log(ev.target.userData.name)
            })
            mesh.addEventListener("mouseover" as keyof Object3DEventMap, (event) => {
                if (!objectsHover.includes(event.target.parent!)) {
                    objectsHover.push(event.target.parent!)
                }
                document.body.style.cursor = "pointer"
                move(event.target.parent!)
            })
            mesh.addEventListener("mouseout" as keyof Object3DEventMap, (event) => {
                objectsHover = objectsHover.filter((n) => n.userData.name !== (event.target.parent!).userData.name)
                if (objectsHover.length > 0) {
                    const mesh = objectsHover[objectsHover.length - 1]
                }
                reset(event.target.parent!)
                document.body.style.cursor = "default"
            })
        })
    }

    private createHUIGUANG(h: number, color: number) {
        const geometry = new PlaneGeometry(0.35, h)
        geometry.translate(0, h / 2, 0)
        const texture = this._assets?.instance.getResource("huiguang") as Texture
        if (!texture) {
            throw new Error("huiguang texture not found")
        }
        texture.colorSpace = SRGBColorSpace
        texture.wrapS = RepeatWrapping
        texture.wrapT = RepeatWrapping
        const material = new MeshBasicMaterial({
            color: color,
            map: texture,
            transparent: true,
            opacity: 0.4,
            depthWrite: false,
            side: DoubleSide,
            blending: AdditiveBlending,
        })
        const mesh = new Mesh(geometry, material)
        mesh.renderOrder = 10
        mesh.rotateX(Math.PI / 2)
        const mesh2 = mesh.clone()
        const mesh3 = mesh.clone()
        mesh2.rotateY((Math.PI / 180) * 60)
        mesh3.rotateY((Math.PI / 180) * 120)
        return [mesh, mesh2, mesh3]
    }

    private createQuan(position: Vector3Like, index: number) {
        const guangquan1 = this._assets?.instance.getResource("guangquan1") as Texture
        const guangquan2 = this._assets?.instance.getResource("guangquan2") as Texture
        if (!guangquan1 || !guangquan2) {
            throw new Error("guangquan1 or guangquan2 not found")
        }
        const geometry = new PlaneGeometry(0.5, 0.5)
        const material1 = new MeshBasicMaterial({
            color: 0xffffff,
            map: guangquan1,
            alphaMap: guangquan1,
            opacity: 1,
            transparent: true,
            depthTest: false,
            fog: false,
            blending: AdditiveBlending,
        })
        const material2 = new MeshBasicMaterial({
            color: 0xffffff,
            map: guangquan2,
            alphaMap: guangquan2,
            opacity: 1,
            transparent: true,
            depthTest: false,
            fog: false,
            blending: AdditiveBlending,
        })
        const mesh1 = new Mesh(geometry, material1)
        const mesh2 = new Mesh(geometry, material2)
        mesh1.renderOrder = 6
        mesh2.renderOrder = 6
        mesh1.rotateX(-Math.PI / 2)
        mesh2.rotateX(-Math.PI / 2)
        mesh1.position.copy(position)
        mesh2.position.copy(position)
        mesh2.position.y -= 0.001
        mesh1.scale.set(0, 0, 0)
        mesh2.scale.set(0, 0, 0)
        this._quanGroup = new Group()
        this._quanGroup.add(mesh1, mesh2)
        this.scene.add(this._quanGroup)
        this.time.on("tick", () => {
            mesh1.rotation.z += 0.05
        })
        return this._quanGroup
    }

    /** 创建扩散 */

    private createDiffuse() {
        const geometry = new PlaneGeometry(200, 200)
        const material = new MeshBasicMaterial({
            color: 0x000000,
            depthWrite: false,
            // depthTest: false,
            transparent: true,
            blending: CustomBlending,
        })
        // 使用CustomBlending  实现混合叠加
        material.blendEquation = AddEquation
        material.blendSrc = DstColorFactor
        material.blendDst = OneFactor
        const diffuse = new DiffuseShader({
            material,
            time: this.time,
            size: 60,
            diffuseSpeed: 8.0,
            diffuseColor: 0x71918e,
            diffuseWidth: 2.0,
            callback: (pointShader) => {
                setTimeout(() => {
                    gsap.to(pointShader.uniforms.uTime, {
                        value: 4,
                        repeat: -1,
                        duration: 6,
                        ease: "power1.easeIn",
                    })
                }, 3)
            },
        })
        const mesh = new Mesh(geometry, material)
        mesh.renderOrder = 3
        mesh.rotation.x = -Math.PI / 2
        mesh.position.set(0, 0.21, 0)
        this.scene.add(mesh)
    }

    /** 扩散网格 */
    private createGrid() {
        new Grid(
            {
                scene: this.scene,
                time: this.time
            },
            {
                gridSize: 50,
                gridDivision: 20,
                gridColor: 0x1b4b70,
                shapeSize: 0.5,
                shapeColor: 0x2a5f8a,
                pointSize: 0.1,
                pointColor: 0x154d7d,
            }
        )
    }

    /** 创建底部高亮 */
    private createBottomBg() {
        const geometry = new PlaneGeometry(20, 20)
        const texture = this._assets?.instance.getResource("ocean") as Texture | undefined
        if (!texture) {
            throw new Error("ocean texture not found")
        }
        texture.colorSpace = SRGBColorSpace
        texture.wrapS = RepeatWrapping
        texture.wrapT = RepeatWrapping
        texture.repeat.set(1, 1)
        const material = new MeshBasicMaterial({
            map: texture,
            opacity: 1,
            fog: false,
        })
        const mesh = new Mesh(geometry, material)
        mesh.rotation.x = -Math.PI / 2
        mesh.position.set(0, -0.7, 0)
        this.scene.add(mesh)
    }

    /** 模糊边线 */
    private createChinaBlurLine() {
        const geometry = new PlaneGeometry(147, 147)
        const texture = this._assets?.instance.getResource("chinaBlurLine") as Texture | undefined
        if (!texture) {
            throw new Error("chinaBlurLine not found")
        }
        texture.colorSpace = SRGBColorSpace
        texture.wrapS = RepeatWrapping
        texture.wrapT = RepeatWrapping
        texture.generateMipmaps = false
        texture.minFilter = NearestFilter
        texture.repeat.set(1, 1)
        const material = new MeshBasicMaterial({
            color: 0x3f82cd,
            alphaMap: texture,
            transparent: true,
            opacity: 0.5,
        })
        const mesh = new Mesh(geometry, material)
        mesh.rotateX(-Math.PI / 2)
        mesh.position.set(-19.3, -0.5, -19.7)
        this.scene.add(mesh)
    }

    /** 创建标签 */
    private createLabel() {
        const self = this
        const labelGroup = this._labelGroup
        const label3d = this._label3d
        const otherLabel: Label[] = []
        chinaData.map((province) => {
            if (province.hide == true) return false
            let label = labelStyle01(province, label3d, labelGroup)
            otherLabel.push(label)
        })
        const mapFocusLabel = labelStyle02(
            {
                ...this._mapFocusLabelInfo,
            },
            label3d,
            labelGroup
        )
        const iconLabel1 = labelStyle03(
            {
                icon: labelIcon,
                center: [118.280637, 21.625178],
                width: "40px",
                height: "40px",
                reflect: true,
            },
            label3d,
            labelGroup
        )
        const iconLabel2 = labelStyle03(
            {
                icon: labelIcon,
                center: [106.280637, 25.625178],
                width: "20px",
                height: "20px",
                reflect: false,
            },
            label3d,
            labelGroup
        )
        otherLabel.push(mapFocusLabel)
        otherLabel.push(iconLabel1)
        otherLabel.push(iconLabel2)
        this._otherLabel = otherLabel

        type DecorationLabel = typeof chinaData[0]
        type ProvinceLabel = {
            icon: string;
            center: [number, number];
            width: string;
            height: string;
            reflect: boolean;
        }
        function labelStyle01(province: DecorationLabel, label3d: Label3D, labelGroup: Group) {
            let label = label3d.create("", `china-label ${province.blur ? " blur" : ""}`, false)
            const [x, y] = self.geoProjection(province.center as [number, number])
            label.init(
                `<div class="other-label"><img class="label-icon" src="${labelIcon}">${province.name}</div>`,
                new Vector3(x, -y, 0.4)
            )
            label3d.setLabelStyle(label, 0.02, "x")
            label.setParent(labelGroup)
            return label
        }
        function labelStyle02(province: WorldMapFocusLabelInfo, label3d: Label3D, labelGroup: Group) {
            let label = label3d.create("", "map-label", false)
            const [x, y] = self.geoProjection(province.center)
            label.init(
                `<div class="other-label"><span>${province.name}</span><span>${province.enName}</span></div>`,
                new Vector3(x, -y, 0.4)
            )
            label3d.setLabelStyle(label, 0.015, "x")
            label.setParent(labelGroup)
            return label
        }
        function labelStyle03(data: ProvinceLabel, label3d: Label3D, labelGroup: Group) {
            let label = label3d.create("", `decoration-label  ${data.reflect ? " reflect" : ""}`, false)
            const [x, y] = self.geoProjection(data.center)
            label.init(
                `<div class="other-label"><img class="label-icon" style="width:${data.width};height:${data.height}" src="${data.icon}">`,
                new Vector3(x, -y, 0.4)
            )
            label3d.setLabelStyle(label, 0.02, "x")
            label.setParent(labelGroup)
            return label
        }
        function labelStyle04(data: WorldMapFocusLabelInfo & { value: number }, label3d: Label3D, labelGroup: Group, index: number) {
            let label = label3d.create("", "provinces-label", false)
            const [x, y] = self.geoProjection(data.center)
            label.init(
                `<div class="provinces-label">
                    <div class="provinces-label-wrap">
                        <div class="number">${data.value}<span>万人</span></div>
                        <div class="name">
                        <span class="zh">${data.name}</span>
                        <span class="en">${data.enName.toUpperCase()}</span>
                        </div>
                        <div class="no">${index + 1}</div>
                    </div>
                </div>`,
                new Vector3(x, -y, 2.4)
            )
            label3d.setLabelStyle(label, 0.02, "x")
            label.setParent(labelGroup)
            return label
        }
    }

    /** 旋转圆环 */
    private createRotateBorder() {
        const max = 12
        const rotationBorder1 = this._assets?.instance.getResource("rotationBorder1") as Texture | undefined
        const rotationBorder2 = this._assets?.instance.getResource("rotationBorder2") as Texture | undefined
        if (!rotationBorder1 || !rotationBorder2) {
            throw new Error("rotationBorder1 or rotationBorder2 not found")
        }
        const plane01 = new Plane({ time: this.time },
            {
                width: max * 1.178,
                needRotate: true,
                rotateSpeed: 0.001,
                material: new MeshBasicMaterial({
                    map: rotationBorder1,
                    color: 0x48afff,
                    transparent: true,
                    opacity: 0.2,
                    side: DoubleSide,
                    depthWrite: false,
                    blending: AdditiveBlending,
                }),
                position: new Vector3(0, 0.28, 0)
            })
        plane01.instance.rotation.x = -Math.PI / 2
        plane01.instance.renderOrder = 6
        plane01.instance.scale.set(0, 0, 0)
        plane01.setParent(this.scene)

        const plane02 = new Plane({ time: this.time },
            {
                width: max * 1.116,
                needRotate: true,
                rotateSpeed: -0.004,
                material: new MeshBasicMaterial({
                    map: rotationBorder2,
                    color: 0x48afff,
                    transparent: true,
                    opacity: 0.4,
                    side: DoubleSide,
                    depthWrite: false,
                    blending: AdditiveBlending,
                }),
                position: new Vector3(0, 0.3, 0),
            })
        plane02.instance.rotation.x = -Math.PI / 2
        plane02.instance.renderOrder = 6
        plane02.instance.scale.set(0, 0, 0)
        plane02.setParent(this.scene)
        this._rotateBorder1 = plane01.instance
        this._rotateBorder2 = plane02.instance
    }

    /** 创建飞线 */
    private createFlyLine() {
        this._flyLineGroup = new Group()
        this._flyLineGroup.visible = false
        this.scene.add(this._flyLineGroup)
        const texture = this._assets?.instance.getResource("mapFlyline") as Texture
        if (!texture) {
            throw new Error("mapFlyline texture not found")
        }
        texture.wrapS = texture.wrapT = RepeatWrapping
        texture.repeat.set(0.5, 2)
        const tubeRadius = 0.1
        const tubeSegments = 32
        const tubeRadialSegments = 2
        const closed = false
        const [centerX, centerY] = this.geoProjection(this._flyLineCenter)
        const centerPoint = new Vector3(centerX, -centerY, 0)
        const material = new MeshBasicMaterial({
            map: texture,
            // alphaMap: texture,
            color: 0x2a6f72,
            transparent: true,
            fog: false,
            opacity: 1,
            depthTest: false,
            blending: AdditiveBlending,
        })
        this.time.on("tick", () => {
            texture.offset.x -= 0.006
        })
        provincesData
            .filter((_item, index) => index < 7)
            .map((city) => {
                let [x, y] = this.geoProjection(city.centroid as [number, number])
                let point = new Vector3(x, -y, 0)
                const center = new Vector3()
                center.addVectors(centerPoint, point).multiplyScalar(0.5)
                center.setZ(3)
                const curve = new QuadraticBezierCurve3(centerPoint, center, point)
                const tubeGeometry = new TubeGeometry(curve, tubeSegments, tubeRadius, tubeRadialSegments, closed)
                const mesh = new Mesh(tubeGeometry, material)
                mesh.rotation.x = -Math.PI / 2
                mesh.position.set(0, this._depth + 0.44, 0)
                mesh.renderOrder = 21
                this._flyLineGroup?.add(mesh)
            })
    }

    /** 创建飞线焦点 */
    private createFocus() {
        const focusObj = new Focus({ assets: this._assets! }, { color1: 0xbdfdfd, color2: 0xbdfdfd })
        const [x, y] = this.geoProjection(this._flyLineCenter)
        focusObj.position.set(x, -y, this._depth + 0.44)
        focusObj.scale.set(1, 1, 1)
        this._flyLineFocusGroup.add(focusObj)
    }

    /** 创建粒子 */
    private createParticles() {
        this._particles = new Particles({ time: this.time }, {
            num: 10,
            range: 30,
            dir: "up",
            speed: 0.05,
            material: new PointsMaterial({
                map: Particles.createTexture(),
                size: 1,
                color: 0x00eeee,
                transparent: true,
                opacity: 1,
                depthTest: false,
                depthWrite: false,
                vertexColors: true,
                blending: AdditiveBlending,
                sizeAttenuation: true,
            }),
        })
        this._particleGroup = new Group()
        this.scene.add(this._particleGroup)
        this._particleGroup.rotation.x = -Math.PI / 2
        this._particles.setParent(this._particleGroup)
        this._particles.enable = true
        this._particleGroup.visible = true
    }

    /** 创建散点图 */
    private createScatter() {
        this._scatterGroup = new Group()
        this._scatterGroup.visible = false
        this._scatterGroup.rotation.x = -Math.PI / 2
        this.scene.add(this._scatterGroup)
        const texture = this._assets?.instance.getResource("arrow") as Texture
        if (!texture) {
            throw new Error("arrow texture not found")
        }
        const material = new SpriteMaterial({
            map: texture,
            color: 0xfffef4,
            fog: false,
            transparent: true,
            depthTest: false,
        })
        const scatterAllData = sortByValue(scatterData)
        const max = scatterAllData[0].value
        scatterAllData.map((data) => {
            const sprite = new Sprite(material)
            sprite.renderOrder = 23
            let scale = 0.1 + (data.value / max) * 0.2
            sprite.scale.set(scale, scale, scale)
            const [x, y] = this.geoProjection([data.lng, data.lat])
            sprite.position.set(x, -y, this._depth + 0.45)
            sprite.userData.position = [x, -y, this._depth + 0.45]
            this._scatterGroup?.add(sprite)
        })
    }

    /** 创建信息点 */
    private createInfoPoint() {
        const self = this
        this._infoPointGroup = new Group()
        this.scene.add(this._infoPointGroup)
        this._infoPointGroup.visible = false
        this._infoPointGroup.rotation.x = -Math.PI / 2
        this._infoPointIndex = 0
        this._infoPointLabelTime = null
        this._infoLabelElement = []
        const label3d = this._label3d
        const texture = this._assets?.instance.getResource("point") as Texture
        if (!texture) {
            throw new Error("point texture not found")
        }
        const colors = [0xfffef4, 0x77fbf5]
        const infoAllData = sortByValue(infoData)
        const max = infoAllData[0].value
        infoAllData.map((data, index) => {
            const material = new SpriteMaterial({
                map: texture,
                color: colors[index % colors.length],
                fog: false,
                transparent: true,
                depthTest: false,
            })
            const sprite = new Sprite(material)
            sprite.renderOrder = 23
            const scale = 0.7 + (data.value / max) * 0.4
            sprite.scale.set(scale, scale, scale)
            const [x, y] = this.geoProjection([data.lng, data.lat])
            const position = [x, -y, this._depth + 0.7]
            sprite.position.set(position[0], position[1], position[2])
            sprite.userData.position = [...position]
            sprite.userData = {
                position: [x, -y, this._depth + 0.7],
                name: data.name,
                value: data.value,
                level: data.level,
                index: index,
            }
            this._infoPointGroup?.add(sprite)
            let label = infoLabel(data, label3d, this._infoPointGroup!)
            this._infoLabelElement.push(label)
            this._interactionManager.add(sprite)
            sprite.addEventListener("mousedown" as keyof Object3DEventMap, (ev) => {
                if (this._clicked || !this._infoPointGroup?.visible) return false
                this._clicked = true
                this._infoPointIndex = ev.target.userData.index
                this._infoLabelElement.map((label) => {
                    label.visible = false
                })
                label.visible = true
                this.createInfoPointLabelLoop()
            })
            sprite.addEventListener("mouseup" as keyof Object3DEventMap, (ev) => {
                this._clicked = false
            })
            sprite.addEventListener("mouseover" as keyof Object3DEventMap, (event) => {
                document.body.style.cursor = "pointer"
            })
            sprite.addEventListener("mouseout" as keyof Object3DEventMap, (event) => {
                document.body.style.cursor = "default"
            })
        })

        type Label3dConfig = typeof infoData[0]
        function infoLabel(data: Label3dConfig, label3d: Label3D, labelGroup: Group) {
            const label = label3d.create("", "info-point", true)
            const [x, y] = self.geoProjection([data.lng, data.lat])
            label.init(
                ` <div class="info-point-wrap">
                    <div class="info-point-wrap-inner">
                        <div class="info-point-line">
                        <div class="line"></div>
                        <div class="line"></div>
                        <div class="line"></div>
                        </div>
                        <div class="info-point-content">
                        <div class="content-item"><span class="label">名称</span><span class="value">${data.name}</span></div>
                        <div class="content-item"><span class="label">PM2.5</span><span class="value">${data.value}ug/m²</span></div>
                        <div class="content-item"><span class="label">等级</span><span class="value">${data.level}</span></div>
                        </div>
                    </div>
                    </div>
                `,
                new Vector3(x, -y, self._depth + 1.9)
            )
            label3d.setLabelStyle(label, 0.015, "x")
            label.setParent(labelGroup)
            label.visible = false
            return label
        }
    }

    private createInfoPointLabelLoop() {
        clearInterval(this._infoPointLabelTime as number)
        this._infoPointLabelTime = setInterval(() => {
            this._infoPointIndex++
            if (this._infoPointIndex >= this._infoLabelElement.length) {
                this._infoPointIndex = 0
            }
            this._infoLabelElement.map((label, i) => {
                if (this._infoPointIndex === i) {
                    label.visible = true
                } else {
                    label.visible = false
                }
            })
        }, 3000)
    }

    /** 创建轮廓 */
    private createStorke() {
        const mapStroke = this._assets?.instance.getResource("mapStroke") as string
        const texture = this._assets?.instance.getResource("pathLine3") as Texture
        if (!mapStroke || !texture) {
            throw new Error("mapStroke or pathLine3 texture not found")
        }
        texture.wrapS = texture.wrapT = RepeatWrapping
        texture.repeat.set(2, 1)
        const pathLine = new Line(this, {
            geoProjectionCenter: this._geoProjectionCenter,
            geoProjectionScale: this._geoProjectionScale,
            position: new Vector3(0, 0, this._depth + 0.24),
            data: mapStroke,
            material: new MeshBasicMaterial({
                color: 0x2bc4dc,
                map: texture,
                alphaMap: texture,
                fog: false,
                transparent: true,
                opacity: 1,
                blending: AdditiveBlending,
            }),
            type: "Line3",
            renderOrder: 22,
            tubeRadius: 0.03,
        })
        // 设置父级
        this._focusMapGroup?.add(pathLine.lineGroup)
        this.time.on("tick", () => {
            texture.offset.x += 0.005
        })
    }

    /** 创建动画时间线 */
    private createAnimationTimeline() {
        // this.time.on("tick", () => {
        //     console.log(this.camera.instance.position);
        // });
        const tl = gsap.timeline({
            onComplete: () => { },
        })
        tl.pause()
        this._animateTl = tl
        tl.addLabel("focusMap", 1.5)
        tl.addLabel("focusMapOpacity", 2)
        tl.addLabel("bar", 3)
        tl.to(this.camera.instance.position, {
            duration: 2,
            x: -0.17427287762525134,
            y: 13.678992786206543,
            z: 20.688611202093714,
            ease: "circ.out",
            onStart: () => {
                this._flyLineFocusGroup.visible = false
            },
        })
        tl.to(
            this._focusMapGroup!.position,
            {
                duration: 1,
                x: 0,
                y: 0,
                z: 0,
            },
            "focusMap"
        )

        tl.to(
            this._focusMapGroup!.scale,
            {
                duration: 1,
                x: 1,
                y: 1,
                z: 1,
                ease: "circ.out",
                onComplete: () => {
                    this._flyLineGroup!.visible = true
                    this._scatterGroup!.visible = true
                    this._infoPointGroup!.visible = true
                    this.createInfoPointLabelLoop()
                },
            },
            "focusMap"
        )

        tl.to(
            this._focusMapTopMaterial,
            {
                duration: 1,
                opacity: 1,
                ease: "circ.out",
            },
            "focusMapOpacity"
        )
        tl.to(
            this._focusMapSideMaterial,
            {
                duration: 1,
                opacity: 1,
                ease: "circ.out",
                onComplete: () => {
                    this._focusMapSideMaterial!.transparent = false
                },
            },
            "focusMapOpacity"
        )
        this._otherLabel.map((item, index) => {
            const element = item.element.querySelector(".other-label")
            tl.to(
                element,
                {
                    duration: 1,
                    delay: 0.1 * index,
                    translateY: 0,
                    opacity: 1,
                    ease: "circ.out",
                },
                "focusMapOpacity"
            )
        })
        tl.to(
            this._mapLineMaterial,
            {
                duration: 0.5,
                delay: 0.3,
                opacity: 1,
            },
            "focusMapOpacity"
        )
        tl.to(
            this._rotateBorder1!.scale,
            {
                delay: 0.3,
                duration: 1,
                x: 1,
                y: 1,
                z: 1,
                ease: "circ.out",
            },
            "focusMapOpacity"
        )
        tl.to(
            this._rotateBorder2!.scale,
            {
                duration: 1,
                delay: 0.5,
                x: 1,
                y: 1,
                z: 1,
                ease: "circ.out",
                onComplete: () => {
                    this._flyLineFocusGroup.visible = true
                    emitter.$emit("mapPlayComplete")
                },
            },
            "focusMapOpacity"
        )
        this._allBar.map((item, index) => {
            if (item.userData.name === "广州市") {
                return false
            }
            tl.to(
                item.scale,
                {
                    duration: 1,
                    delay: 0.1 * index,
                    x: 1,
                    y: 1,
                    z: 1,
                    ease: "circ.out",
                },
                "bar"
            )
        })
        this._allBarMaterial.map((item, index) => {
            tl.to(
                item,
                {
                    duration: 1,
                    delay: 0.1 * index,
                    opacity: 1,
                    ease: "circ.out",
                },
                "bar"
            )
        })

        this._allProvinceLabel.map((item, index) => {
            const element = item.element.querySelector(".provinces-label-wrap")
            const number = item.element.querySelector(".number .value") as HTMLDivElement
            const numberVal = Number(number.innerText)
            const numberAnimate = {
                score: 0,
            }
            tl.to(
                element,
                {
                    duration: 1,
                    delay: 0.2 * index,
                    translateY: 0,
                    opacity: 1,
                    ease: "circ.out",
                },
                "bar"
            )
            tl.to(
                numberAnimate,
                {
                    duration: 1,
                    delay: 0.2 * index,
                    score: numberVal,
                    onUpdate: showScore,
                },
                "bar"
            )
            function showScore() {
                number.innerText = numberAnimate.score.toFixed(0)
            }
        })
        this._allGuangquan.map((item, index) => {
            tl.to(
                item.children[0].scale,
                {
                    duration: 1,
                    delay: 0.1 * index,
                    x: 1,
                    y: 1,
                    z: 1,
                    ease: "circ.out",
                },
                "bar"
            )
            tl.to(
                item.children[1].scale,
                {
                    duration: 1,
                    delay: 0.1 * index,
                    x: 1,
                    y: 1,
                    z: 1,
                    ease: "circ.out",
                },
                "bar"
            )
        })
    }

    private geoProjection(args: [number, number]) {
        return geoMercator().center(this._geoProjectionCenter).scale(this._geoProjectionScale).translate([0, 0])(args) as [number, number]
    }

    update() {
        super.update()
        this._interactionManager?.update()
    }

    destroy() {
        super.destroy()
        this._label3d.destroy()
    }
}