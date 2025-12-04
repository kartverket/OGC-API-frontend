'use client'

import { use, useEffect, useState } from 'react';
import useSWR from 'swr';
import { buildApiUrl, fetcher, getDefaultExtent } from './helpers';
import { Heading, Spinner } from '@digdir/designsystemet-react';
import { Breadcrumbs, ItemsMap, ItemsTable } from '@/components';
import FilterCard from '@/components/FilterCard';
import styles from './page.module.scss';
import MapProvider from '@/context/MapProvider';


export default function Items({ params, searchParams }) {
    const { collection } = use(params);
    const _searchParams = use(searchParams)
    const apiUrl = buildApiUrl(collection, _searchParams);
    const { data: _data = null, isLoading } = useSWR({ apiUrl, collection }, fetcher, { revalidateOnFocus: false });
    const [data, setData] = useState(null);
    const defaultExtent = getDefaultExtent(_searchParams, data);
    const [bbox, setBbox] = useState(null);

    useEffect(
        () => {
            if (_data !== null) {
                setData(_data);
            }
        },
        [_data]
    );

    if (data === null) {
        return null;
    }

    return (
        <>
            <Breadcrumbs
                breadcrumbs={{
                    '/': data.datasetTitle,
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

                    <div className={styles.top}>
                        <div className={styles.topLeft}>
                            <MapProvider featureCollection={data}>
                                <ItemsMap
                                    featureCollection={data}
                                    defaultExtent={defaultExtent}
                                    width={567}
                                    height={675} 
                                    bbox={bbox}
                                    onExtentChange={setBbox}
                                />
                            </MapProvider>
                        </div>

                        <div className={styles.topRight}>
                            <FilterCard 
                                data={data} 
                                onBboxChange={setBbox}
                                bbox={bbox}
                                // onExtentUpdate=
                            />
                        </div>
                    </div>

                    <div className={styles.bottom}>
                        {
                            data.features.length > 0 && (
                                <ItemsTable data={data} />
                            )
                        }
                    </div>
                </div>
            </div>
        </>
    );
}