import gsap from "gsap"
import emitter from "../utils/emitter"
import Assets from "./assets"
import World from "./world"

export interface Map3DOptions {
  el: HTMLCanvasElement
}

export interface Map3DState {
  /** 进度 */
  progress: number
}

export default class Map3D {
  private readonly _el: HTMLCanvasElement
  /** 资源 */
  private _assets?: Assets
  /** 状态 */
  private _state: Map3DState
  private _world?: World

  constructor(options: Map3DOptions) {
    this._el = options.el
    this._state = {
      progress: 0,
    }
  }

  get assets() {
    return this._assets
  }

  get state() {
    return this._state
  }

  /** 初始化加载资源 */
  initAssets(onLoadCallback?: () => void) {
    emitter.$on("loadMap", () => this.loadMap())
    emitter.$on("mapPlayComplete", () => this.handleMapPlayComplete())
    let params = {
      progress: 0,
    }
    this._assets = new Assets()
    this._assets.instance.on("onProgress", (_path, itemsLoaded, itemsTotal) => {
      let p = Math.floor((itemsLoaded / itemsTotal) * 100)
      gsap.to(params, {
        progress: p,
        onUpdate: () => {
          this._state.progress = Math.floor(params.progress)
        },
      })
    })
    // 资源加载完成
    this._assets.instance.on("onLoad", () => {
      // 加载地图
      emitter.$emit("loadMap", this._assets)
      onLoadCallback?.()
    })
  }

  /** 销毁 */
  destroy() {
    emitter.$off("loadMap", () => this.loadMap())
    emitter.$off("mapPlayComplete", () => this.handleMapPlayComplete())
  }

  /** 地图开始动画播放完成 */
  handleMapPlayComplete() {
    console.log("handleMapPlayComplete")
  }

  loadMap() {
    this._world = new World(this._el, this._assets)
    this._world?.time.pause()
  }

  /** 播放场景 */
  play() {
    this._world?.time.resume()
    this._world?.animateTl.timeScale(1)
    this._world?.animateTl.play()
  }
}