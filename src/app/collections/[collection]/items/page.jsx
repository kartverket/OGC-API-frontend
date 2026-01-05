'use client'

import { use, useEffect, useState } from 'react';
import useSWR from 'swr';
import { buildApiUrl, fetcher, getDefaultExtent } from './helpers';
import { Heading, Spinner } from '@digdir/designsystemet-react';
import { Breadcrumbs, ItemsMap, ItemsTable } from '@/components';
import FilterCard from '@/components/FilterCard';
import styles from './page.module.scss';
import MapProvider from '@/context/MapProvider';
import { isBboxValid, parseBboxStr } from '@/components/FilterCard/helpers';
import { transformExtent } from '@/utils/map/helpers';
import ItemsProvider from '@/context/ItemsProvider';


export default function Items({ params, searchParams }) {
    const { collection } = use(params);
    const _searchParams = use(searchParams)
    const apiUrl = buildApiUrl(collection, _searchParams);
    const { data: _data = null, isLoading } = useSWR({ apiUrl, collection }, fetcher, { revalidateOnFocus: false });
    const [data, setData] = useState(null);
    const [bbox, setBbox] = useState(null);

    useEffect(
        () => {
            if (_data !== null) {
                setData(_data);
            }
        },
        [_data]
    );

    useEffect(
        () => {
            if (data === null) {
                return;
            }

            const bboxStr = _searchParams.bbox;
            let bbox = bboxStr !== undefined ? parseBboxStr(bboxStr) : null;

            if (!isBboxValid(bbox)) {
                bbox = transformExtent(data.collection.extent.bbox, data.collection.extent.crs, 'EPSG:4326');
            }

            setBbox(bbox);
        },
        [data, _searchParams]
    )

    if (data === null || bbox === null) {
        return null;
    }

    const defaultExtent = data.collection.extent; // getDefaultExtent(_searchParams, data);

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
                        <MapProvider data={data}>
                            <ItemsProvider>
                                <div className={styles.topLeft}>
                                    <ItemsMap
                                        featureCollection={data}
                                        defaultExtent={defaultExtent}
                                        bbox={bbox}
                                        onBboxChange={setBbox}
                                        width={567}
                                        height={675}
                                    />
                                </div>

                                <div className={styles.topRight}>
                                    <FilterCard
                                        data={data}
                                        bbox={bbox}
                                        onBboxChange={setBbox}
                                    />
                                </div>
                            </ItemsProvider>
                        </MapProvider>
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