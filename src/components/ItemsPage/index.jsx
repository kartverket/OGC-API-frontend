"use client";

import { useMemo } from 'react';
import useSWRImmutable from 'swr/immutable'
import { fetchItems } from '@/utils/api/client';
import ItemsProvider from '@/context/ItemsProvider';
import ItemsMapProvider from '@/context/ItemsMapProvider';
import { useApiBaseUrlSWR } from '@/config/apiConfig.swr';
import { joinApiUrl } from '@/config/apiConfig';
import { Heading, Paragraph, Spinner } from '@digdir/designsystemet-react';
import { Breadcrumbs, ErrorPage, FilterCard, ItemsMap, ItemsTable } from '@/components';
import styles from './ItemsPage.module.css';


export default function Items({ srvData, collection, searchParams }) {
    const { apiBaseUrl } = useApiBaseUrlSWR();
    const searchKey = new URLSearchParams(searchParams).toString();

    const apiUrl = useMemo(
        () => {
            if (!apiBaseUrl) {
                return null;
            }

            const base = `/collections/${collection}/items?f=json`;
            const path = searchKey ? `${base}&${searchKey}` : base;

            return joinApiUrl(apiBaseUrl, path);
        },
        [apiBaseUrl, collection, searchKey]
    );

    const { data: _data = null, error = null, isLoading } =
        useSWRImmutable(apiUrl, fetchItems, { refreshInterval: 0, keepPreviousData: true });

    const data = useMemo(
        () => {
            if (_data === null) {
                return null;
            }

            return {
                ..._data,
                ...srvData
            };
        },
        [_data, srvData]
    );

    if (error !== null) {
        return <ErrorPage status={error.status.code} />;
    }

    if (data === null) {
        return null;
    }

    return (
        <>
            <Breadcrumbs
                breadcrumbs={{
                    "/": data.dataset.title,
                    "/collections": "Collections",
                    [`/collections/${collection}`]: data.collection.title,
                    [`/collections/${collection}/items`]: "Items",
                }}
            />

            <div className={styles.page}>
                <Heading level={1} data-size="sm" className={styles.heading}>
                    {data.collection.title}
                </Heading>
                <div className={styles.content}>
                    {isLoading && (
                        <div className={styles.overlay}>
                            <Spinner aria-label="Laster data..." data-size="xl" />
                            <Paragraph>Laster data...</Paragraph>
                        </div>
                    )}

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
                            {data.features.length > 0 && <ItemsTable data={data} />}
                        </div>
                    </ItemsProvider>
                </div>
            </div>
        </>
    );
}
