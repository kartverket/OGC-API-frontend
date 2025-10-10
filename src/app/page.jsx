import NextLink from 'next/link';
import { fetchCollections, fetchHome } from '@/utils/api';
import { Card, CardBlock, Heading, Link, Paragraph } from '@digdir/designsystemet-react';
import { ChevronRightIcon, InformationSquareIcon, PackageFillIcon } from '@navikt/aksel-icons';
import { DeveloperCard } from '@/components';
import styles from './page.module.scss';

// export const dynamic = "force-dynamic";

async function fetchPageData() {
    const responses = await Promise.all([fetchHome(), fetchCollections()]);

    return {
        ...responses[0],
        collectionCount: responses[1].collections.length
    };
}

export default async function Home() {
    const page = await fetchPageData()

    return (
        <div className={styles.container}>
            <div className={styles.top}>
                <Heading data-size="sm">{page.title}</Heading>
                <Paragraph data-size="sm">{page.description}</Paragraph>
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
                    <Card className={styles.datasetInfoCard}>
                        <CardBlock className={styles.cardBlock}>
                            <div className={styles.heading}>
                                <InformationSquareIcon title="a11y-title" fontSize="24px" />
                                <Heading data-size="2xs">Info om datasettet</Heading>
                            </div>

                            <div className={styles.info}>
                                <div>
                                    <div className={styles.label}>Tilbyder</div>
                                    <div className={styles.label}>Kartverket</div>
                                </div>
                                <div>
                                    <div className={styles.label}>Vilkår for bruk</div>
                                    <div className={styles.label}>
                                        <Link href="https://creativecommons.org/licenses/by/4.0" target="_blank">creativecommons.org</Link>
                                    </div>
                                </div>
                                <div>
                                    <div className={styles.label}>Lisens</div>
                                    <div className={styles.label}>CC-BY 4.0 License</div>
                                </div>
                                <div>
                                    <div className={styles.label}>Dekning</div>
                                    <div className={styles.label}>Hele Norge</div>
                                </div>
                                <div >
                                    <div className={styles.label}>Oppdateres</div>
                                    <div className={styles.label}>Etter behov</div>
                                </div>
                            </div>
                        </CardBlock>
                    </Card>
                </div>
            </div>
        </div>
    );
}
