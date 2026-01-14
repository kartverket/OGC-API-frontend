import { buildApiUrl } from '@/config/apiConfig';

export const fetcher = (...args) => fetch(...args).then(response => response.json());

// The functions below accept both absolute or relative URL paths
export async function fetchHome() {
    const response = await fetch(buildApiUrl(`?f=json`));
    return await response.json();
}

export async function fetchItems(url) {
    const separator = url.includes('?') ? '&' : '?';
    const response = await fetch(buildApiUrl(`${url}${separator}f=json`));
    return await response.json();
}

export async function fetchCollection(collection) {
    const response = await fetch(buildApiUrl(`/collections/${collection}?f=json`));
    return await response.json();
}

export async function fetchQueryables(collection) {
    const response = await fetch(buildApiUrl(`/collections/${collection}/queryables?f=json`));
    return await response.json();
}