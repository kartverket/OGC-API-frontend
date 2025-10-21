'use client'

import { use } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import useSWR from 'swr'
import { fetcher } from '@/utils/api';
import { getItemsApiUrl, getCollectionApiUrl, getCollectionId } from './helpers';
import { Heading, Paragraph } from '@digdir/designsystemet-react';
import { Breadcrumbs } from '@/components';
import styles from './page.module.scss';


export default function Collection({ params }) {
    const { slug } = use(params);
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const collectionId = getCollectionId(pathname)

    const { data: collection = null } = useSWR(getCollectionApiUrl(collectionId), fetcher);
    const { data: items = null } = useSWR(getItemsApiUrl(slug, searchParams), fetcher);

    if (collection === null) {
        return null;
    }

    return (
        <>
            <Breadcrumbs
                breadcrumbs={{
                    '/': 'Administrative enheter',
                    '/collections': 'Collections',
                    [`/collections/${collection.id}`]: collection.title,
                    [`/collections/${collection.id}/items`]: 'Items'
                }}
            />

            <div className={styles.page}>
                <Heading level={1} data-size="sm" className={styles.heading}>{collection.title}</Heading>

                <Paragraph>
                    Kartvisning av items...
                </Paragraph>
            </div>
        </>
    );
}
