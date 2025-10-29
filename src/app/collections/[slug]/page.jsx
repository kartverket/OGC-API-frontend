import Image from 'next/image';
import NextLink from 'next/link';
import { fetchCollection } from '@/utils/api';
import { Card, Heading, Link, Paragraph } from '@digdir/designsystemet-react';
import { Breadcrumbs, ExampleUseCard, Map, MapImage } from '@/components';
import thumbnail from '@/assets/gfx/collection-thumbnail.png';
import styles from './page.module.scss';
import { ChevronRightIcon, PackageFillIcon } from '@navikt/aksel-icons';
import { bboxToFeatureCollection } from './helpers';


export default async function Collection({ params }) {
    const { slug } = await params;
    const data = await fetchCollection(slug)
    const geonorgeLink = data.links.find(link => link.rel === 'related');
    const bbox = data.extent.spatial.bbox[0];
    const featureCollection = bboxToFeatureCollection(bbox);

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
                                <Heading level={1} data-size="sm" className={styles.heading}>{data.title}</Heading>
                                <Paragraph>{data.description}</Paragraph>
                            </div>
                        </div>

                        <div className={styles.topLeftBottom}>
                            <Card asChild data-variant="tinted" data-color="accent" className={styles.objectCard}>
                                <NextLink href={`/collections/${data.id}/items`}>
                                    <PackageFillIcon title="a11y-title" fontSize="36px" />

                                    <span>Vis objekter i datasettet</span>

                                    <ChevronRightIcon title="a11y-title" fontSize="36px" />
                                </NextLink>
                            </Card>

                            <Link href={geonorgeLink.href} target="_blank">Vis datasettet på Geonorge</Link>
                        </div>
                    </div>
                    <div className={styles.right}>
                        <div className={styles.map}>
                            <Heading data-size="2xs" level={4}>Geografisk utstrekning av datasettet</Heading>

                            <div className={styles.wrapper}>
                                <MapImage
                                    featureCollection={featureCollection}
                                    options={{
                                        width: 240,
                                        height: 320,
                                        padding: [6, 6, 6, 6],
                                        constrainResolution: false
                                    }}
                                />
                            </div>
                        </div>
                    </div>
                </div>
                <div>
                    <ExampleUseCard collection={slug} />
                </div>
            </div>
        </>
    );
}
