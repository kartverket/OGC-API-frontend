import { Vector as VectorSource } from 'ol/source';
import { Vector as VectorLayer } from 'ol/layer';
import GeoJSON from 'ol/format/GeoJSON';
import { polygonStyle } from './styles';
import { getProjection } from './helpers';


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
