'use client'

import { useState } from 'react';
import { Button, Card } from '@digdir/designsystemet-react';
import { DownloadIcon, PackageFillIcon, ChevronRightIcon } from '@navikt/aksel-icons';
import styles from './page.module.css';

function getDownloadFilename(link) {
    return link.filename || 'coverage.json';
}

async function downloadLink(href, filename) {
    const response = await fetch(href, {
        headers: {
            Accept: '*/*',
        },
    });

    if (!response.ok) {
        throw new Error(`Nedlasting feilet (${response.status})`);
    }

    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    setTimeout(() => URL.revokeObjectURL(url), 5000);
}

export default function CoverageDownloadButtons({ links }) {
    const [busyHref, setBusyHref] = useState('');

    return links.map((link) => {
        const filename = getDownloadFilename(link);
        const label = link.label;
        const busy = busyHref === link.href;

        return (
            <Card key={link.href} className={styles.objectCard} data-variant="tinted" data-color="accent">
                <Button
                    onClick={async () => {
                        setBusyHref(link.href);
                        try {
                            await downloadLink(link.href, filename);
                        } finally {
                            setBusyHref('');
                        }
                    }}
                    disabled={busy}
                    className={styles.coverageDownloadButton}
                >
                    <DownloadIcon title="a11y-title" fontSize="36px" />
                    <span>{busy ? 'Laster ned…' : label}</span>
                    <ChevronRightIcon title="a11y-title" fontSize="36px" />
                </Button>
            </Card>
        );
    });
}