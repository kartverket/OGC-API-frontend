import { getCrsCode } from '@/utils/map/helpers';
import { Card, Heading, Link, ListUnordered, ListItem } from '@digdir/designsystemet-react';
import { Details, DetailsContent, DetailsSummary } from '..';
import { InformationSquareIcon } from '@navikt/aksel-icons';
import styles from './DatasetInfoCard.module.scss';


export default function DatasetInfoCard({ collection }) {
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
                    <div className={styles.value}>Kartverket</div>
                </div>
                <div>
                    <div className={styles.label}>Dekning</div>
                    <div className={styles.value}>Hele Norge</div>
                </div>
                <div >
                    <div className={styles.label}>Oppdateringsfrekvens</div>
                    <div className={styles.value}>Etter behov</div>
                </div>
                <div >
                    <div className={styles.label}>Sist oppdatert</div>
                    <div className={styles.value}>14.10.2025</div>
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
                                        <Link href="https://www.kartverket.no">https://www.kartverket.no</Link>
                                    </div>
                                </div>
                                <div>
                                    <div className={styles.label}>E-post</div>
                                    <div className={styles.value}>
                                        <Link href="mailto:post@kartverket.no">post@kartverket.no</Link>
                                    </div>
                                </div>
                                <div>
                                    <div className={styles.label}>Telefon</div>
                                    <div className={styles.value}>
                                        <Link href="tel:32 11 80 00">32 11 80 00</Link>
                                    </div>
                                </div>
                                <div>
                                    <div className={styles.label}>Kontakt-URL</div>
                                    <div className={styles.value}>
                                        <Link href="https://www.kartverket.no/om-kartverket/kontakt-oss">https://www.kartverket.no/om-kartverket/kontakt-oss</Link>
                                    </div>
                                </div>
                                <div>
                                    <div className={styles.label}>Adresse</div>
                                    <div className={styles.value}>
                                        Karverksveien 21<br />
                                        3511 Hønefoss<br />
                                        Norge
                                    </div>
                                </div>
                                <div>
                                    <div className={styles.label}>Kontortid</div>
                                    <div className={styles.value}>
                                        Mandag - fredag: 09:00 - 15:00
                                    </div>
                                </div>
                                <div>
                                    <div className={styles.label}>Kontaktinstruksjoner:</div>
                                    <div className={styles.value}>
                                        Sentralbord fra 09:00
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