import { fetchCollections, fetchHome, getStatus } from '@/utils/api';


export async function fetchData() {
    const promises = [
        fetchHome(),
        fetchCollections()
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
            collectionCount: result[1].collections.length
        },
        status: 200
    };
}
