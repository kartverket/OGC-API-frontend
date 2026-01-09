import { fetchData } from './helpers';
import { Heading, Spinner } from '@digdir/designsystemet-react';
import ItemsProvider from '@/context/ItemsProvider';
import ItemsMapProvider from '@/context/ItemsMapProvider';
import { Breadcrumbs, ErrorPage, ItemsMap, ItemsPage, ItemsTable } from '@/components';
import FilterCard from '@/components/FilterCard';
import styles from './page.module.scss';
import { fetchCollection, fetchHome } from '@/utils/api/server';

export async function generateMetadata({ params }) {
    const { collection } = await params;

    const promises = [
        fetchCollection(collection),
        fetchHome()
    ];

    const result = await Promise.all(promises);

    return {
        title: `Items | ${result[0].title} | Collections | ${result[1].title}  | OGC API | Kartverket`
    };
}

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
