import { type FileLoader, Loader, LoadingManager, type Texture, TextureLoader } from "three";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js"
import { type GLTF, GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import EventEmitter from "./event-emitter";

const ResourceType = {
    GLTFLoader: "GLTF",
    TextureLoader: "Texture",
    FontLoader: "Font",
    MMDLoader: "MMD",
    MTLLoader: "MTL",
    OBJLoader: "OBJ",
    PCDLoader: "PCD",
    FileLoader: "File",
    ImageLoader: "Image",
    ObjectLoader: "Object",
    MaterialLoader: "Material",
    CubeTextureLoader: "CubeTexture",
    RGBELoader: "RGBELoader",
    FBXLoader: "FBX",
} as const

type ResourceTypeKey = keyof typeof ResourceType
type ResourceTypeSort = typeof ResourceType[ResourceTypeKey]
type LoadItemOption = {
    name: string
    type: ResourceTypeSort
    path: string
}
export type ResourceAssets = LoadItemOption & {
    data?: GLTF | Texture | ArrayBuffer | string | null
}

const types = Object.values(ResourceType)

interface ResourceOptions {
    dracoPath?: string
}

type DefaultLoader = typeof GLTFLoader | typeof TextureLoader | typeof FileLoader
type LoaderImpl = GLTFLoader | TextureLoader | FileLoader

export default class Resource extends EventEmitter {
    private _dracoPath: string
    private _itemsLoaded: number
    private _itemsTotal: number
    private _assets: ResourceAssets[]
    private _loaders: Record<ResourceTypeSort, LoaderImpl>
    private _manager: LoadingManager

    constructor({ dracoPath }: ResourceOptions = {}) {
        super()
        this._dracoPath = dracoPath || "/draco/gltf/"
        this._itemsLoaded = 0
        this._itemsTotal = 0
        this._assets = []
        this._loaders = {} as Record<ResourceTypeSort, LoaderImpl>
        this._manager = new LoadingManager()
        this.initDefaultLoader()
    }

    public initManager() {
        const manager = new LoadingManager()
        manager.onProgress = (url, itemsLoaded, itemsTotal) => {
            this._itemsLoaded = itemsLoaded
            this._itemsTotal = itemsTotal
            this.emit("onProgress", url, itemsLoaded, itemsTotal)
        }
        manager.onError = (err) => {
            this.emit("onError", err)
        }
        return manager
    }

    private initDefaultLoader() {
        const loaders = [
            { loader: GLTFLoader, name: "GLTFLoader" },
            { loader: TextureLoader, name: "TextureLoader" },
        ] as const
        loaders.map((item) => this.addLoader(item.loader, item.name))
    }

    addLoader(loader?: DefaultLoader, loaderName?: ResourceTypeKey) {
        if (!loader || !loaderName || !ResourceType[loaderName]) throw new Error("请配置正确的加载器")
        let hasLoader = this._loaders[ResourceType[loaderName]]
        if (!hasLoader) {
            let instance = new loader(this._manager)
            let name = loaderName
            if (instance instanceof Loader) {
                if (name === "GLTFLoader") {
                    this.initDraco(instance as GLTFLoader)
                }
                this._loaders[ResourceType[name]] = instance
            }
        }
    }

    private initDraco(loader: GLTFLoader) {
        const dracoLoader = new DRACOLoader()
        dracoLoader.setDecoderPath(this._dracoPath)
        dracoLoader.preload()
        loader.setDRACOLoader(dracoLoader)
    }

    loadItem(item: LoadItemOption): Promise<ResourceAssets> {
        return new Promise((resolve, reject) => {
            if (!this._loaders?.[item.type]) {
                throw new Error(`资源${item.path}没有配置加载器`)
            }
            this._loaders?.[item.type].load(
                item.path,
                (data) => {
                    this._itemsLoaded++
                    this.emit("onProgress", item.path, this._itemsLoaded, this._itemsTotal)
                    resolve({ ...item, data })
                },
                () => { },
                (err) => {
                    this.emit("onError", err)
                    reject(err)
                }
            )
        })
    }

    loadAll(assets: ResourceAssets[]) {
        this._itemsLoaded = 0
        this._itemsTotal = 0
        return new Promise((resolve, reject) => {
            let currentAssets = this.matchType(assets)
            let promise: Promise<ResourceAssets>[] = []
            this._itemsTotal = currentAssets.length
            currentAssets.map((item) => {
                let currentItem = this.loadItem(item)
                promise.push(currentItem)
            })
            Promise.all(promise)
                .then((res) => {
                    this._assets = res
                    this.emit("onLoad")
                    resolve(res)
                })
                .catch((err) => {
                    this.emit("onError", err)
                    reject(err)
                })
        })
    }

    private matchType(assets: ResourceAssets[]) {
        this._assets = assets
            .map((item) => {
                let type = types.includes(item.type) ? item.type : ""
                return {
                    type: type as ResourceTypeSort,
                    path: item.path,
                    name: item.name,
                    data: null,
                }
            })
            .filter((item) => {
                if (!item.type) {
                    throw new Error(`资源${item.path},type不正确`)
                }
                return item.type
            })
        return this._assets
    }

    getResource(name: string) {
        let current = this._assets.find((item) => {
            return item.name === name
        })
        if (!current) {
            throw new Error(`资源${name}不存在`)
        }
        return current.data
    }

    destroy() {
        this.off("onProgress")
        this.off("onLoad")
        this.off("onError")
        this._assets = []
    }
}