import { getReasonPhrase } from 'http-status-codes';
import { ApiError } from './error';


export async function getResponse(response) {
    if (response.ok) {
        return await response.json();
    }

    const reason = getReasonPhrase(response.status);
    const message = `${response.status} (${reason})`;

    throw new ApiError(message, {
        code: response.status,
        text: response.statusText,
        reason
    });    
}

export function getStatus(error) {
    if (error instanceof ApiError) {
        return {
            data: null,
            status: error.status.code
        }
    } else {
        throw error;
    }
}
