import { fetchCollection, fetchHome, fetchItem } from '@/utils/api/server';


export async function fetchData(collection, itemId) {
    const promises = [
        fetchItem(collection, itemId),
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
            collection: {
                title: result[1].title,
            },
            dataset: {
                title: result[2].title
            }
        },
        status: 200
    };
}

export async function createMetadata(params) {
    const { collection, item } = await params;

    const promises = [
        fetchCollection(collection),
        fetchHome()
    ];

    try {
        const result = await Promise.all(promises);

        return {
            title: `${item} | Items | ${result[0].title} | Collections | ${result[1].title}  | OGC API | Kartverket`
        };
    } catch {
        return null;
    }
}
