import { Group, type Material, Mesh, MeshBasicMaterial, Object3D, Shape, ShapeGeometry, Vector2, Vector3 } from "three"
import type { FeatureCollection, MultiPolygon, Position } from "geojson"
import { geoMercator } from 'd3-geo'
import { transfromMapGeoJSON } from "../../utils/transfrom-map-geojson"
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js"

interface BaseMapConfig { }

type BaseMapOption = Omit<typeof defaultOption, 'geoProjectionCenter' | 'material'> & {
    geoProjectionCenter: Vector2 | number[]
    material: Material
}

const defaultOption = {
    position: new Vector3(0, 0, 0),
    geoProjectionCenter: new Vector2(0, 0),
    geoProjectionScale: 120,
    data: "",
    renderOrder: 1,
    merge: false,
    material: new MeshBasicMaterial({
        color: 0x18263b,
        transparent: true,
        opacity: 1,
    }),
}

export type Coordinate = {
    name: string
    center: Position
    centroid: Position
}

export default class BaseMap {
    #mapGroup: Group
    #coordinates: Coordinate[] = []
    #option: BaseMapOption
    constructor(config: BaseMapConfig, option: Partial<BaseMapOption>) {
        this.#mapGroup = new Group()
        this.#coordinates = []
        this.#option = Object.assign({}, defaultOption, option)
        this.#mapGroup.position.copy(this.#option.position)
        const mapData = transfromMapGeoJSON(this.#option.data)
        this.create(mapData)
    }

    get mapGroup() {
        return this.#mapGroup
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
        const { merge } = this.#option
        const shapes: ShapeGeometry[] = []
        mapData.features.forEach(feature => {
            const group = new Object3D()
            const { name, center = [], centroid = [] } = feature.properties as Coordinate
            this.coordinates.push({ name, center, centroid })
            group.userData.name = name as string
            (feature.geometry as MultiPolygon).coordinates.forEach(multiPolygon => {
                multiPolygon.forEach((polygon) => {
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
                    const geometry = new ShapeGeometry(shape)
                    if (merge) {
                        shapes.push(geometry)
                    } else {
                        const mesh = new Mesh(geometry, this.#option.material)
                        mesh.renderOrder = this.#option.renderOrder
                        mesh.userData.name = name
                        group.add(mesh)
                    }
                })
            })
            if (!merge) {
                this.#mapGroup.add(group)
            }
        })
        if (merge) {
            const geometry = mergeGeometries(shapes)
            const mesh = new Mesh(geometry, this.#option.material)
            mesh.renderOrder = this.#option.renderOrder
            this.#mapGroup.add(mesh)
        }
    }

    setParent(parent: Object3D) {
        parent.add(this.#mapGroup)
    }
}