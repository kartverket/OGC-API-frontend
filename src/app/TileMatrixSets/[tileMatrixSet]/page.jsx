import { Card, Heading, Link } from '@digdir/designsystemet-react';
import { Breadcrumbs, ErrorPage } from '@/components';
import { fetchTileMatrixSet } from '@/utils/api/server';
import styles from './page.module.css';

export const dynamic = 'force-dynamic';

export default async function TileMatrixSetPage({ params }) {
  const { tileMatrixSet } = await params;
  let matrixSet;

  try {
    matrixSet = await fetchTileMatrixSet(tileMatrixSet);
  } catch (error) {
    return <ErrorPage status={error?.status ?? 500} />;
  }

  return (
    <>
      <Breadcrumbs
        breadcrumbs={{
          '/': 'Tile Matrix Sets',
          '/TileMatrixSets': 'Tile Matrix Sets',
          [`/TileMatrixSets/${tileMatrixSet}`]: matrixSet.title || matrixSet.id,
        }}
      />

      <div className={styles.page}>
        <Heading level={1} data-size="sm">
          {matrixSet.id}
        </Heading>

        <Card className={styles.card}>
          <dl className={styles.details}>
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
            {matrixSet.uri && (
              <div>
                <dt>Uri</dt>
                <dd>
                  <Link href={matrixSet.uri} target="_blank" rel="noreferrer">
                    {matrixSet.uri}
                  </Link>
                </dd>
              </div>
            )}
            {matrixSet.wellKnownScaleSet && (
              <div>
                <dt>Well Known Scale Set</dt>
                <dd>
                  <Link href={matrixSet.wellKnownScaleSet} target="_blank" rel="noreferrer">
                    {matrixSet.wellKnownScaleSet}
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
