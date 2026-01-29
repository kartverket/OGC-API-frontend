import Fill from 'ol/style/Fill';
import Icon from 'ol/style/Icon';
import Stroke from 'ol/style/Stroke';
import Style from 'ol/style/Style';
import CircleStyle from 'ol/style/Circle';


export const polygonStyle = new Style({
    stroke: new Stroke({
        color: '#389053',
        width: 2
    }),
    fill: new Fill({
        color: '#3890534f'
    })
});

export const pointStyle = new Style({
    image: new CircleStyle({
        radius: 6,
        fill: new Fill({ color: '#389053' }),
        stroke: new Stroke({ color: '#3890534f', width: 2 })
    })
});

export const lineStyle = new Style({
    stroke: new Stroke({
        color: '#389053',
        width: 3,
        lineCap: 'round',
        lineJoin: 'round'
    })
});

export const bboxStyle = new Style({
    stroke: new Stroke({
        color: '#1A589F',
        width: 2
    }),
    fill: new Fill({
        color: '#1A589F4D'
    })
});

// Style function to select style based on geometry type
export function featureStyle(feature) {
    const geom = feature.getGeometry();
    const type = geom.getType();
    if (type === 'Point' || type === 'MultiPoint') {
        return pointStyle;
    }
    if (type === 'Polygon' || type === 'MultiPolygon') {
        return polygonStyle;
    }
    if (type === 'LineString' || type === 'MultiLineString') {
        return lineStyle;
    }
    // Default to polygonStyle for unknown types
    return polygonStyle;
}
