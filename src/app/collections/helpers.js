import { fetchCollections, fetchHome, getStatus } from '@/utils/api';


export async function fetchData() {
    const promises = [
        fetchCollections(),
        fetchHome()
    ];

    let result;

    try {
        result = await Promise.all(promises);
    } catch (error) {
        return getStatus(error);
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
