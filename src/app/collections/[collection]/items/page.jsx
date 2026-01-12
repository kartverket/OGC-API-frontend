import { createMetadata, fetchData } from './helpers';
import { ErrorPage, ItemsPage} from '@/components';


export const generateMetadata = async ({ params }) => createMetadata(params);

export default async function Items({ params, searchParams }) {
    const { collection } = await params;
    const _searchParams = await searchParams;
    const { data, status } = await fetchData(collection);

    if (status !== 200) {
        return <ErrorPage status={status} />;
    }

    return (
        <ItemsPage
            srvData={data}
            collection={collection}
            searchParams={_searchParams}
        />
    );
}
