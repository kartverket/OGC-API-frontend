import { API_BASE_URL, SKIP_SSG } from '@/config/constants';

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