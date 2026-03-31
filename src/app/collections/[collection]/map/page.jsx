import { fetchCollectionPageData } from '@/services/pageData';
import { Breadcrumbs } from '@/components';
import { Heading } from '@digdir/designsystemet-react';
import { getApiBaseUrlPublic } from '@/utils/api/baseUrl';
import { collectionHasMapProvider } from '@/config/readPygeoapiConfig';
import { notFound } from 'next/navigation';
import MapViewer from '@/components/MapViewer';
import styles from './page.module.css';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }) {
    const { collection } = await params;
    const { data, status } = await fetchCollectionPageData(collection);
    if (status !== 200) return {};
    return { title: `${data.title} — Kart` };
}

export default async function CollectionMap({ params }) {
    const { collection } = await params;
    const { data, status } = await fetchCollectionPageData(collection);

    if (status !== 200) notFound();

    const hasMap = collectionHasMapProvider(collection);
    if (!hasMap) notFound();

    const bbox = data.extent?.spatial?.bbox?.[0];
    const crsOptions = data.crs;

    if (!Array.isArray(bbox) || bbox.length !== 4) notFound();
    if (!Array.isArray(crsOptions) || crsOptions.length === 0) notFound();

    const apiBaseUrl = getApiBaseUrlPublic();

    return (
        <>
            <Breadcrumbs
                breadcrumbs={{
                    '/': data.dataset.title,
                    '/collections': 'Collections',
                    [`/collections/${data.id}`]: data.title,
                    [`/collections/${data.id}/map`]: 'Kart'
                }}
            />
            <div className={styles.page}>
                <Heading level={1} data-size="sm">{data.title} — kart</Heading>
                <MapViewer
                    collectionId={data.id}
                    defaultBbox={bbox}
                    crsOptions={crsOptions}
                    apiBaseUrl={apiBaseUrl}
                />
            </div>
        </>
    );
}
