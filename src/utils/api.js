import { API_BASE_URL, SKIP_SSG } from '@/config/constants';
import { METADATA_ID } from '@/config/constants.client';

export const fetcher = (...args) => fetch(...args).then(response => response.json());

export async function fetchHome() {
    const response = await fetch(`${API_BASE_URL}/?f=json`, {
        cache: SKIP_SSG ? 'no-store' : 'force-cache'
    });

    return await response.json();
}

export async function fetchCollections() {
    const response = await fetch(`${API_BASE_URL}/collections/?f=json`, {
        cache: SKIP_SSG ? 'no-store' : 'force-cache'
    });

    const data = await response.json();
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

export async function fetchThumbnail() {
    const baseUrl = 'https://kartkatalog.geonorge.no/api/getdata';
    const url = `${baseUrl}/${METADATA_ID}`;

    const response = await fetch(url, {
        cache: SKIP_SSG ? 'no-store' : 'force-cache'
    });

    const data = await response.json();
    const thumbnails = data.Thumbnails || [];
    const thumbnail = thumbnails.find(thumbnail => thumbnail.Type === 'original');

    return thumbnail?.URL || null;
}

async function _fetchCollection(name) {
    const response = await fetch(`${API_BASE_URL}/collections/${name}?f=json`, {
        cache: SKIP_SSG ? 'no-store' : 'force-cache'
    });

    return await response.json();
}

export async function fetchItems(collection) {
   const response = await fetch(`${API_BASE_URL}/collections/${collection}/items?f=json`, {
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