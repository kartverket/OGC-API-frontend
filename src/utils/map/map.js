import { Map, View } from 'ol';
import { createFeaturesLayer } from './featuresLayer';
import { createBaseMap } from './baseMap';
import { getProjection } from './helpers';
import basemap from '@/config/basemap';
import './setup';

const MAP_PADDING = [50, 50, 50, 50];

export default async function createMap(featureCollection) {
    const dataProjection = getProjection(featureCollection);
    const featuresLayer = createFeaturesLayer(featureCollection, dataProjection);

    const map = new Map({
        layers: [
            await createBaseMap(),
            featuresLayer
        ]
    });

    map.setView(new View({
        padding: MAP_PADDING,
        projection: basemap.projection,
        maxZoom: basemap.maxZoom
    }));

    return map;
}
