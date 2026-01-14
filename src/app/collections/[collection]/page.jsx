import Image from 'next/image';
import NextLink from 'next/link';
import { createMetadata, fetchData } from './helpers';
import { Card, Heading, Paragraph } from '@digdir/designsystemet-react';
import { Breadcrumbs, DatasetInfoCard, ExampleUseCard } from '@/components';
import { ChevronRightIcon, PackageFillIcon } from '@navikt/aksel-icons';
import thumbnail from '@/assets/gfx/collection-thumbnail.png';
import styles from "./page.module.css";


export const generateMetadata = async ({ params }) => createMetadata(params);

export default async function Collection({ params }) {
    const { collection } = await params;
    const { data, status } = await fetchData(collection);

    if (status !== 200) {
        return <ErrorPage status={status} />;
    }

    return (
        <>
            <Breadcrumbs
                breadcrumbs={{
                    '/': 'Administrative enheter',
                    '/collections': 'Collections',
                    [`/collections/${data.id}`]: data.title
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

                            {/* <Link href={geonorgeLink.href} target="_blank" className={styles.geonorgeLink}>Vis datasettet på Geonorge</Link> */}

                            <ExampleUseCard collection={collection} />
                        </div>
                    </div>
                    <div className={styles.right}>
                        <DatasetInfoCard collection={data} />
                    </div>
                </div>  
            </div>
        </>
    );
}
