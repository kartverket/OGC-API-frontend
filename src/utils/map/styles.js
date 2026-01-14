import Fill from 'ol/style/Fill';
import Icon from 'ol/style/Icon';
import Stroke from 'ol/style/Stroke';
import Style from 'ol/style/Style';


export const polygonStyle = new Style({
    stroke: new Stroke({
        color: '#389053',
        width: 2
    }),
    fill: new Fill({
        color: '#3890534f'
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
