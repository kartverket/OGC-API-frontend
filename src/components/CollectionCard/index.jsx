import { Card, Heading } from '@digdir/designsystemet-react';
import {
  ArrowRightIcon,
  ChevronRightIcon,
  LayersFillIcon,
  SquareGridFillIcon,
  TableFillIcon,
} from '@navikt/aksel-icons';
import Image from 'next/image';
import NextLink from 'next/link';
import { fetchCollection } from '@/utils/api/server';
import styles from './CollectionCard.module.css';

export default async function CollectionCard({ collection, hasFeature, hasMap, hasCoverage, hasTiles }) {
  const mainLink = `/collections/${collection.id}`;
  // Fetch one item to check geometry type
  let geometryType = null;
  if (hasFeature) {
    try {
      const itemsData = await fetchCollection(collection.id);
      geometryType = itemsData.geometryType || null;
    } catch (error) {
      console.error(`[CollectionCard] Failed to fetch items for collection ${collection.id}:`, error);
    }
  }

  // Determine which icon to use based on geometry type (default to polygon)
  let geometryIconPath = hasCoverage ? '/gfx/raster.svg' : '/gfx/polygon.svg';
  const countValue = hasCoverage ? collection.fileCount : collection.itemCount;

  if (geometryType) {
    if (/polygon/i.test(geometryType)) {
      geometryIconPath = '/gfx/polygon.svg';
    } else if (/line/i.test(geometryType)) {
      geometryIconPath = '/gfx/line.svg';
    } else if (/point/i.test(geometryType)) {
      geometryIconPath = '/gfx/points.svg';
    } else {
      // Fallback to polygon for unrecognized geometry types
      geometryIconPath = '/gfx/polygon.svg';
    }
  }

  return (
    <Card className={styles.card}>
      <div className={styles.cardContent}>
        <NextLink href={mainLink} className={styles.top}>
          <div className={styles.left}>
            <Heading level={2} data-size="xs" className={styles.title}>
              {collection.title}
            </Heading>
          </div>
          <ArrowRightIcon title="a11y-title" fontSize="1.5rem" color="white" />
        </NextLink>
        <div className={styles.thumbnail}>
          <Image src={geometryIconPath} alt="Thumbnail" width={150} height={150} />
        </div>
        <div className={styles.content}>
          <div className={styles.middle}>
            <div className={styles.description}>{collection.description}</div>
          </div>
          <div className={styles.bottom}>
            <div className={styles.left}>
              {hasFeature && (
                <span className={`${styles.itemType} ${styles.tag}`}>{collection.itemType || 'Feature'}</span>
              )}
              {hasMap && <span className={`${styles.itemType} ${styles.tag}`}>Maps</span>}

              {hasCoverage && <span className={`${styles.itemType} ${styles.tag}`}>Coverage</span>}

              {hasTiles && <span className={`${styles.itemType} ${styles.tag}`}>Tiles</span>}

              <div className={styles.keywords}>
                {(Array.isArray(collection.keywords) ? collection.keywords : []).map((keyword) => (
                  <span key={keyword} className={styles.tag}>
                    {keyword}
                  </span>
                ))}
              </div>
              <div>
                {countValue > 0 && <span className={`${styles.itemCount} ${styles.tag}`}>{countValue} objekter</span>}
              </div>
            </div>
          </div>
          <div className={styles.right}>
            <div className={styles.actionCards}>
              {hasFeature && (
                <Card asChild data-variant="tinted" data-color="accent" className={styles.objectCard}>
                  <NextLink href={`/collections/${collection.id}/items`}>
                    <TableFillIcon title="a11y-title" fontSize="20px" />
                    <span>Vis objekter</span>
                    <ChevronRightIcon title="a11y-title" fontSize="20px" />
                  </NextLink>
                </Card>
              )}

              {hasTiles && (
                <Card asChild data-variant="tinted" data-color="accent" className={styles.objectCard}>
                  <NextLink href={`/collections/${collection.id}/tiles`}>
                    <SquareGridFillIcon title="a11y-title" fontSize="20px" />
                    <span>Vis fliser</span>
                    <ChevronRightIcon title="a11y-title" fontSize="20px" />
                  </NextLink>
                </Card>
              )}

              {hasMap && (
                <Card asChild data-variant="tinted" data-color="accent" className={styles.objectCard}>
                  <NextLink href={`/collections/${collection.id}/map`}>
                    <LayersFillIcon title="a11y-title" fontSize="20px" />
                    <span>Vis kart</span>
                    <ChevronRightIcon title="a11y-title" fontSize="20px" />
                  </NextLink>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
