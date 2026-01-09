'use client'

import { useEffect, useState } from 'react';
import useSWR from 'swr';
import { buildApiUrl, fetcher } from './helpers';
import { Heading, Spinner } from '@digdir/designsystemet-react';
import ItemsProvider from '@/context/ItemsProvider';
import ItemsMapProvider from '@/context/ItemsMapProvider';
import { Breadcrumbs, ItemsMap, ItemsTable } from '@/components';
import FilterCard from '@/components/FilterCard';
import styles from './ItemsPage.module.scss';


export default function Items({ srvData, collection, searchParams }) {
    const apiUrl = buildApiUrl(collection, searchParams);
    const { data: _data = null, isLoading } = useSWR({ apiUrl, collection }, fetcher, { revalidateOnFocus: false });
    const [data, setData] = useState(null);

    useEffect(
        () => {
            if (_data !== null) {
                setData({
                    ..._data.data,
                    ...srvData
                });
            }
        },
        [_data, srvData]
    );

    if (data === null) {
        return null;
    }

    return (
        <>
            <Breadcrumbs
                breadcrumbs={{
                    '/': data.dataset.title,
                    '/collections': 'Collections',
                    [`/collections/${collection}`]: data.collection.title,
                    [`/collections/${collection}/items`]: 'Items',
                }}
            />

            <div className={styles.page}>
                <Heading level={1} data-size="sm" className={styles.heading}>{data.collection.title}</Heading>

                <div className={styles.content}>
                    {
                        isLoading && (
                            <div className={styles.overlay}>
                                <Spinner aria-label="Laster data..." data-size="xl" />
                            </div>
                        )
                    }

                    <ItemsProvider data={data}>
                        <div className={styles.top}>
                            <ItemsMapProvider data={data}>
                                <div className={styles.topLeft}>
                                    <ItemsMap width={567} height={675} />
                                </div>

                                <div className={styles.topRight}>
                                    <FilterCard data={data} />
                                </div>
                            </ItemsMapProvider>
                        </div>

                        <div className={styles.bottom}>
                            {
                                data.features.length > 0 && (
                                    <ItemsTable data={data} />
                                )
                            }
                        </div>
                    </ItemsProvider>
                </div>
            </div>
        </>
    );
}