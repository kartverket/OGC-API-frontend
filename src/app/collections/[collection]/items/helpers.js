import { fetchCollection, fetchHome, fetchItems, fetchQueryables } from '@/utils/api.client';


export function buildApiUrl(collection, searchParams) {
    const baseUrl = `/collections/${collection}/items?f=json`;

    const queryStr = Object.entries(searchParams)
        .map(entry => `${entry[0]}=${entry[1]}`).join('&');

    return queryStr !== '' ?
        `${baseUrl}&${queryStr}` :
        baseUrl;
}

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
