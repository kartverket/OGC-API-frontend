import { getResponse } from './utils';


export async function fetchItems(url) {
    const response = await fetch(url);

    return await getResponse(response);    
}
