import { Map, View } from 'ol';
import { createFeaturesLayer } from './featuresLayer';
import { createBaseMap } from './baseMap';
import './setup';

const MAP_PADDING = [50, 50, 50, 50];


export default async function createMap(featureCollection) {
    const featuresLayer = createFeaturesLayer(featureCollection, 'EPSG:4326');

    const map = new Map({
        layers: [
            await createBaseMap(),
            featuresLayer
        ]
    });

    map.setView(new View({
        padding: MAP_PADDING,
        projection: 'EPSG:3857',
        maxZoom: 18
    }));

    return map;
}
