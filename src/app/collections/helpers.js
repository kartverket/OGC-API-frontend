import { fetchCollections, fetchHome } from '@/utils/api/server';


export async function fetchData() {
    const promises = [
        fetchCollections(),
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

export async function createMetadata() {
    const { data, status } = await fetchHome();
   
    if (status !== 200) {
        return null;
    }

    return {
        title: `Collections | ${data.title}  | OGC API | Kartverket`,
    };
}