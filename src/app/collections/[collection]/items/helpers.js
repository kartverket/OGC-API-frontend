import { fetchCollection, fetchHome, fetchQueryables } from '@/utils/api/server';
import { getStatus } from '@/utils/api/utils';


export async function fetchData(collection) {
    const promises = [
        fetchQueryables(collection),
        fetchCollection(collection),
        fetchHome()
    ];

    let result;

    try {
        result = await Promise.all(promises);
    } catch (error) {
        return getStatus(error);
    }

    return {
        data: {
            queryables: result[0],
            collection: {
                title: result[1].title,
                extent: {
                    bbox: result[1].extent.spatial.bbox[0],
                    crs: result[1].extent.spatial.crs
                }
            },
            dataset: {
                title: result[2].title
            }
        },
        status: 200
    };
}
