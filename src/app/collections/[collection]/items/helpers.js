import { fetchCollection, fetchHome, fetchQueryables } from '@/utils/api/server';
import { createErrorResponse } from '@/utils/api/utils';


export async function fetchData(collection) {
    const promises = [
        fetchQueryables(collection),
        fetchCollection(collection),
        fetchHome()
    ];

    
    let queryables, collectionData, homeData;
    try {[queryables, collectionData, homeData] = await Promise.all(promises);
    } catch (error) {
        return createErrorResponse(error);
    }
    return {
        data: {
            queryables: queryables,
            collection: {
                title: collectionData.title,
                extent: {
                    bbox: collectionData.extent.spatial.bbox[0],
                    crs: collectionData.extent.spatial.crs
                }
            },
            dataset: {
                title: homeData.title
            }
        },
        status: 200
    };
}

export async function createMetadata(params) {
    const { collection } = await params;

    const promises = [
        fetchCollection(collection),
        fetchHome()
    ];

    try {
        const result = await Promise.all(promises);

        return {
            title: `Items | ${result[0].title} | Collections | ${result[1].title}  | OGC API | Kartverket`
        };
    } catch {
        return null;
    }
}