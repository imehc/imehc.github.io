import { BufferGeometry, CatmullRomCurve3, Group, LineBasicMaterial, LineLoop, Mesh, type MeshBasicMaterial, type Object3D, TubeGeometry, Vector2, Vector3 } from "three"
import { LineGeometry } from "three/examples/jsm/lines/LineGeometry.js";
import { Line2 } from "three/examples/jsm/lines/Line2.js";
import { transfromMapGeoJSON } from "../../utils/transfrom-map-geojson"
import type { Feature, FeatureCollection, MultiPolygon } from "geojson"
import { geoMercator } from "d3-geo"
import { LineMaterial } from "three/examples/jsm/lines/LineMaterial.js";

interface LineConfig { }

type LineOption = Omit<typeof defaultOption, 'geoProjectionCenter' | 'material'> & {
    geoProjectionCenter: Vector2 | number[]
    material: LineBasicMaterial | MeshBasicMaterial
}

const defaultOption = {
    visibelProvince: "",
    geoProjectionCenter: [0, 0],
    geoProjectionScale: 120,
    position: new Vector3(0, 0, 0),
    data: "",
    material: new LineBasicMaterial({ color: 0xffffff }),
    type: "LineLoop",
    renderOrder: 1,
    tubeRadius: 0.2,
}

export default class Line {
    #option: LineOption
    #lineGroup: Group

    constructor(config: LineConfig, option: Partial<LineOption>) {
        this.#option = Object.assign({}, defaultOption, option)
        const mapData = transfromMapGeoJSON(this.#option.data);
        const lineGroup = this.create(mapData);
        this.#lineGroup = lineGroup;

        this.#lineGroup.position.copy(this.#option.position);
    }

    get lineGroup() {
        return this.#lineGroup;
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
        const { type, visibelProvince } = this.#option;
        const features = mapData.features;
        const lineGroup = new Group();
        for (let i = 0; i < features.length; i++) {
            const element = features[i] as Feature;
            const group = new Group();
            group.name = "meshLineGroup" + i;
            if (element.properties?.name === visibelProvince) {
                continue;
            }
            let line: Line | Mesh | LineLoop | null = null;
            (element.geometry as MultiPolygon).coordinates.forEach((coords) => {
                const points: Vector3[] = [];
                line = null;
                if (type === "Line2") {
                    coords[0].forEach((item) => {
                        const [x, y] = this.geoProjection(item as [number, number]);
                        points.push(new Vector3(x, -y, 0));
                    });
                    line = this.createLine2(points) as Line2;
                } else if (type === "Line3") {
                    coords[0].forEach((item) => {
                        const [x, y] = this.geoProjection(item as [number, number]);
                        points.push(new Vector3(x, -y, 0));
                    });
                    line = this.createLine3(points)
                } else {
                    coords[0].forEach((item) => {
                        const [x, y] = this.geoProjection(item as [number, number]);
                        points.push(new Vector3(x, -y, 0));
                        line = this.createLine(points)
                    });
                }
                group.add(line as Object3D);
            });
            lineGroup.add(group);
        }
        return lineGroup;
    }

    createLine(points: Vector3[]) {
        const { material, renderOrder, type } = this.#option;
        const geometry = new BufferGeometry();
        geometry.setFromPoints(points);
        const line = new LineLoop(geometry, material);
        line.renderOrder = renderOrder;
        line.name = "mapLine";
        return line;
    }

    createLine2(points: Vector3[]) {
        const { material, renderOrder } = this.#option;
        if (material instanceof LineBasicMaterial) {
            const geometry = new LineGeometry();
            const positions = points.flatMap(p => [p.x, p.y, p.z]);
            geometry.setPositions(positions);
            const lineMaterial = new LineMaterial({
                color: material.color.getHex(),
                linewidth: material.linewidth || 1
            });
            const line = new Line2(geometry, lineMaterial);
            line.name = "mapLine2";
            line.renderOrder = renderOrder;
            line.computeLineDistances();
            return line;
        }
    }

    createLine3(points: Vector3[]) {
        const tubeRadius = this.#option.tubeRadius;
        const tubeSegments = 256 * 10;
        const tubeRadialSegments = 4;
        const closed = false;

        const { material, renderOrder } = this.#option;

        const curve = new CatmullRomCurve3(points);
        const tubeGeometry = new TubeGeometry(
            curve,
            tubeSegments,
            tubeRadius,
            tubeRadialSegments,
            closed
        );
        const line = new Mesh(tubeGeometry, material);
        line.name = "mapLine3";
        line.renderOrder = renderOrder;
        return line;
    }

    setParent(parent: Object3D) {
        parent.add(this.lineGroup);
    }
}