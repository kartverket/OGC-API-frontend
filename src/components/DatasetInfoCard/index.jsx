import { getCrsCode } from '@/utils/map/helpers';
import { Card, Heading, Link, ListUnordered, ListItem } from '@digdir/designsystemet-react';
import { Details, DetailsContent, DetailsSummary } from '..';
import { InformationSquareIcon } from '@navikt/aksel-icons';
import styles from './DatasetInfoCard.module.css';

export default function DatasetInfoCard({ collection, metadata }) {
    return (
        <Card className={styles.datasetInfoCard}>
            <div className={styles.heading}>
                <InformationSquareIcon title="a11y-title" fontSize="24px" />
                <Heading data-size="2xs">Info om datasett {collection.title}</Heading>
            </div>

            <div className={styles.info}>
                <div>
                    <div className={styles.label}>Tjenestetype</div>
                    <div className={styles.value} style={{ textTransform: 'capitalize' }}>{collection.itemType}</div>
                </div>
                <div>
                    <div className={styles.label}>Antall objekter (items)</div>
                    <div className={styles.value}>{collection.itemCount}</div>
                </div>
                <div>
                    <div className={styles.label}>Tilbyder</div>
                    <div className={styles.value}>{metadata?.provider?.name || 'Kartverket'}</div>
                </div>
            </div>

            <div>
                <Card data-color="accent">
                    <Details>
                        <DetailsSummary>Kontaktinfo</DetailsSummary>
                        <DetailsContent>
                            <div className={styles.contactInfo}>
                                <div>
                                    <div className={styles.label}>URL</div>
                                    <div className={styles.value}>
                                        <Link href={metadata?.contact?.url || 'https://www.kartverket.no'}>
                                            {metadata?.contact?.url || 'https://www.kartverket.no'}
                                        </Link>
                                    </div>
                                </div>
                                <div>
                                    <div className={styles.label}>E-post</div>
                                    <div className={styles.value}>
                                        <Link href={`mailto:${metadata?.contact?.email || 'post@kartverket.no'}`}>
                                            {metadata?.contact?.email || 'post@kartverket.no'}
                                        </Link>
                                    </div>
                                </div>
                                <div>
                                    <div className={styles.label}>Kontakt-URL</div>
                                    <div className={styles.value}>
                                        <Link href={metadata?.contact?.contactUrl || 'https://www.kartverket.no/om-kartverket/kontakt-oss'}>
                                            {metadata?.contact?.contactUrl || 'https://www.kartverket.no/om-kartverket/kontakt-oss'}
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        </DetailsContent>
                    </Details>
                    <Details>
                        <DetailsSummary>Koordinatsystemer</DetailsSummary>
                        <DetailsContent className={styles.detailsContent}>
                            <ListUnordered data-size="sm">
                                {
                                    collection.crs.map(crs => {
                                        const crsCode = getCrsCode(crs);
                                        return <ListItem key={crsCode}>{crsCode}</ListItem>
                                    })
                                }
                            </ListUnordered>
                        </DetailsContent>
                    </Details>
                    <Details>
                        <DetailsSummary>Storage CRS</DetailsSummary>
                        <DetailsContent className={styles.detailsContent}>{getCrsCode(collection.storageCrs)}</DetailsContent>
                    </Details>
                </Card>
            </div>
        </Card>
    )
}