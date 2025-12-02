'use client'

import NextLink from 'next/link';
import { useEffect, useState } from 'react';
import { Button, Card, CardBlock, Divider, Heading, Label, Link } from '@digdir/designsystemet-react';
import { ArrowRightIcon, DownloadIcon, TerminalIcon } from '@navikt/aksel-icons';
import CopyIcon from '@/assets/gfx/icon-copy.svg';
import styles from './DeveloperCard.module.scss';


export default function DeveloperCard() {
    const [origin, setOrigin] = useState('');

    useEffect(() => {
        if (typeof window !== 'undefined') {
            setOrigin(window.location.origin);
        }
    }, []);

    async function copyUrl() {
        await navigator.clipboard.writeText(origin);
    }

    return (
        <Card className={styles.developerCard}>
            <CardBlock className={styles.cardBlock}>
                <div className={styles.heading}>
                    <TerminalIcon title="a11y-title" fontSize="24px" />
                    <Heading data-size="2xs">Ta i bruk datasettet</Heading>
                </div>

                <div className={styles.urlCopy}>
                    <div className={styles.url}>{origin}</div>

                    <button
                        onClick={copyUrl}
                        aria-label="Kopier URL"
                    >
                        <CopyIcon title="a11y-title" width="28px" />
                    </button>
                </div>

                <div className={styles.links}>
                    <Link asChild>
                        <NextLink href={`/openapi?f=html`} target="_blank">
                            Swagger UI
                            <ArrowRightIcon title="a11y-title" fontSize="28px" />
                        </NextLink>
                    </Link>
                    <Link asChild>
                        <NextLink href={`/openapi?f=html`} target="_blank">
                            ReDoc
                            <ArrowRightIcon title="a11y-title" fontSize="28px" />
                        </NextLink>
                    </Link>
                    <Link asChild>
                        <NextLink href={`/openapi?f=json`} target="_blank">
                            OpenAPI Document
                            <ArrowRightIcon title="a11y-title" fontSize="28px" />
                        </NextLink>
                    </Link>
                    <Link asChild>
                        <NextLink href={`/conformance?f=html`} target="_blank">
                            Conformance
                            <ArrowRightIcon title="a11y-title" fontSize="28px" />
                        </NextLink>
                    </Link>
                </div>

                <Divider />

                <div className={styles.downloadButtons}>
                    <div className={styles.text}>Last ned datasett</div>

                    <div className={styles.buttonRow}>
                        <Button variant="secondary" data-size="sm">
                            <DownloadIcon aria-hidden fontSize="1.5rem" />
                            GeoJSON
                        </Button>

                        <Button variant="secondary" data-size="sm">
                            <DownloadIcon aria-hidden fontSize="1.5rem" />
                            GPKG
                        </Button>

                        <Button variant="secondary" data-size="sm">
                            <DownloadIcon aria-hidden fontSize="1.5rem" />
                            GML
                        </Button>
                    </div>
                </div>
            </CardBlock >
        </Card >
    );
}