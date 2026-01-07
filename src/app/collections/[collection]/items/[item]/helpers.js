import { bboxPolygon } from '@turf/bbox-polygon';
import { featureCollection } from '@turf/helpers';


export async function fetcher({ apiUrl, collection }) {
    const promises = [
        fetchItems(apiUrl),
        fetchQueryables(collection),
        fetchCollection(collection),
        fetchHome(),
    ];

    const result = await Promise.all(promises);

    return {
        ...result[0],
        queryables: result[1],
        collection: {
            title: result[2].title,
            extent: {
                bbox: result[2].extent.spatial.bbox[0],
                crs: result[2].extent.spatial.crs
            }
        },
        datasetTitle: result[3].title,
    };
}

export function bboxToFeatureCollection(bbox) {
    return featureCollection([bboxPolygon(bbox)]);
}