import { type JSX, type LazyExoticComponent, lazy } from "react";

type Option = {
	component: LazyExoticComponent<() => JSX.Element>;
	/** 组件名称 */
	name: string;
	/** 独立场景 */
	detachment: boolean;
};

export type GlobeCompKey = keyof typeof allComp;
export type GlobeComp = Record<string, Option>;

export const allComp = {
	"01": {
		component: lazy(() => import("./examples/01/index")),
		name: "地球点数据",
		detachment: false,
	},
	"02": {
		component: lazy(() => import("./examples/02/index")),
		name: "弧型链接",
		detachment: false,
	},
	"03": {
		component: lazy(() => import("./examples/03/index")),
		name: "六边形",
		detachment: true,
	},
	"04": {
		component: lazy(() => import("./examples/04/index")),
		name: "等值线图",
		detachment: true,
	},
	"05": {
		component: lazy(() => import("./examples/05/index")),
		name: "昼夜轮回",
		detachment: true,
	},
	"06": {
		component: lazy(() => import("./examples/06/index")),
		name: "热力图",
		detachment: true,
	},
	"07": {
		component: lazy(() => import("./examples/07/index")),
		name: "云",
		detachment: true,
	},
	"08": {
		component: lazy(() => import("./examples/08/index")),
		name: "瓦片地图",
		detachment: true,
	},
	"09": {
		component: lazy(() => import("./examples/09/index")),
		name: "世界人口",
		detachment: true,
	},
	"010": {
		component: lazy(() => import("./examples/10/index")),
		name: "近期地震",
		detachment: true,
	},
	"011": {
		component: lazy(() => import("./examples/11/index")),
		name: "美国出境国际航线 ",
		detachment: true,
	},
	"012": {
		component: lazy(() => import("./examples/12/index")),
		name: "地球之盾",
		detachment: true,
	},
	"013": {
		component: lazy(() => import("./examples/13/index")),
		name: "海底光缆",
		detachment: true,
	},
	"014": {
		component: lazy(() => import("./examples/14/index")),
		name: "登月地点",
		detachment: true,
	},
} satisfies GlobeComp;

/** 获取健值对
 * @param type - 如果传递 'basic' 则返回 detachment 为 false 的组件映射，如果传递 'detachment' 则返回 detachment 为 true 的组件映射，如果不传参数则返回全部组件映射
 * @example
 * ``` ts
 * const param = transformGuiParam();
 * console.log(basicComp);
 *
 * {
 *  "六边形": "03",
 *  "等值线图": "04"
 * }
 */
export function transformGuiParam(type?: "basic" | "detachment") {
	let comp = {} as GlobeComp;
	if (type === "basic") {
		// 获取 detachment 为 false 的组件
		for (const [key, value] of Object.entries(allComp)) {
			if (!value.detachment) {
				comp[key] = value;
			}
		}
	} else if (type === "detachment") {
		// 获取 detachment 为 true 的组件
		for (const [key, value] of Object.entries(allComp)) {
			if (value.detachment) {
				comp[key] = value;
			}
		}
	} else {
		comp = { ...allComp };
	}
	const result: Record<string, string> = {};

	for (const [key, value] of Object.entries(comp)) {
		result[value.name] = key;
	}

	return result;
}

/** 当前组件 */
export function currentComponent(name: string) {
	return allComp?.[name]?.component || null;
}
