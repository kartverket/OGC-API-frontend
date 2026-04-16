import { Card, Heading, Paragraph } from "@digdir/designsystemet-react";
import {
  ChevronRightIcon,
  LayersFillIcon,
  PackageFillIcon,
} from "@navikt/aksel-icons";
import Image from "next/image";
import NextLink from "next/link";
import thumbnail from "@/assets/gfx/collection-thumbnail.png";
import {
  Breadcrumbs,
  DatasetInfoCard,
  DownloadPanel,
  ErrorPage,
  ExampleUseCard,
} from "@/components";
import { collectionHasMapProvider } from "@/config/readPygeoapiConfig";
import { fetchCollectionPageData } from "@/services/pageData";
import { createCollectionMetadata } from "@/services/pageMetadata";
import styles from "./page.module.css";

// Force runtime reading (needed for config file access)
export const dynamic = "force-dynamic";

export async function generateMetadata({ params }) {
  const { collection } = await params;
  return createCollectionMetadata(collection);
}

export default async function Collection({ params }) {
  const { collection } = await params;
  const { data, status } = await fetchCollectionPageData(collection);

  if (status !== 200) {
    return <ErrorPage status={status} />;
  }

  const hasMap = collectionHasMapProvider(collection);

  return (
    <>
      <Breadcrumbs
        breadcrumbs={{
          "/": data.dataset.title,
          "/collections": "Collections",
          [`/collections/${data.id}`]: data.title,
        }}
      />
      <div className={styles.page}>
        <div className={styles.top}>
          <div className={styles.left}>
            <div className={styles.topLeftTop}>
              <Image
                src={thumbnail}
                alt="Thumbnail"
                width={160}
                className={styles.thumbnail}
              />
              <div>
                <Heading level={1} data-size="sm" className={styles.heading}>
                  {data.title}
                </Heading>
                <Paragraph>{data.description}</Paragraph>
              </div>
            </div>

            <div className={styles.topLeftBottom}>
              <div className={styles.actionCards}>
                <Card
                  asChild
                  data-variant="tinted"
                  data-color="accent"
                  className={styles.objectCard}
                >
                  <NextLink href={`/collections/${data.id}/items`}>
                    <PackageFillIcon title="a11y-title" fontSize="36px" />
                    <span>Vis objekter i datasettet</span>
                    <ChevronRightIcon title="a11y-title" fontSize="36px" />
                  </NextLink>
                </Card>

                {hasMap && (
                  <Card
                    asChild
                    data-variant="tinted"
                    data-color="accent"
                    className={styles.objectCard}
                  >
                    <NextLink href={`/collections/${data.id}/map`}>
                      <LayersFillIcon title="a11y-title" fontSize="36px" />
                      <span>Vis kart</span>
                      <ChevronRightIcon title="a11y-title" fontSize="36px" />
                    </NextLink>
                  </Card>
                )}
              </div>

              {/* <Link href={geonorgeLink.href} target="_blank" className={styles.geonorgeLink}>Vis datasettet på Geonorge</Link> */}

              <ExampleUseCard collection={collection} hasMap={hasMap} />
              <DownloadPanel collectionId={collection} downloadConfig={data.downloadConfig} />
            </div>
          </div>
          <div className={styles.right}>
            <DatasetInfoCard
              collection={data}
              metadata={data.metadata}
              hasMap={hasMap}
            />
          </div>
        </div>
      </div>
    </>
  );
}
