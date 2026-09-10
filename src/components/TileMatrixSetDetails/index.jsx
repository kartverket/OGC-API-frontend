import { Card, Heading, Link, Paragraph } from '@digdir/designsystemet-react';
import { notFound } from 'next/navigation';
import { Breadcrumbs } from '@/components';
import { fetchCollectionPageData } from '@/services/pageData';
import { getApiBaseUrlServer } from '@/utils/api/baseUrl';
import { getResponse } from '@/utils/api/utils';
import detailStyles from './TileMatrixSetDetails.module.css';

async function fetchTileMetadata(collection, tileMatrixSet) {
  const apiBaseUrl = getApiBaseUrlServer();
  if (!apiBaseUrl) {
    throw new Error('API_BASE_URL is not configured on the server.');
  }

  const response = await fetch(`${apiBaseUrl}/collections/${collection}/tiles/${tileMatrixSet}/metadata?f=json`, {
    cache: 'no-store',
  });

  return await getResponse(response);
}

export default async function TileMatrixSetDetails({ collection, tileMatrixSet, styles }) {
  const { data, status } = await fetchCollectionPageData(collection);

  if (status !== 200) notFound();

  let metadata;
  try {
    metadata = await fetchTileMetadata(collection, tileMatrixSet);
  } catch {
    notFound();
  }

  const itemLink = (metadata.links ?? []).find((link) => link.rel === 'item');
  const matrixSet = {
    id: tileMatrixSet,
    title: itemLink?.title || null,
    description: metadata.description || null,
    dataType: metadata.dataType || null,
    crs: metadata.crs || null,
    tileMatrixSetURI: metadata.tileMatrixSetURI || null,
    itemTemplate: itemLink?.href?.replace('{tileMatrixSetId}', tileMatrixSet) || null,
  };

  return (
    <>
      <Breadcrumbs
        breadcrumbs={{
          '/': data.dataset.title,
          '/collections': 'Collections',
          [`/collections/${data.id}`]: data.title,
          [`/collections/${data.id}/tiles`]: 'Fliser',
          [`/collections/${data.id}/tiles/${tileMatrixSet}/metadata`]: 'Metadata',
        }}
      />

      <div className={styles.page}>
        <Heading level={1} data-size="sm">
          {matrixSet.title}
        </Heading>

        <Card className={detailStyles.card}>
          {matrixSet.description && (
            <section>
              <Paragraph data-size="sm">{matrixSet.description}</Paragraph>
            </section>
          )}
          {matrixSet.itemTemplate && (
            <section>
              <Heading level={2} data-size="xs">
                Tile URL template
              </Heading>
              <Paragraph data-size="sm">{matrixSet.itemTemplate}</Paragraph>
            </section>
          )}
          <Heading level={2} data-size="xs">
            Metadata
          </Heading>

          <dl className={detailStyles.details}>
            {matrixSet.dataType && (
              <div>
                <dt>Datatype</dt>
                <dd>{matrixSet.dataType}</dd>
              </div>
            )}
            {matrixSet.crs && (
              <div>
                <dt>CRS</dt>
                <dd>
                  <Link href={matrixSet.crs} target="_blank" rel="noreferrer">
                    {matrixSet.crs}
                  </Link>
                </dd>
              </div>
            )}
            {matrixSet.tileMatrixSetURI && (
              <div>
                <dt>TileMatrixSet URI</dt>
                <dd>
                  <Link href={matrixSet.tileMatrixSetURI} target="_blank" rel="noreferrer">
                    {matrixSet.tileMatrixSetURI}
                  </Link>
                </dd>
              </div>
            )}
          </dl>
        </Card>
      </div>
    </>
  );
}
