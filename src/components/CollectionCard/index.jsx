import Image from 'next/image';
import NextLink from 'next/link';
import { Card, Heading, Link } from '@digdir/designsystemet-react';
import { ArrowRightIcon, ChevronRightIcon } from '@navikt/aksel-icons';
import thumbnail from '@/assets/gfx/collection-thumbnail.png';
import styles from './CollectionCard.module.scss';
import { getCrsCode } from '@/utils/map/helpers';


export default function CollectionCard({ collection }) {
    return (
        <Card className={styles.card}>
            <div className={styles.cardContent}>
                <NextLink
                    href={`/collections/${collection.id}/items`}
                    className={styles.thumbnail}
                >
                    <Image
                        src={thumbnail}
                        alt="Thumbnail"
                        width={175}
                    />
                </NextLink>

                <div className={styles.content}>
                    <div className={styles.top}>
                        <div className={styles.left}>
                            <Link asChild>
                                <NextLink href={`/collections/${collection.id}/items`}>
                                    <Heading
                                        level={2}
                                        data-size="xs"
                                        className={styles.title}
                                    >
                                        {collection.title}
                                    </Heading>

                                    <ChevronRightIcon fontSize="24px" />
                                </NextLink>
                            </Link>
                            {
                                collection.itemCount && (
                                    <span className={`${styles.itemCount} ${styles.tag}`}>{collection.itemCount} features</span>
                                )
                            }
                        </div>

                        <div className={styles.updated}>
                            <div className={styles.label}>Oppdatert</div>
                            <div className={styles.value}>21.10.2025</div>
                        </div>
                    </div>

                    <div className={styles.middle}>
                        <div className={styles.description}>{collection.description}</div>
                        <div className={styles.divider}></div>
                        <div className={styles.metadata}>
                            <div>
                                <div className={styles.label}>Koordinatsystem</div>
                                <div className={styles.value}>{getCrsCode(collection.storageCrs)}</div>
                            </div>
                        </div>
                    </div>

                    <div className={styles.bottom}>
                        <div className={styles.left}>
                            <span className={`${styles.itemType} ${styles.tag}`}>{collection.itemType}</span>

                            <div className={styles.keywords}>
                                {
                                    collection.keywords.map(keyword => (
                                        <span key={keyword} className={styles.tag}>{keyword}</span>
                                    ))
                                }
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