import { fetchHome, fetchItems } from '@/utils/api.client';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

export function buildApiUrl(collection, searchParams) {
    const baseUrl = `${API_BASE_URL}/collections/${collection}/items?f=json`;
    
    const queryStr = Object.entries(searchParams)
        .map(entry => `${entry[0]}=${entry[1]}`).join('&');
    
    return queryStr !== '' ? 
        `${baseUrl}&${queryStr}` : 
        baseUrl;
}

export async function fetcher(url) {
    const promises = [fetchHome(), fetchItems(url)];
    const result = await Promise.all(promises);

    return {
        ...result[1],
        datasetTitle: result[0].title
    }
}
