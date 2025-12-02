export const fetcher = (...args) => fetch(...args).then(response => response.json());

export async function fetchHome() {
    const response = await fetch(`/?f=json`);
    return await response.json();
}

export async function fetchItems(url) {
    const response = await fetch(url);
    return await response.json();
}

export async function fetchCollection(collection) {
    const response = await fetch(`/collections/${collection}?f=json`);
    return await response.json();
}

export async function fetchQueryables(collection) {
    const response = await fetch(`/collections/${collection}/queryables?f=json`);
    return await response.json();
}