import { API_BASE_URL } from '@/config/constants.client';


export function buildApiUrl(collection, searchParams) {
    const baseUrl = `${API_BASE_URL}/collections/${collection}/items?f=json`;

    const queryStr = Object.entries(searchParams)
        .map(entry => `${entry[0]}=${entry[1]}`).join('&');

    return queryStr !== '' ?
        `${baseUrl}&${queryStr}` :
        baseUrl;
}
