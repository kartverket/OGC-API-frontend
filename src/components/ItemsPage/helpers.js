import { API_BASE_URL } from '@/config/constants.client';
import { fetchItems } from '@/utils/api/client';
import { getStatus } from '@/utils/api/utils';


export function buildApiUrl(collection, searchParams) {
    const baseUrl = `${API_BASE_URL}/collections/${collection}/items?f=json`;

    const queryStr = Object.entries(searchParams)
        .map(entry => `${entry[0]}=${entry[1]}`).join('&');

    return queryStr !== '' ?
        `${baseUrl}&${queryStr}` :
        baseUrl;
}

export async function fetcher({ apiUrl }) {
    try {
        return {
            data: await fetchItems(apiUrl),
            status: 200
        };
    } catch (error) {
        return getStatus(error);
    }
}
