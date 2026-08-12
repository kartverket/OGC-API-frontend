import Image from "next/image";
import NextLink from "next/link";
import { getCrsCode } from "@/utils/map/helpers";
import { Card, Heading, Link } from "@digdir/designsystemet-react";
import { ArrowRightIcon, ChevronRightIcon } from "@navikt/aksel-icons";
import styles from "./CollectionCard.module.css";
import { fetchCollection } from "@/utils/api/server";

export default async function CollectionCard({ collection, hasFeature, hasMap, hasCoverage, hasTiles }) {
  const mainLink = hasCoverage
    ? `/collections/${collection.id}`
    : hasFeature
      ? `/collections/${collection.id}/items`
      : `/collections/${collection.id}`;

  // Fetch one item to check geometry type
  let geometryType = null;
  if (hasFeature) {
    try {
      const itemsData = await fetchCollection(collection.id);
      geometryType = itemsData.geometryType || null;
    } catch (error) {
      console.error(
        `[CollectionCard] Failed to fetch items for collection ${collection.id}:`,
        error,
      );
    }
  }

  // Determine which icon to use based on geometry type (default to polygon)
  let geometryIconPath = hasCoverage ? "/gfx/raster.svg" : "/gfx/polygon.svg";
  const countValue = hasCoverage ? collection.fileCount : collection.itemCount;
  const countLabel = hasCoverage ? "files" : "features";

  if (geometryType) {
    if (/polygon/i.test(geometryType)) {
      geometryIconPath = "/gfx/polygon.svg";
    } else if (/line/i.test(geometryType)) {
      geometryIconPath = "/gfx/line.svg";
    } else if (/point/i.test(geometryType)) {
      geometryIconPath = "/gfx/points.svg";
    } else {
      // Fallback to polygon for unrecognized geometry types
      geometryIconPath = "/gfx/polygon.svg";
    }
  }

  return (
    <Card className={styles.card}>
      <div className={styles.cardContent}>
        <NextLink
          href={mainLink}
          className={styles.thumbnail}
        >
          <Image
            src={geometryIconPath}
            alt="Thumbnail"
            width={150}
            height={150}
          />
        </NextLink>

        <div className={styles.content}>
          <div className={styles.top}>
            <div className={styles.left}>
              <Link asChild>
                <NextLink href={mainLink}>
                  <Heading level={2} data-size="xs" className={styles.title}>
                    {collection.title}
                  </Heading>

                  <ChevronRightIcon fontSize="24px" />
                </NextLink>
              </Link>
              {countValue > 0 && (
                <span className={`${styles.itemCount} ${styles.tag}`}>
                  {countValue} {countLabel}
                </span>
              )}
            </div>
            {/* Commented out, as we don't have updated info yet */}
            {/* <div className={styles.updated}>
              <div className={styles.label}>Oppdatert</div>
              <div className={styles.value}>21.10.2025</div>
            </div> */}
          </div>

          <div className={styles.middle}>
            <div className={styles.description}>{collection.description}</div>

            <div className={styles.divider}></div>
            <div className={styles.metadata}>
              <div>
                <div className={styles.label}>Koordinatsystem</div>
                <div className={styles.value}>
                  {getCrsCode(collection.storageCrs)}
                </div>
              </div>
            </div>
          </div>

          <div className={styles.bottom}>
            <div className={styles.left}>
              {hasFeature && (
                <span className={`${styles.itemType} ${styles.tag}`}>{collection.itemType || "Feature"}</span>
              )}

              {hasMap && (
                <span className={`${styles.itemType} ${styles.tag}`}>Maps</span>
              )}

              {hasCoverage && (
                <span className={`${styles.itemType} ${styles.tag}`}>Coverage</span>
              )}

              {hasTiles && (
                <span className={`${styles.itemType} ${styles.tag}`}>Tiles</span>
              )}

              <div className={styles.keywords}>
                {((Array.isArray(collection.keywords) ? collection.keywords : [])).map((keyword) => (
                  <span key={keyword} className={styles.tag}>
                    {keyword}
                  </span>
                ))}
              </div>
            </div>

            <div className={styles.detailsLink}>
              <Link asChild>
                <NextLink href={`/collections/${collection.id}`}>
                  Vis detaljert info
                  <ArrowRightIcon title="a11y-title" fontSize="28px" />
                </NextLink>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
