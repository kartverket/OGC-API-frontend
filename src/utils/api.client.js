import { API_BASE_URL } from '@/config/constants.client';


export async function fetchHome() {
    const url = `${API_BASE_URL}?f=json`;

    return await _fetch(url);
}

export async function fetchItems(url) {
    return await _fetch(url);
}

export async function fetchCollection(collection) {
    const url = `${API_BASE_URL}/collections/${collection}?f=json`;

    return await _fetch(url);
}

export async function fetchQueryables(collection) {
    const url = `${API_BASE_URL}/collections/${collection}/queryables?f=json`;

    return await _fetch(url);
}

async function _fetch(url) {
    try {
        const response = await fetch(url);

        if (!response.ok) {
            const message = `Failed to fetch ${url} (${response.statusText})`;
            console.error(message);
            throw new Error(message);
        }

        return await response.json();
    } catch (error) {
        console.error(`Failed to fetch ${url}: ${error.message}`);
        throw error;
    }
}