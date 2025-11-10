const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

export function getItemsApiUrl(slug, searchParams) {
    const baseUrl = `${API_BASE_URL}/collections/${slug}/items?f=json`;
    const queryStr = Array.from(searchParams).map(tuple => `${tuple[0]}=${tuple[1]}`).join('&');
    const url = queryStr ? `${baseUrl}&${queryStr}` : baseUrl;

    return url;
}

export function getCollectionApiUrl(collectionId) {
    return `${API_BASE_URL}/collections/${collectionId}?f=json`;
}

export function getCollectionId(pathname) {
    return pathname.split('/').at(-2);
}