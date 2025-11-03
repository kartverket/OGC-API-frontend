import Fill from 'ol/style/Fill';
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