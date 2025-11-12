'use client'

import { fetcher, fetchHome, fetchItems } from '@/utils/api';
import { getItemsApiUrl, getCollectionApiUrl, getCollectionId } from './helpers';
import { Heading, Table, Select, Label, Field, Pagination } from '@digdir/designsystemet-react';
import { Breadcrumbs, ItemsTable, Map } from '@/components';
import styles from './page.module.scss';
import FilterCard from '@/components/FilterCard';
import ItemsProvider from '@/context/ItemsProvider';
import { use } from 'react';
import useSWR from 'swr';

async function fetchPageData(collection, searchParams) {
    const promises = [
        fetchHome(),
        fetchItems(collection, searchParams)
    ];

    const result = await Promise.all(promises);

    return {
        ...result[1],
        datasetTitle: result[0].title
    }
}

export default function Items({ params, searchParams }) {
    const { collection } = use(params);
    const _searchParams = use(searchParams)

    // const { data = null } = useSWR(getCollectionApiUrl(collectionId), fetcher);
    const itemsUrl = getItemsApiUrl(collection, _searchParams);
    const { data = null } = useSWR(itemsUrl, fetcher);
    // const data = useSWR() await fetchPageData(collection, _searchParams);
    console.log(data);
    const datasetTitle = 'Yo'
    const collectionTitle = 'To'; // data.links.find(link => link.rel === 'collection').title;

    if (data === null) {
        return null;
    }

    return (
        <>
            <Breadcrumbs
                breadcrumbs={{
                    '/': datasetTitle,
                    '/collections': 'Collections',
                    [`/collections/${collection}`]: collectionTitle,
                    [`/collections/${collection}/items`]: 'Items',
                }}
            />

            <div className={styles.page}>
                <Heading level={1} data-size="sm" className={styles.heading}>{collectionTitle}</Heading>

                <div className={styles.top}>
                    <div className={styles.topLeft}>
                        <Map
                            featureCollection={data}
                            width={567}
                            height={675}
                        />
                    </div>
                    <div className={styles.topRight}></div>
                </div>

                <div className={styles.bottom}>
                    {
                        data.features.length > 0 && (
                            <ItemsTable data={data} />
                        )
                    }
                </div>

            </div>
        </>
    );
}