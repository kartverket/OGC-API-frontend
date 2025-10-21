import { Card, CardBlock, Heading, Link } from '@digdir/designsystemet-react';
import { InformationSquareIcon } from '@navikt/aksel-icons';
import styles from './DatasetInfoCard.module.scss';


export default function DatasetInfoCard() {
    return (
        <Card className={styles.datasetInfoCard}>
            <CardBlock className={styles.cardBlock}>
                <div className={styles.heading}>
                    <InformationSquareIcon title="a11y-title" fontSize="24px" />
                    <Heading data-size="2xs">Info om datasettet</Heading>
                </div>

                <div className={styles.info}>
                    <div>
                        <div className={styles.label}>Tilbyder</div>
                        <div className={styles.value}>Kartverket</div>
                    </div>
                    <div>
                        <div className={styles.label}>Vilkår for bruk</div>
                        <div className={styles.value}>
                            <Link href="https://creativecommons.org/licenses/by/4.0" target="_blank">creativecommons.org/licenses/by/4.0</Link>
                        </div>
                    </div>
                    <div>
                        <div className={styles.label}>Lisens</div>
                        <div className={styles.value}>CC-BY 4.0 License</div>
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
                    <div >
                        <div className={styles.label}>Nøkkelattributter</div>
                        <div className={styles.keywords}>
                            <span>Fylkesgrenser</span>
                            <span>Kommunegrenser</span>
                        </div>
                    </div>
                </div>

                {/* <div className={styles.contactInfo}>
                        <Card>
                            <u-details class="ds-details" data-variant="default" role="group">
                                <u-summary aria-expanded="false" role="button" slot="summary" tabindex="0">Kontaktinfo</u-summary>

                                <div className={styles.details}>
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
                            </u-details>
                        </Card>
                    </div> */}
            </CardBlock>
        </Card>
    )
}