import { Vector as VectorSource } from 'ol/source';
import { Vector as VectorLayer } from 'ol/layer';
import GeoJSON from 'ol/format/GeoJSON';
import { polygonStyle } from './styles';


export function createFeaturesLayer(featureCollection, dataProjection) {
    const vectorSource = new VectorSource();

    const vectorLayer = new VectorLayer({
        source: vectorSource,
        declutter: true
    });

    vectorLayer.set('id', 'features');
    vectorLayer.setStyle(polygonStyle);

    const reader = new GeoJSON();

    const features = reader.readFeatures(featureCollection, {
        dataProjection,
        featureProjection: 'EPSG:3857'
    });

    vectorSource.addFeatures(features);

    return vectorLayer;
}
