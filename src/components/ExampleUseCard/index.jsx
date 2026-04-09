'use client'

import { Button, Card, Divider, Heading } from '@digdir/designsystemet-react';
import { DownloadIcon, TerminalIcon } from '@navikt/aksel-icons';
import { useApiBaseUrlSWR } from '@/config/apiConfig.swr';
import CopyIcon from '@/assets/gfx/icon-copy.svg';
import styles from './ExampleUseCard.module.css';
import { Fragment, useMemo } from 'react';

export default function ExampleUseCard({ collection, hasMap }) {
    async function copyUrl(url) {
        await navigator.clipboard.writeText(url);
    }

    const { apiBaseUrl } = useApiBaseUrlSWR();

    const examples = useMemo(
        () => {
            if (!apiBaseUrl) {
                return {};
            }

            return {
                'QGIS': `${apiBaseUrl}/collections/${collection}/items?f=json`,
                'ArcGIS Online': `${apiBaseUrl}/collections/${collection}/items`,
                ...(hasMap && {
                    'OGC API Maps': `${apiBaseUrl}/collections/${collection}/map?f=png`,
                }),
            };
        },
        [apiBaseUrl, collection, hasMap]
    );

    const downloads = useMemo(
        () => {
            if (!apiBaseUrl) return [];
            return [
                { label: 'GeoJSON', href: `${apiBaseUrl}/collections/${collection}/items?f=json` },
                { label: 'CSV', href: `${apiBaseUrl}/collections/${collection}/items?f=csv` },
                { label: 'GeoPackage', href: `${apiBaseUrl}/collections/${collection}/items?f=gpkg` },
            ];
        },
        [apiBaseUrl, collection]
    );

    return (
        <Card className={styles.developerCard}>
            <div className={styles.heading}>
                <TerminalIcon title="a11y-title" fontSize="24px" />
                <Heading data-size="2xs">Eksempler for bruk</Heading>
            </div>

            <div className={styles.examples}>
                {
                    Object.entries(examples).map(entry => (
                        <Fragment key={entry[0]}>
                            <span className={styles.client}>{entry[0]}</span>
                            <span className={styles.url}>{entry[1]}</span>

                            <button
                                onClick={() => copyUrl(entry[1])}
                                aria-label="Kopier URL"
                                disabled={!apiBaseUrl}
                            >
                                <CopyIcon title="a11y-title" width="28px" />
                            </button>
                        </Fragment>
                    ))
                }
            </div>
            <Divider />

            <div className={styles.downloads}>
                <div className={styles.downloadsLabel}>Last ned datasett</div>
                <div className={styles.downloadButtons}>
                    {downloads.map(({ label, href }) => (
                        <Button key={label} asChild variant="secondary" data-size="sm" disabled={!apiBaseUrl}>
                            <a href={href} target="_blank" rel="noopener noreferrer">
                                <DownloadIcon aria-hidden fontSize="1.5rem" />
                                {label}
                            </a>
                        </Button>
                    ))}
                </div>
            </div>
        </Card >
    );
}