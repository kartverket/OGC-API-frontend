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

    return await response.json();
}

export async function fetchCollection(name) {
    const response = await fetch(`${API_BASE_URL}/collections/${name}?f=json`);
    return await response.json();
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