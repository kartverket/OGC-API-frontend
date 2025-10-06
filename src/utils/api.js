const API_BASE_URL = process.env.API_BASE_URL;

export const fetcher = (...args) => fetch(...args).then(response => response.json());

export async function fetchHome() {
    const response = await fetch(`${API_BASE_URL}/?f=json`);
    return await response.json();
}

export async function fetchCollections() {
    const response = await fetch(`${API_BASE_URL}/collections/?f=json`);
    return await response.json();
}

export async function fetchCollection(name) {
    const response = await fetch(`${API_BASE_URL}/collections/${name}?f=json`);
    return await response.json();
}