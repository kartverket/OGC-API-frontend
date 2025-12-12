import { API_BASE_URL, SKIP_SSG } from '@/config/constants';
// import { METADATA_ID } from '@/config/constants.client';

export const fetcher = (...args) => fetch(...args).then(response => response.json());

export async function fetchHome() {
    const response = await fetch(`${API_BASE_URL}?f=json`, {
        cache: SKIP_SSG ? 'no-store' : 'force-cache'
    });

    return await response.json();
}

export async function fetchCollections() {
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

    const itemCounts = await Promise.all(promises)

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
        itemCount: result[1].count
    }
}

export async function fetchItems(collection, searchParams) {
    let url = `${API_BASE_URL}/collections/${collection}/items?f=json`;
    
    const queryStr = Object.entries(searchParams)
        .map(entry => `&${entry[0]}=${entry[1]}`)
        .join('');

    url += queryStr;

    const response = await fetch(url, {
        cache: 'no-store'
    });

    return await response.json();
}

export async function fetchItem(collection, id) {
    const url = `${API_BASE_URL}/collections/${collection}/items/${id}`;

    const response = await fetch(url, {
        cache: SKIP_SSG ? 'no-store' : 'force-cache'
    });

    return await response.json();
}

// export async function fetchThumbnail() {
//     const baseUrl = 'https://kartkatalog.geonorge.no/api/getdata';
//     const url = `${baseUrl}/${METADATA_ID}`;

//     const response = await fetch(url, {
//         cache: SKIP_SSG ? 'no-store' : 'force-cache'
//     });

//     const data = await response.json();
//     const thumbnails = data.Thumbnails || [];
//     const thumbnail = thumbnails.find(thumbnail => thumbnail.Type === 'original');

//     return thumbnail?.URL || null;
// }

async function _fetchCollection(name) {
    const response = await fetch(`${API_BASE_URL}/collections/${name}?f=json`, {
        cache: SKIP_SSG ? 'no-store' : 'force-cache'
    });

    return await response.json();
}

async function _fetchItemCount(collection) {
    const response = await fetch(`${API_BASE_URL}/collections/${collection}/items?f=json&resulttype=hits`, {
        cache: SKIP_SSG ? 'no-store' : 'force-cache'
    });

    const data = await response.json();

    return {
        collectionId: collection,
        count: data.numberMatched
    };
}