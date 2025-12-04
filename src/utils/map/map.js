import { Map, View } from 'ol';
import { createEmptyFeaturesLayer, createFeaturesLayer, setFeatures } from './featuresLayer';
import { createBaseMap } from './baseMap';
import { getLayer, getProjection } from './helpers';
import basemap from '@/config/basemap';
import './setup';
import proj4 from 'proj4';

const MAP_PADDING = [50, 50, 50, 50];

export async function createMap() {
    const map = new Map({
        layers: [
            await createBaseMap(),
            createEmptyFeaturesLayer()
        ]
    });

    map.setView(new View({
        padding: MAP_PADDING,
        projection: basemap.projection,
        maxZoom: basemap.maxZoom
    }));

    return map;
}

export function setFeatureCollection(map, featureCollection) {
    const vectorLayer = getLayer(map, 'features');

    setFeatures(vectorLayer, featureCollection);
}

export function zoomToExtent(map, defaultExtent) {
    const mapSize = map.getSize();

    if (mapSize === undefined) {
        return;
    }

    const view = map.getView();
    const extent = getExtent(map, defaultExtent)

    view.fit(extent, mapSize);
}

export function getExtent(map, defaultExtent) {   
    const vectorLayer = getLayer(map, 'features');
    const vectorSource = vectorLayer.getSource();

    if (vectorSource.getFeatures().length > 0) {
        return vectorSource.getExtent();
    }

    const { bbox, crs } = defaultExtent;

    return getExtentFromBBox(bbox, crs);
}

export function getExtentFromBBox(bbox, crs) {
    const [minX, maxX] = proj4(crs, 'EPSG:3857', [bbox[0], bbox[1]]);
    const [minY, maxY] = proj4(crs, 'EPSG:3857', [bbox[2], bbox[3]]);

    return [minX, maxX, minY, maxY];
}
