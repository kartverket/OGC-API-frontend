import Image from 'next/image';
import NextLink from 'next/link';
import { fetchCollections, fetchHome, fetchThumbnail } from '@/utils/api';
import { Card, CardBlock, Details, DetailsContent, DetailsSummary, Heading, Link, Paragraph } from '@digdir/designsystemet-react';
import { ChevronRightIcon, InformationSquareIcon, PackageFillIcon } from '@navikt/aksel-icons';
import { DatasetInfoCard, DeveloperCard } from '@/components';
import ThumbnailImg from '@/assets/gfx/dataset-thumbnail.png';
import styles from './page.module.scss';


async function fetchPageData() {
    const responses = await Promise.all([fetchHome(), fetchCollections(), /*fetchThumbnail()*/]);

    return {
        ...responses[0],
        collectionCount: responses[1].collections.length,
        // thumbnailUrl: responses[2]
    };
}

export default async function Home() {
    const page = await fetchPageData()

    return (
        <div className={styles.page}>
            <div className={styles.top}>
                <div>
                    <Heading level={1} data-size="sm">{page.title}</Heading>
                    <Paragraph data-size="sm">{page.description}</Paragraph>
                </div>

                <Image
                    src={ThumbnailImg}
                    height="136"
                    alt="Thumbnail"
                />
            </div>

            <div className={styles.main}>
                <div className={styles.left}>
                    <Card asChild data-variant="tinted" data-color="accent" className={styles.collectionsCard}>
                        <NextLink href="/collections">
                            <CardBlock className={styles.cardBlock}>
                                <PackageFillIcon title="a11y-title" fontSize="36px" />

                                <div className={styles.content}>
                                    <Paragraph data-size="sm" className={styles.title}>
                                        Bla gjennom datasettet
                                    </Paragraph>
                                    <Paragraph data-size="xs">
                                        Bla gjennom de {page.collectionCount} collections som datasettet inneholder
                                    </Paragraph>
                                </div>

                                <ChevronRightIcon title="a11y-title" fontSize="36px" />
                            </CardBlock>
                        </NextLink>
                    </Card>

                    <DeveloperCard />
                </div>

                <div className={styles.right}>
                    <DatasetInfoCard />
                </div>
            </div>
        </div>
    );
}
