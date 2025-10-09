'use client'

import NextLink from 'next/link';
import { Card, CardBlock, Heading, Link } from '@digdir/designsystemet-react';
import { ArrowRightIcon, TerminalIcon } from '@navikt/aksel-icons';
import { API_BASE_URL, DATASET_URL } from '@/config/constants.client';
import CopyIcon from '@/assets/gfx/icon-copy.svg';
import styles from './DeveloperCard.module.scss';


export default function DeveloperCard() {
    async function copyUrl() {
        await navigator.clipboard.writeText(DATASET_URL);
    }

    return (
        <Card className={styles.developerCard}>
            <CardBlock className={styles.cardBlock}>
                <div className={styles.heading}>
                    <TerminalIcon title="a11y-title" fontSize="24px" />
                    <Heading data-size="2xs">Ta i bruk datasettet</Heading>
                </div>
                
                <div className={styles.urlCopy}>
                    <div className={styles.url}>{DATASET_URL}</div>

                    <button
                        onClick={copyUrl}
                        aria-label="Kopier URL"
                    >
                        <CopyIcon title="a11y-title" width="28px" />
                    </button>
                </div>

                <div className={styles.links}>
                    <Link asChild>
                        <NextLink href={`${API_BASE_URL}/openapi?f=html`} target="_blank">
                            Swagger UI
                            <ArrowRightIcon title="a11y-title" fontSize="28px" />
                        </NextLink>
                    </Link>
                    <Link asChild>
                        <NextLink href={`${API_BASE_URL}/openapi?f=html`} target="_blank">
                            ReDoc
                            <ArrowRightIcon title="a11y-title" fontSize="28px" />
                        </NextLink>
                    </Link>
                    <Link asChild>
                        <NextLink href={`${API_BASE_URL}/openapi?f=json`} target="_blank">
                            OpenAPI Document
                            <ArrowRightIcon title="a11y-title" fontSize="28px" />
                        </NextLink>
                    </Link>
                    <Link asChild>
                        <NextLink href={`${API_BASE_URL}/conformance?f=html`} target="_blank">
                            Conformance
                            <ArrowRightIcon title="a11y-title" fontSize="28px" />
                        </NextLink>
                    </Link>
                </div>
            </CardBlock >
        </Card >
    );
}