'use client'

import { Card, Heading } from '@digdir/designsystemet-react';
import { TerminalIcon } from '@navikt/aksel-icons';
import { getApiBaseUrl } from '@/config/apiConfig';
import CopyIcon from '@/assets/gfx/icon-copy.svg';
import styles from './ExampleUseCard.module.css';
import { Fragment } from 'react';

export default function ExampleUseCard({ collection }) {
    async function copyUrl(url) {
        await navigator.clipboard.writeText(url);
    }

    const apiBaseUrl = getApiBaseUrl();
    const examples = {
        'QGIS': `${apiBaseUrl}/collections/${collection}/items?f=json`,
        'ArcGIS Online': `${apiBaseUrl}/collections/${collection}/items`
    };

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
                            >
                                <CopyIcon title="a11y-title" width="28px" />
                            </button>
                        </Fragment>
                    ))
                }
            </div>
        </Card >
    );
}