import { FileLoader } from "three"
import Resource, { type ResourceAssets } from "./utils/resource"

import pathLine from "/texture/pathLine4.png"
import pathLine3 from "/texture/pathLine2.png"
import pathLine2 from "/texture/pathLine.png"

import side from "/texture/side.png"
import ocean from "/texture/ocean-bg.png"
import rotationBorder1 from "/texture/rotationBorder1.png"
import rotationBorder2 from "/texture/rotationBorder2.png"
import chinaBlurLine from "/texture/chinaBlurLine.png"
import guangquan1 from "/texture/guangquan01.png"
import guangquan2 from "/texture/guangquan02.png"
import huiguang from "/texture/huiguang.png"
import arrow from "/texture/arrow.png"
import point from "/texture/point1.png"
import flyLineFocus from "/texture/guangquan01.png"
import mapFlyline from "/texture/flyline6.png"
// 焦点贴图
import focusArrowsTexture from "/texture/focus/focus_arrows.png"
import focusBarTexture from "/texture/focus/focus_bar.png"
import focusBgTexture from "/texture/focus/focus_bg.png"
import focusMidQuanTexture from "/texture/focus/focus_mid_quan.png"
import focusMoveBgTexture from "/texture/focus/focus_move_bg.png"

export default class Assets {
    private _instance: Resource
    constructor() {
        this._instance = new Resource()
        this.init()
    }

    get instance() {
        return this._instance
    }

    public init() {
        this._instance.addLoader(FileLoader, "FileLoader")
        // 资源加载
        const assets: ResourceAssets[] = [
            { type: "File", name: "china", path: '/geojson/中华人民共和国.json' },
            // { type: "File", name: "chinaStokeEarth", path: '/geojson/中华人民共和国-轮廓-地球.json' },
            // { type: "File", name: "chinaStokeAll", path: '/geojson/中华人民共和国-轮廓-all.json' },
            // { type: "File", name: "chinaStoke", path: '/geojson/中华人民共和国-轮廓.json' },
            // { type: "File", name: "world", path: '/geojson/world.json' },
            // { type: "File", name: "coastline", path: '/geojson/海岸线.json' },
            // { type: "File", name: "landline1", path: '/geojson/陆地线1.json' },
            // { type: "File", name: "landline2", path: '/geojson/陆地线2.json' },

            { type: "File", name: "mapJson", path: '/geojson/广东省.json' },
            { type: "File", name: "mapStroke", path: '/geojson/广东省-轮廓.json' },

            { type: "Texture", name: "flyline", path: pathLine },
            { type: "Texture", name: "pathLine", path: pathLine },
            { type: "Texture", name: "pathLine2", path: pathLine2 },
            { type: "Texture", name: "pathLine3", path: pathLine3 },
            
            { type: "Texture", name: "huiguang", path: huiguang },
            { type: "Texture", name: "rotationBorder1", path: rotationBorder1 },
            { type: "Texture", name: "rotationBorder2", path: rotationBorder2 },
            { type: "Texture", name: "guangquan1", path: guangquan1 },
            { type: "Texture", name: "guangquan2", path: guangquan2 },
            { type: "Texture", name: "chinaBlurLine", path: chinaBlurLine },
            { type: "Texture", name: "ocean", path: ocean },
            { type: "Texture", name: "side", path: side },
            { type: "Texture", name: "flyLineFocus", path: flyLineFocus },
            { type: "Texture", name: "mapFlyline", path: mapFlyline },
            { type: "Texture", name: "arrow", path: arrow },
            { type: "Texture", name: "point", path: point },

            // focus
            { type: "Texture", name: "focusArrows", path: focusArrowsTexture },
            { type: "Texture", name: "focusBar", path: focusBarTexture },
            { type: "Texture", name: "focusBg", path: focusBgTexture },
            { type: "Texture", name: "focusMidQuan", path: focusMidQuanTexture },
            { type: "Texture", name: "focusMoveBg", path: focusMoveBgTexture },
        ]
        this._instance.loadAll(assets)
    }
}