import { API_BASE_URL } from '@/config/constants.client';

export const fetcher = (...args) => fetch(...args).then(response => response.json());

export async function fetchHome() {
    const response = await fetch(`${API_BASE_URL}/?f=json`);
    return await response.json();
}

export async function fetchItems(url) {
    const response = await fetch(url);
    return await response.json();
}

export async function fetchCollection(collection) {
    const response = await fetch(`${API_BASE_URL}/collections/${collection}?f=json`);
    return await response.json();
}

export async function fetchQueryables(collection) {
    const response = await fetch(`${API_BASE_URL}/collections/${collection}/queryables?f=json`);
    return await response.json();
}