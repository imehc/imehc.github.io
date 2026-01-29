import { BufferAttribute, BufferGeometry, DoubleSide, GridHelper, Group, Mesh, MeshBasicMaterial, NormalBlending, Points, PointsMaterial, Scene, Shape, ShapeGeometry, Vector2, Vector3 } from "three"
import type Time from "../../utils/time"
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js"

interface GridConfig {
    scene: Scene
    time: Time
}

type GridOption = typeof defaultOption

const defaultOption = {
    position: new Vector3(0, 0, 0),
    gridSize: 100,
    gridDivision: 20,
    gridColor: 0x28373a,
    shapeSize: 1,
    shapeColor: 0x8e9b9e,
    pointSize: 0.2,
    pointColor: 0x28373a,
    pointLayout: {
        row: 200,
        col: 200,
    },
    pointBlending: NormalBlending,
}

export default class Grid {
    #scene: Scene
    #time: Time
    #option: GridOption

    #instance!: Group

    constructor(config: GridConfig, option?: Partial<GridOption>) {
        this.#scene = config.scene
        this.#time = config.time
        this.#option = Object.assign({}, defaultOption, option)
        this.init()
    }

    get instance() {
        return this.#instance;
    }

    init() {
        const group = new Group();
        group.name = "Grid";
        const grid = this.createGridHelp();
        const shapes = this.createShapes();
        const points = this.createPoint();
        group.add(grid, shapes, points);
        group.position.copy(this.#option.position);
        this.#instance = group;
        this.#scene.add(group);
    }

    createShapes() {
        let { gridSize, gridDivision, shapeSize, shapeColor } = this.#option;
        const shapeSpace = gridSize / gridDivision;
        const range = gridSize / 2;
        const shapeMaterial = new MeshBasicMaterial({
            color: shapeColor,
            side: DoubleSide,
        });
        const shapeGeometrys = [];
        for (let i = 0; i < gridDivision + 1; i++) {
            for (let j = 0; j < gridDivision + 1; j++) {
                let shapeGeometry = this.createPlus(shapeSize);
                shapeGeometry.translate(
                    -range + i * shapeSpace,
                    -range + j * shapeSpace,
                    0
                );
                shapeGeometrys.push(shapeGeometry);
            }
        }
        const geometry = mergeGeometries(shapeGeometrys);
        const shapeMesh = new Mesh(geometry, shapeMaterial);
        shapeMesh.renderOrder = -1;
        shapeMesh.rotateX(-Math.PI / 2);
        shapeMesh.position.y += 0.01;
        return shapeMesh;
    }

    createGridHelp() {
        let { gridSize, gridDivision, gridColor } = this.#option;
        const gridHelp = new GridHelper(gridSize, gridDivision, gridColor, gridColor);
        return gridHelp;
    }

    createPoint() {
        const { gridSize, pointSize, pointColor, pointBlending, pointLayout } =
            this.#option;
        const rows = pointLayout.row;
        const cols = pointLayout.col;
        const positions = new Float32Array(rows * cols * 3);
        for (let i = 0; i < rows; i++) {
            for (let j = 0; j < cols; j++) {
                const x = (i / (rows - 1)) * gridSize - gridSize / 2;
                const y = 0;
                const z = (j / (cols - 1)) * gridSize - gridSize / 2;
                const index = (i * cols + j) * 3;
                positions[index] = x;
                positions[index + 1] = y;
                positions[index + 2] = z;
            }
        }
        const geometry = new BufferGeometry();
        geometry.setAttribute("position", new BufferAttribute(positions, 3));
        const material = new PointsMaterial({
            size: pointSize,
            sizeAttenuation: true,
            color: pointColor,
            blending: pointBlending,
        });
        const particles = new Points(geometry, material);

        return particles;
    }

    setPointMode() { }

    createPlus(shapeSize = 50) {
        const w = shapeSize / 6 / 3;
        const h = shapeSize / 3;
        const points = [
            new Vector2(-h, -w),
            new Vector2(-w, -w),
            new Vector2(-w, -h),
            new Vector2(w, -h),
            new Vector2(w, -h),
            new Vector2(w, -w),
            new Vector2(h, -w),
            new Vector2(h, w),
            new Vector2(w, w),
            new Vector2(w, h),
            new Vector2(-w, h),
            new Vector2(-w, w),
            new Vector2(-h, w),
        ];
        const shape = new Shape(points);
        const shapeGeometry = new ShapeGeometry(shape, 24);
        return shapeGeometry;
    }


}