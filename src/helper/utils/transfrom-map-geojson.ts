import type { FeatureCollection } from 'geojson'

export const transfromMapGeoJSON = (data: string) => {
    const worldData = JSON.parse(data)
    const features = worldData.features
    for (let i = 0; i < features.length; i++) {
        const element = features[i]
        if (["Polygon"].includes(element.geometry.type)) {
            element.geometry.coordinates = [element.geometry.coordinates]
        }
    }
    return worldData as FeatureCollection
}