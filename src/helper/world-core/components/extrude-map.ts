import { ExtrudeGeometry, Group, type Material, Mesh, MeshBasicMaterial, Object3D, Shape, Vector2, Vector3 } from "three";
import type Assets from "../../assets";
import type Time from "../../utils/time";
import { Coordinate } from "./base-map";
import { transfromMapGeoJSON } from "../../utils/transfrom-map-geojson";
import type { FeatureCollection, MultiPolygon } from "geojson";
import { geoMercator } from "d3-geo";

interface ExtrudeMapConfig {
    assets: Assets;
    time: Time;
}

type ExtrudeMapOption = Omit<typeof defaultOption, 'geoProjectionCenter' | 'topFaceMaterial' | 'sideMaterial'> & {
    geoProjectionCenter: Vector2 | number[]
    topFaceMaterial: Material
    sideMaterial: Material
}

const defaultOption = {
    position: new Vector3(0, 0, 0),
    geoProjectionCenter: new Vector2(0, 0),
    geoProjectionScale: 120,
    data: "",
    renderOrder: 1,
    topFaceMaterial: new MeshBasicMaterial({
        color: 0x18263b,
        transparent: true,
        opacity: 1,
    }),
    sideMaterial: new MeshBasicMaterial({
        color: 0x07152b,
        transparent: true,
        opacity: 1,
    }),
    depth: 0.1,
};

export default class ExtrudeMap {
    #assets: Assets;
    #time: Time;
    #option: ExtrudeMapOption;
    #mapGroup: Group;
    #coordinates: Coordinate[]

    constructor(config: ExtrudeMapConfig, option: Partial<ExtrudeMapOption>) {
        this.#mapGroup = new Group()
        this.#assets = config.assets;
        this.#time = config.time;
        this.#coordinates = []
        this.#option = Object.assign({}, defaultOption, option);
        this.#mapGroup.position.copy(this.#option.position)

        const mapData = transfromMapGeoJSON(this.#option.data)
        this.create(mapData)
    }

    get coordinates() {
        return this.#coordinates
    }

    geoProjection(args: [number, number]) {
        let center: number[] = []
        if (this.#option.geoProjectionCenter instanceof Vector2) {
            const x = this.#option.geoProjectionCenter.x
            const y = this.#option.geoProjectionCenter.y
            center = [x, y]
        } else {
            center = this.#option.geoProjectionCenter
        }
        return (geoMercator()
            .center(center as [number, number])
            .scale(this.#option.geoProjectionScale)
            .translate([0, 0])(args)) as [number, number]
    }

    create(mapData: FeatureCollection) {
        mapData.features.forEach((feature) => {
            const group = new Object3D()
            const { name, center = [], centroid = [] } = feature.properties as Coordinate
            this.coordinates.push({ name, center, centroid })
            const extrudeSettings = {
                depth: this.#option.depth,
                bevelEnabled: true,
                bevelSegments: 1,
                bevelThickness: 0.1,
            }
            const materials = [this.#option.topFaceMaterial, this.#option.sideMaterial];
            (feature.geometry as MultiPolygon).coordinates.forEach((multiPolygon) => {
                multiPolygon.forEach((polygon, index) => {
                    const shape = new Shape()
                    for (let i = 0; i < polygon.length; i++) {
                        if (!polygon[i][0] || !polygon[i][1]) {
                            return false
                        }
                        const [x, y] = this.geoProjection(polygon[i] as [number, number])
                        if (i === 0) {
                            shape.moveTo(x, -y)
                        }
                        shape.lineTo(x, -y)
                    }

                    const geometry = new ExtrudeGeometry(shape, extrudeSettings)
                    const mesh = new Mesh(geometry, materials)

                    group.add(mesh)
                })
            })
            this.#mapGroup.add(group)
        })
    }

    setParent(parent: Object3D) {
        parent.add(this.#mapGroup)
    }
}