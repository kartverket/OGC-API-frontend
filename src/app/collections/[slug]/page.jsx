'use client'

import { use } from 'react';
import useSWR from 'swr'
import { fetcher } from '@/utils/api';
import { bboxToFeatureCollection } from './helpers';
import { Map } from '@/components';
import { API_BASE_URL } from '@/config/constants.client';
import styles from './page.module.scss';


export default function Collection({ params }) {
    const { slug } = use(params);
    const { data } = useSWR(`${API_BASE_URL}/collections/${slug}?f=json`, fetcher);

    if (!data) {
        return null;
    }

    const bbox = data.extent.spatial.bbox[0];
    const featureCollection = bboxToFeatureCollection(bbox);

    return (
        <div className={styles.page}>
            <main className={styles.main}>
                <Map featureCollection={featureCollection} />
            </main>
            <footer className={styles.footer}>
            </footer>
        </div>
    );
}
