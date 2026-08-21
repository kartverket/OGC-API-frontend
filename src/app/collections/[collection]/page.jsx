import { Card, Heading, Paragraph } from '@digdir/designsystemet-react';
import { ChevronRightIcon, LayersFillIcon, PackageFillIcon, SquareGridFillIcon } from '@navikt/aksel-icons';
import bboxPolygon from '@turf/bbox-polygon';
import { featureCollection as createFeatureCollection } from '@turf/helpers';
import Image from 'next/image';
import NextLink from 'next/link';
import thumbnail from '@/assets/gfx/collection-thumbnail.png';
import { Breadcrumbs, CollectionMapImage, DatasetInfoCard, DownloadPanel, ErrorPage } from '@/components';
import { fetchCollectionPageData } from '@/services/pageData';
import { createCollectionMetadata } from '@/services/pageMetadata';
import {
  collectionHasCoverageCapability,
  collectionHasFeatureCapability,
  collectionHasMapCapability,
  collectionHasVectorTileCapability,
} from '@/utils/api/capabilities';
import { getBbox } from '@/utils/map/helpers';
import CoverageDownloadButtons from './CoverageDownloadButtons';
import styles from './page.module.css';

// Force runtime reading (needed for config file access)
export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }) {
  const { collection } = await params;
  return createCollectionMetadata(collection);
}

function normalizeMediaType(type) {
  return String(type ?? '')
    .split(';')[0]
    .trim()
    .toLowerCase();
}

function isMediaType(type, expected) {
  return normalizeMediaType(type) === expected;
}

function getCoverageLinkLabel(link) {
  if (isMediaType(link.type, 'application/prs.coverage+json')) {
    return 'Coverage as covjson';
  }

  if (isMediaType(link.type, 'image/tiff')) {
    return 'Coverage data as GTiff';
  }

  return link.title || link.type || 'Coverage';
}

function addBboxToCoverageHref(href, bbox) {
  if (typeof href !== 'string' || href.length === 0 || !Array.isArray(bbox) || bbox.length !== 4) {
    return href;
  }

  const isAbsoluteUrl = /^[a-zA-Z][a-zA-Z\d+-.]*:/.test(href);
  const isRootRelative = href.startsWith('/');

  // Avoid changing the meaning of other relative URLs (e.g. "coverage" without a leading slash)
  if (!isAbsoluteUrl && !isRootRelative) {
    return href;
  }

  try {
    const url = isAbsoluteUrl ? new URL(href) : new URL(href, 'http://localhost');
    url.searchParams.set('bbox', bbox.join(','));

    return isAbsoluteUrl ? url.toString() : `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return href;
  }
}

export default async function Collection({ params }) {
  const { collection } = await params;
  const { data, status } = await fetchCollectionPageData(collection);

  if (status !== 200) {
    return <ErrorPage status={status} />;
  }

  const hasFeature = collectionHasFeatureCapability(data.links);
  const hasMap = collectionHasMapCapability(data.links);
  const hasCoverage = collectionHasCoverageCapability(data.links);
  const hasTiles = collectionHasVectorTileCapability(data.links);
  const coverageLinks = hasCoverage
    ? (data.links ?? []).filter((link) => {
        return (
          link.rel?.endsWith('/coverage') &&
          !isMediaType(link.type, 'text/html') &&
          !isMediaType(link.type, 'application/prs.coverage+json')
        );
      })
    : [];

  const coverageDownloads = coverageLinks.map((link) => ({
    href: addBboxToCoverageHref(typeof link.href === 'string' ? link.href.trim() : '', data.extent?.spatial?.bbox?.[0]),
    label: getCoverageLinkLabel(link),
    filename: isMediaType(link.type, 'image/tiff') ? `${data.id}.tif` : `${data.id}.json`,
  }));
  const hasCoverageDownloads = coverageDownloads.length > 0;

  const bbox = getBbox(data.extent.spatial.bbox[0], data.extent.spatial.crs);
  const featureCollection = createFeatureCollection([bboxPolygon(bbox)]);

  return (
    <>
      <Breadcrumbs
        breadcrumbs={{
          '/': data.dataset.title,
          '/collections': 'Collections',
          [`/collections/${data.id}`]: data.title,
        }}
      />
      <div className={styles.page}>
        <div className={styles.top}>
          <div className={styles.left}>
            <div className={styles.topLeftTop}>
              <Image src={thumbnail} alt="Thumbnail" width={160} className={styles.thumbnail} />
              <div>
                <Heading level={1} data-size="sm" className={styles.heading}>
                  {data.title}
                </Heading>
                <Paragraph>{data.description}</Paragraph>
              </div>
            </div>

            <div className={styles.topLeftBottom}>
              <div className={styles.actionCards}>
                {hasCoverageDownloads ? (
                  <CoverageDownloadButtons links={coverageDownloads} />
                ) : (
                  hasFeature && (
                    <Card asChild data-variant="tinted" data-color="accent" className={styles.objectCard}>
                      <NextLink href={`/collections/${data.id}/items`}>
                        <PackageFillIcon title="a11y-title" fontSize="36px" />
                        <span>Vis objekter i datasettet</span>
                        <ChevronRightIcon title="a11y-title" fontSize="36px" />
                      </NextLink>
                    </Card>
                  )
                )}

                {hasTiles && (
                  <Card asChild data-variant="tinted" data-color="accent" className={styles.objectCard}>
                    <NextLink href={`/collections/${data.id}/tiles`}>
                      <SquareGridFillIcon title="a11y-title" fontSize="36px" />
                      <span>Vis fliser</span>
                      <ChevronRightIcon title="a11y-title" fontSize="36px" />
                    </NextLink>
                  </Card>
                )}

                {hasMap && (
                  <Card asChild data-variant="tinted" data-color="accent" className={styles.objectCard}>
                    <NextLink href={`/collections/${data.id}/map`}>
                      <LayersFillIcon title="a11y-title" fontSize="36px" />
                      <span>Vis kart</span>
                      <ChevronRightIcon title="a11y-title" fontSize="36px" />
                    </NextLink>
                  </Card>
                )}
              </div>

              {/* <Link href={geonorgeLink.href} target="_blank" className={styles.geonorgeLink}>Vis datasettet på Geonorge</Link> */}

              {!hasCoverageDownloads && (
                <DownloadPanel collectionId={collection} downloadConfig={data.downloadConfig} />
              )}
            </div>
          </div>
          <div className={styles.right}>
            <div className={styles.map}>
              <Heading data-size="2xs">Geografisk utstrekning av datasettet</Heading>

              <div className={styles.wrapper}>
                <CollectionMapImage featureCollection={featureCollection} />
              </div>
            </div>

            <DatasetInfoCard
              collection={data}
              metadata={data.metadata}
              hasFeature={hasFeature}
              hasMap={hasMap}
              hasCoverage={hasCoverage}
              hasTiles={hasTiles}
            />
          </div>
        </div>
      </div>
    </>
  );
}
