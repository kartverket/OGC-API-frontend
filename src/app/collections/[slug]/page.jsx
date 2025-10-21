'use client'

import { use } from 'react';
import useSWR from 'swr'
import { fetcher } from '@/utils/api';
import { bboxToFeatureCollection } from './helpers';
import { Breadcrumbs, Map } from '@/components';
import { API_BASE_URL } from '@/config/constants.client';
import styles from './page.module.scss';
import { Heading, Paragraph } from '@digdir/designsystemet-react';


export default function Collection({ params }) {
    const { slug } = use(params);
    const { data } = useSWR(`${API_BASE_URL}/collections/${slug}?f=json`, fetcher);

    if (!data) {
        return null;
    }

    const bbox = data.extent.spatial.bbox[0];
    const featureCollection = bboxToFeatureCollection(bbox);

    return (
        <>
            <Breadcrumbs
                breadcrumbs={{
                    '/': 'Administrative enheter',
                    '/collections': 'Collections',
                    [`/collections/${data.id}`]: data.title
                }}
            />

            <div className={styles.page}>
                <Heading level={1} data-size="sm" className={styles.heading}>{data.title}</Heading>
                
                <Paragraph>
                    Detaljert informasjon om datasett...
                </Paragraph>
            </div>
        </>
    );
}
