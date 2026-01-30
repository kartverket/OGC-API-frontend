import Image from 'next/image';
import NextLink from 'next/link';
import { fetchHomePageData } from '@/services/pageData';
import { createHomeMetadata } from '@/services/pageMetadata';
import { Card, CardBlock, Heading, Paragraph } from '@digdir/designsystemet-react';
import { ChevronRightIcon, PackageFillIcon } from '@navikt/aksel-icons';
import { ServiceInfoCard, DeveloperCard, ErrorPage } from '@/components';
import ThumbnailImg from '@/assets/gfx/dataset-thumbnail.png';
import styles from './page.module.css';

// Force runtime reading (needed for config file access)
export const dynamic = 'force-dynamic';

export const generateMetadata = async () => createHomeMetadata();

export default async function Home() {
    const { data, status } = await fetchHomePageData();

    if (status !== 200) {
        return <ErrorPage status={status} />;
    }

    return (
        <div className={styles.page}>
            <div className={styles.top}>
                <div>
                    <Heading level={1} data-size="sm">{data.title}</Heading>
                    <Paragraph data-size="sm">{data.description}</Paragraph>
                </div>

        <Image src={ThumbnailImg} height="136" alt="Thumbnail" />
      </div>

      <div className={styles.main}>
        <div className={styles.left}>
          <Card
            asChild
            data-variant="tinted"
            data-color="accent"
            className={styles.collectionsCard}
          >
            <NextLink href="/collections">
              <CardBlock className={styles.cardBlock}>
                <PackageFillIcon title="a11y-title" fontSize="36px" />

                                <div className={styles.content}>
                                    <Paragraph data-size="sm" className={styles.title}>
                                        Bla gjennom datasettet
                                    </Paragraph>
                                    <Paragraph data-size="xs">
                                        Bla gjennom de {data.collectionCount} collections som datasettet inneholder
                                    </Paragraph>
                                </div>

                                <ChevronRightIcon title="a11y-title" fontSize="36px" />
                            </CardBlock>
                        </NextLink>
                    </Card>

                    <DeveloperCard />
                </div>

                <div className={styles.right}>
                    <ServiceInfoCard metadata={data.metadata} />
                </div>
            </div>
        </div>
    );
}
