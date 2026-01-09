import { featureCollection, union } from "@turf/turf";
import type { GeoJSON } from "geojson";

/**
 * 获取国家地理数据
 * @param useSimpleMerge - 是否使用简化的合并方式（适用于 polygons 模式）
 * @returns GeoJSON 数据
 */
async function fetchCountriesData(useSimpleMerge = false) {
	const res = await fetch("/datasets/ne_110m_admin_0_countries.geojson");
	const data = await res.json();
	// 处理数据：将 Taiwan 合并到 China
	const features = [...data.features];
	// 找到 China 和 Taiwan 的索引
	const chinaIndex = features.findIndex((f) => f.properties.ADMIN === "China");
	const taiwanIndex = features.findIndex(
		(f_1) => f_1.properties.ADMIN === "Taiwan",
	);
	if (chinaIndex !== -1 && taiwanIndex !== -1) {
		const chinaFeature = features[chinaIndex];
		const taiwanFeature = features[taiwanIndex];

		try {
			if (useSimpleMerge) {
				// 简化合并：直接将 Taiwan 的坐标添加到 China 的 MultiPolygon 中
				// 辅助函数：将几何形状规范化为 MultiPolygon 格式
				const normalizeToMultiPolygon = (geometry_1: GeoJSON) => {
					if (geometry_1.type === "MultiPolygon") {
						return geometry_1.coordinates;
					} else if (geometry_1.type === "Polygon") {
						// Polygon 转 MultiPolygon: [coords] -> [[coords]]
						return [geometry_1.coordinates];
					}
					return [];
				};

				const chinaCoords = normalizeToMultiPolygon(chinaFeature.geometry);
				const taiwanCoords = normalizeToMultiPolygon(taiwanFeature.geometry);

				// 合并 GDP 和人口数据
				const mergedProps = {
					...chinaFeature.properties,
					GDP_MD_EST:
						chinaFeature.properties.GDP_MD_EST +
						taiwanFeature.properties.GDP_MD_EST,
					POP_EST:
						chinaFeature.properties.POP_EST + taiwanFeature.properties.POP_EST,
				};

				features[chinaIndex] = {
					type: "Feature",
					properties: mergedProps,
					geometry: {
						type: "MultiPolygon",
						coordinates: [...chinaCoords, ...taiwanCoords],
					},
				};
			} else {
				// 使用 turf.union 合并几何形状
				const merged = union(
					featureCollection([chinaFeature, taiwanFeature]),
				);

				if (merged) {
					// 合并 GDP 和人口数据
					const mergedProps_1 = {
						...chinaFeature.properties,
						GDP_MD_EST:
							chinaFeature.properties.GDP_MD_EST +
							taiwanFeature.properties.GDP_MD_EST,
						POP_EST:
							chinaFeature.properties.POP_EST +
							taiwanFeature.properties.POP_EST,
					};

					// 确保保留原始 properties 并正确设置几何类型
					features[chinaIndex] = {
						type: "Feature",
						properties: mergedProps_1,
						geometry: merged.geometry,
					};
				}
			}

			// 移除 Taiwan feature
			features.splice(taiwanIndex, 1);
		} catch (error) {
			console.warn("Error merging China and Taiwan:", error);
		}
	}
	return {
		...data,
		features,
	};
}

// 将 Promise 提取到组件外部，避免重复请求
// 03 使用 turf.union 合并版本（hexPolygons 模式兼容复杂几何）
export const countriesPromise = fetchCountriesData(false);

// 04 使用简化合并版本（polygons 模式：直接合并坐标数组，同时合并 GDP 和人口数据）
export const countriesPromiseRaw = fetchCountriesData(true);
