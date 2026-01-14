import { fetchCollections, fetchHome } from '@/utils/api/server';
import { createErrorResponse } from '@/utils/api/utils';


export async function fetchData() {
    const promises = [
        fetchHome(),
        fetchCollections()
    ];

    let result;

    try {
        result = await Promise.all(promises);
    } catch (error) {
        return createErrorResponse(error);
    }

    return {
        data: {
            ...result[0],
            collectionCount: result[1].collections.length
        },
        status: 200
    };
}

export async function createMetadata() {
    const { data, status } = await fetchHome();
   
    if (status !== 200) {
        return null;
    }

    return {
        title: `${data.title}  | OGC API | Kartverket`
    };
}
