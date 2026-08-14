import { notFound } from 'next/navigation';
import { Heading } from '@digdir/designsystemet-react';
import { Breadcrumbs, TilesViewer } from '@/components';
import { collectionHasVectorTileCapability } from '@/utils/api/capabilities';
import { fetchCollectionPageData } from '@/services/pageData';
import { getBaseUrlPublic } from '@/utils/api/baseUrl';
import styles from './page.module.css';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }) {
  const { collection } = await params;
  const { data, status } = await fetchCollectionPageData(collection);
  if (status !== 200) return {};
  return { title: `${data.title} — Fliser` };
}

export default async function CollectionTiles({ params }) {
  const { collection } = await params;
  const { data, status } = await fetchCollectionPageData(collection);

  if (status !== 200) notFound();

  const hasTiles = collectionHasVectorTileCapability(data.links);
  if (!hasTiles) notFound();

  const bbox = data.extent?.spatial?.bbox?.[0];
  if (!Array.isArray(bbox) || bbox.length !== 4) notFound();

  const baseUrl = getBaseUrlPublic();
  if (!baseUrl) notFound();

  return (
    <>
      <Breadcrumbs
        breadcrumbs={{
          '/': data.dataset.title,
          '/collections': 'Collections',
          [`/collections/${data.id}`]: data.title,
          [`/collections/${data.id}/tiles`]: 'Fliser',
        }}
      />
      <div className={styles.page}>
        <Heading level={1} data-size="sm">
          {data.title} — fliser
        </Heading>
        <TilesViewer collectionId={data.id} defaultBbox={bbox} baseUrl={baseUrl} />
      </div>
    </>
  );
}
