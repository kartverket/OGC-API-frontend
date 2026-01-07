import { Vector as VectorSource } from 'ol/source';
import { Vector as VectorLayer } from 'ol/layer';
import GeoJSON from 'ol/format/GeoJSON';
import { bboxStyle, polygonStyle } from './styles';
import { getLayer, getProjection } from './helpers';
import { fromExtent } from 'ol/geom/Polygon';
import { Feature } from 'ol';
import { transformExtent } from 'ol/proj';


export function createFeaturesLayer(featureCollection) {
    const vectorLayer = createEmptyFeaturesLayer();

    setFeatures(vectorLayer, featureCollection);

    return vectorLayer;
}

export function createEmptyFeaturesLayer() {
    const vectorSource = new VectorSource();

    const vectorLayer = new VectorLayer({
        source: vectorSource,
        declutter: true
    });

    vectorLayer.set('id', 'features');
    vectorLayer.setStyle(polygonStyle);

    return vectorLayer;
}

export function createBboxFeatureLayer() {
    const vectorSource = new VectorSource();

    const vectorLayer = new VectorLayer({
        source: vectorSource
    });

    vectorLayer.set('id', 'bbox');
    vectorLayer.setStyle(null);

    return vectorLayer;
}

export function setFeatures(vectorLayer, featureCollection) {
    const vectorSource = vectorLayer.getSource();
    vectorSource.clear();

    if (featureCollection.features.length === 0) {
        return;
    }

    const dataProjection = getProjection(featureCollection);
    const reader = new GeoJSON();

    const features = reader.readFeatures(featureCollection, {
        dataProjection,
        featureProjection: 'EPSG:3857'
    });

    vectorSource.addFeatures(features);
}

export function setBboxFeature(map, bbox) {
    const vectorLayer = getLayer(map, 'bbox');
    const vectorSource = vectorLayer.getSource();

    if (bbox === null) {
        vectorSource.clear();
        return;
    }

    const transformed = transformExtent(bbox, 'EPSG:4326', 'EPSG:3857');
    const feature = createBboxFeature(transformed);

    vectorSource.clear();
    vectorSource.addFeature(feature);
}

export function toggleBboxFeature(map, show) {
    const vectorLayer = getLayer(map, 'bbox');
    const vectorSource = vectorLayer.getSource();
    const features = vectorSource.getFeatures();

    for (const feature of features) {
        feature.setStyle(show ? feature.get('_style') : null);
    }
}

function createBboxFeature(extent) {
    const polygon = fromExtent(extent);
    const feature = new Feature(polygon);

    feature.setStyle(bboxStyle);
    feature.set('_style', bboxStyle);    

    return feature;
}