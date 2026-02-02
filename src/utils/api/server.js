import { SKIP_SSG } from '@/config/constants';
import { getResponse } from './utils';
import { getApiBaseUrlServer } from './baseUrl';


function requireBaseUrl() {
    const baseUrl = getApiBaseUrlServer();

    if (!baseUrl || typeof baseUrl !== 'string') {
        throw new Error('API_BASE_URL is not configured on the server.');
    }

    return baseUrl;
}


export async function fetchHome() {
    const API_BASE_URL = requireBaseUrl();
    const response = await fetch(`${API_BASE_URL}?f=json`, {
        cache: SKIP_SSG ? 'no-store' : 'force-cache'
    });

    return await getResponse(response);
}

export async function fetchCollections() {
    const API_BASE_URL = requireBaseUrl();
    const url = `${API_BASE_URL}/collections?f=json`;

    const response = await fetch(url, {
        cache: SKIP_SSG ? 'no-store' : 'force-cache'
    });

    if (!response.ok) {
        const text = await response.text();
        console.error('[fetchCollections] Error response:', text);
        throw new Error(`Failed to fetch collections: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    if (!data.collections) {
        console.error('[fetchCollections] No collections in response:', data);
        throw new Error('Invalid response: missing collections array');
    }

    const promises = [];

    for (const collection of data.collections) {
        if (collection.itemType === 'feature') {
            promises.push(_fetchItemCount(collection.id))
        }
    }

    const itemCounts = await Promise.all(promises);

    return {
        ...data,
        collections: data.collections
            .map(collection => ({
                ...collection,
                itemCount: itemCounts
                    .find(count => count.collectionId === collection.id)?.count || 0
            }))
    };
}

export async function fetchCollection(name) {
    const result = await Promise.all([
        _fetchCollection(name),
        _fetchItemCount(name)
    ])

    return {
        ...result[0],
        itemCount: result[1].count,
        geometryType: result[1].geometryType
    }
}

export async function fetchItem(collection, id) {
    const API_BASE_URL = requireBaseUrl();
    const url = `${API_BASE_URL}/collections/${collection}/items/${id}?f=json`;

    const response = await fetch(url, {
        cache: 'no-store'
    });

    return await getResponse(response);
}

export async function fetchQueryables(collection) {
    const API_BASE_URL = requireBaseUrl();
    const url = `${API_BASE_URL}/collections/${collection}/queryables?f=json`;

    const response = await fetch(url, {
        cache: SKIP_SSG ? 'no-store' : 'force-cache'
    });

    return await getResponse(response);
}

async function _fetchCollection(name) {
    const API_BASE_URL = requireBaseUrl();
    const response = await fetch(`${API_BASE_URL}/collections/${name}?f=json`, {
        cache: SKIP_SSG ? 'no-store' : 'force-cache'
    });

    return await getResponse(response);
}

async function _fetchItemCount(collection) {
    const API_BASE_URL = requireBaseUrl();
    const response = await fetch(`${API_BASE_URL}/collections/${collection}/items?f=json&limit=1`, {
        cache: SKIP_SSG ? 'no-store' : 'force-cache'
    });

    if (!response.ok) {
        console.error(
            '[fetchItemCount] Failed to fetch item count for collection:',
            collection,
            response.status,
            response.statusText
        );
        return { collectionId: collection, count: 0 };
    }

    const data = await getResponse(response);
    return { collectionId: collection, count: data?.numberMatched ?? 0, geometryType: data?.features?.[0]?.geometry?.type || null };
}
