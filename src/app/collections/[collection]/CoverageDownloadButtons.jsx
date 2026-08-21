'use client';

import { Button, Card } from '@digdir/designsystemet-react';
import { ChevronRightIcon, DownloadIcon } from '@navikt/aksel-icons';
import { useState } from 'react';
import styles from './page.module.css';

function getDownloadFilename(link) {
  return link.filename || 'coverage.json';
}

async function downloadLink(href, filename) {
  if (typeof href !== 'string' || href.trim().length === 0) {
    throw new Error('Nedlastingslenke mangler eller er ugyldig for denne ressursen.');
  }

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
  const [errorHref, setErrorHref] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  return links.map((link, index) => {
    const filename = getDownloadFilename(link);
    const label = link.label;
    const busy = busyHref === link.href;
    const hasError = errorHref === link.href;
    const key = link.href || `${label}-${index}`;

    return (
      <Card key={key} className={styles.objectCard} data-variant="tinted" data-color="accent">
        <Button
          onClick={async () => {
            setBusyHref(link.href);
            setErrorHref('');
            setErrorMessage('');
            try {
              await downloadLink(link.href, filename);
            } catch (err) {
              console.error('Nedlasting feilet:', err);
              setErrorHref(link.href);
              setErrorMessage(err instanceof Error ? err.message : 'Nedlasting feilet. Prøv igjen.');
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
        {hasError && <span role="alert">{errorMessage || 'Nedlasting feilet. Prøv igjen.'}</span>}
      </Card>
    );
  });
}
