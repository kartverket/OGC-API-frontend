import { fetchCollectionsPageData } from '@/services/pageData';
import { createCollectionsMetadata } from '@/services/pageMetadata';
import { Heading } from '@digdir/designsystemet-react';
import { Breadcrumbs, CollectionCard, ErrorPage } from '@/components';
import { getCollectionReferencedFileCount } from '@/config/readPygeoapiConfig';
import {
  collectionHasCoverageCapability,
  collectionHasFeatureCapability,
  collectionHasMapCapability,
  collectionHasVectorTileCapability,
} from '@/utils/api/capabilities';
// import CollectionCard from "@/components/CollectionCard";
import styles from './page.module.css';

// Force runtime reading (needed for config file access)
export const dynamic = 'force-dynamic';

export const generateMetadata = async () => createCollectionsMetadata();

export default async function Collections() {
  const { data, status } = await fetchCollectionsPageData();

  if (status !== 200) {
    return <ErrorPage status={status} />;
  }

  return (
    <>
      <Breadcrumbs
        breadcrumbs={{
          '/': data.dataset.title,
          '/collections': 'Collections',
        }}
      />

      <div className={styles.page}>
        <Heading level={1} data-size="sm" className={styles.heading}>
          Innhold i datasettet
        </Heading>

        <div className={styles.collections}>
          {data.collections.map((collection) => {
            const hasFeature = collectionHasFeatureCapability(collection.links);
            const hasCoverage = collectionHasCoverageCapability(collection.links);
            const hasMap = collectionHasMapCapability(collection.links);
            const hasTiles = collectionHasVectorTileCapability(collection.links);
            const collectionWithFileCount = hasCoverage
              ? {
                  ...collection,
                  fileCount: getCollectionReferencedFileCount(collection.id),
                }
              : collection;

            return (
              <CollectionCard
                key={collection.id}
                collection={collectionWithFileCount}
                hasFeature={hasFeature}
                hasMap={hasMap}
                hasCoverage={hasCoverage}
                hasTiles={hasTiles}
              />
            );
          })}
        </div>
      </div>
    </>
  );
}
