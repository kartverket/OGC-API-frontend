import { fetchHome, fetchItem } from '@/utils/api';
import { Heading } from '@digdir/designsystemet-react';
import { Breadcrumbs } from '@/components';
import styles from './page.module.scss';

async function fetchPageData(collection, itemId) {
    const promises = [
        fetchHome(),
        fetchItem(collection, itemId)
    ];

    const result = await Promise.all(promises);

    return {
        ...result[1],
        datasetTitle: result[0].title
    }
}

export default async function Item({ params }) {
    const { collection, item } = await params;
    const data = await fetchPageData(collection, item);
    const collectionTitle = data.links.find(link => link.rel === 'collection').title;

    return (
        <>
            <Breadcrumbs
                breadcrumbs={{
                    '/': data.datasetTitle,
                    '/collections': 'Collections',
                    [`/collections/${collection}`]: collectionTitle,
                    [`/collections/${collection}/items`]: 'Items',
                    [`/collections/${collection}/items/${data.id}`]: data.id,
                }}
            />

            <div className={styles.page}>
                <Heading level={1} data-size="sm" className={styles.heading}>{data.id}</Heading>
            </div>
        </>
    );
}