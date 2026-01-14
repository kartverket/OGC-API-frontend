import { fetchCollection, fetchHome } from '@/utils/api/server';


export async function fetchData(collection) {
    const promises = [
        fetchCollection(collection),
        fetchHome()
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
            dataset: {
                title: result[1].title
            }
        },
        status: 200
    };
}

export async function createMetadata(params) {
    const { collection } = await params;
    const { data, status } = await fetchData(collection);
   
    if (status !== 200) {
        return null;
    }

    return {
        title: `${data.title} | Collections | ${data.dataset.title}  | OGC API | Kartverket`
    };
}