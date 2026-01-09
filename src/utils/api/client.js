import { API_BASE_URL } from '@/config/constants.client';
import { getResponse } from './utils';


export async function fetchHome() {
    const url = `${API_BASE_URL}?f=json`;
    const response = await fetch(url);

    return await getResponse(response);
}

export async function fetchItems(url) {
    const response = await fetch(url);

    return await getResponse(response);
}

export async function fetchCollection(collection) {
    const url = `${API_BASE_URL}/collections/${collection}?f=json`;
    const response = await fetch(url);

    return await getResponse(response);
}

export async function fetchQueryables(collection) {
    const url = `${API_BASE_URL}/collections/${collection}/queryables?f=json`;
    const response = await fetch(url);

    return await getResponse(response);
}
