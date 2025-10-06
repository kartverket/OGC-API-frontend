//http://localhost:5000/reguleringsplaner/collections/arealformal/items

'use client'

import { use } from 'react';
import { useSearchParams } from 'next/navigation';
import useSWR from 'swr'
import { fetcher } from '@/utils/api';
import { Map } from '@/components';
import styles from './page.module.scss';
import { Skeleton } from '@digdir/designsystemet-react';
import { createApiUrl } from './helpers';


export default function Collection({ params }) {
    const searchParams = useSearchParams();
    const { slug } = use(params);
    const url = createApiUrl(slug, searchParams);
    const { data = null } = useSWR(url, fetcher);

    return (
        <div className={styles.page}>
            <main className={styles.main}>
                <div className={styles.map}>
                    {
                        data == null ?
                            <Skeleton width={800} height={480} /> :
                            <Map featureCollection={data} />
                    }
                </div>
            </main>
            <footer className={styles.footer}>
            </footer>
        </div>
    );
}
