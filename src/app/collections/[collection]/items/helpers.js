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
    const [items, queryables, collectionData, homeData] = await Promise.all([
        fetchItems(apiUrl),
        fetchQueryables(collection),
        fetchCollection(collection),
        fetchHome(),
    ]);

    return {
        ...items,
        queryables,
        collection: {
            title: collectionData.title,
            extent: {
                bbox: collectionData.extent.spatial.bbox[0],
                crs: collectionData.extent.spatial.crs
            }
        },
        datasetTitle: homeData.title,
    };
}
