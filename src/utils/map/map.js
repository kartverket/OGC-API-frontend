import { Map, View } from 'ol';
import { createEmptyFeaturesLayer, createFeaturesLayer, setFeatures } from './featuresLayer';
import { createBaseMap } from './baseMap';
import { getLayer, getProjection } from './helpers';
import basemap from '@/config/basemap';
import './setup';

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

export function zoomToExtent(map) {
    const mapSize = map.getSize();

    if (mapSize === undefined) {
        return;
    }

    const vectorLayer = getLayer(map, 'features');
    const vectorSource = vectorLayer.getSource();
    const view = map.getView();
    const extent = vectorSource.getExtent();

    view.fit(extent, mapSize);
}