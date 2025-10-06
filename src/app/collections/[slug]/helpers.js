import { bboxPolygon } from '@turf/bbox-polygon';
import { featureCollection } from '@turf/helpers';


export function bboxToFeatureCollection(bbox) {
    return featureCollection([bboxPolygon(bbox)]);
}