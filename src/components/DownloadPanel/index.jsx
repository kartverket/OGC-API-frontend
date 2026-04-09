'use client'

import { useEffect, useState } from 'react';
import { Button, Card, CardBlock, Field, Heading, Label, Select } from '@digdir/designsystemet-react';
import { DownloadIcon } from '@navikt/aksel-icons';
import { useApiBaseUrlSWR } from '@/config/apiConfig.swr';
import styles from './DownloadPanel.module.css';

export default function DownloadPanel({ collectionId, downloadConfig }) {
    const { apiBaseUrl } = useApiBaseUrlSWR();
    const areaFilters = downloadConfig?.area_filters ?? [];

    const formatOptions = [
        { value: 'gpkg-full', label: 'GeoPackage – hele samlingen' },
        { value: 'csv-full', label: 'CSV – hele samlingen' },
        ...areaFilters.flatMap(f => [
            { value: `gpkg-${f.type}`, label: `GeoPackage – filtrert etter ${f.label.toLowerCase()}` },
            { value: `csv-${f.type}`, label: `CSV – filtrert etter ${f.label.toLowerCase()}` },
        ]),
    ];

    const [format, setFormat] = useState(formatOptions[0].value);
    const [areaNames, setAreaNames] = useState([]);
    const [areaName, setAreaName] = useState('');
    const [areaLoading, setAreaLoading] = useState(false);
    const [busy, setBusy] = useState(false);
    const [progress, setProgress] = useState(0);
    const [status, setStatus] = useState(null); // { type: 'info'|'success'|'error', message }

    const [formatBase, formatScope] = format.split('-');
    const activeFilter = formatScope !== 'full'
        ? areaFilters.find(f => f.type === formatScope)
        : null;

    useEffect(() => {
        if (!activeFilter || !apiBaseUrl) {
            setAreaNames([]);
            setAreaName('');
            return;
        }

        let cancelled = false;
        setAreaLoading(true);
        setAreaNames([]);
        setAreaName('');

        fetch(`${apiBaseUrl}/collections/${activeFilter.collection}/items?limit=500&f=json`)
            .then(r => r.json())
            .then(data => {
                if (cancelled) return;
                const names = [...new Set(
                    (data.features ?? [])
                        .map(f => f.properties?.[activeFilter.name_field])
                        .filter(Boolean)
                )].sort();
                setAreaNames(names);
                if (names.length > 0) setAreaName(names[0]);
            })
            .catch(() => { if (!cancelled) setAreaNames([]); })
            .finally(() => { if (!cancelled) setAreaLoading(false); });

        return () => { cancelled = true; };
    }, [activeFilter?.type, apiBaseUrl]);

    function handleFormatChange(e) {
        setFormat(e.target.value);
        setStatus(null);
        setProgress(0);
    }

    async function handleDownload() {
        if (!apiBaseUrl || busy) return;
        if (activeFilter && !areaName) return;

        setBusy(true);
        setProgress(5);
        setStatus({ type: 'info', message: 'Kobler til server…' });

        try {
            const processId = formatBase === 'gpkg' && formatScope === 'full'
                ? 'export-collection-gpkg'
                : formatBase === 'gpkg'
                ? 'export-by-area-gpkg'
                : 'export-collection-csv';

            const inputs = activeFilter
                ? { collection_id: collectionId, area_type: formatScope, area_name: areaName }
                : { collection_id: collectionId };

            setStatus({ type: 'info', message: 'Sender eksportjobb…' });

            const execResp = await fetch(`${apiBaseUrl}/processes/${processId}/execution`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Prefer': 'respond-async' },
                body: JSON.stringify({ inputs }),
            });

            let fileResp;
            if (execResp.status === 200 || execResp.status === 201) {
                setProgress(90);
                setStatus({ type: 'info', message: 'Behandler…' });
                fileResp = execResp;
            } else {
                const body = await execResp.json().catch(() => null);
                if (!body?.jobID) throw new Error(`Uventet svar ${execResp.status}`);
                const jobUrl = `${apiBaseUrl}/jobs/${body.jobID}`;
                const resultUrl = `${apiBaseUrl}/jobs/${body.jobID}/results`;
                setStatus({ type: 'info', message: 'Eksport kjører – vennligst vent…' });
                fileResp = await pollJob(jobUrl, resultUrl, p => setProgress(10 + p * 0.85));
            }

            if (!fileResp.ok) throw new Error(`Serverfeil: ${fileResp.status}`);

            setProgress(98);
            setStatus({ type: 'info', message: 'Forbereder nedlasting…' });
            const blob = await fileResp.blob();
            const ext = formatBase === 'gpkg' ? 'gpkg' : 'csv';
            const suffix = areaName ? `_${formatScope}_${areaName.replace(/\s+/g, '_')}` : '';
            triggerDownload(blob, `${collectionId}${suffix}.${ext}`);

            setProgress(100);
            setStatus({ type: 'success', message: 'Nedlasting fullført.' });
        } catch (err) {
            setStatus({ type: 'error', message: err.message });
            setProgress(0);
        } finally {
            setBusy(false);
        }
    }

    return (
        <Card className={styles.panel}>
            <CardBlock className={styles.cardBlock}>
                <div className={styles.heading}>
                    <DownloadIcon title="a11y-title" fontSize="24px" />
                    <Heading data-size="2xs">Last ned datasett</Heading>
                </div>

                <div className={styles.controls}>
                    <Field>
                        <Label htmlFor="dl-format" data-size="sm">Format</Label>
                        <Select
                            id="dl-format"
                            value={format}
                            onChange={handleFormatChange}
                            data-size="sm"
                            disabled={busy}
                        >
                            {formatOptions.map(opt => (
                                <Select.Option key={opt.value} value={opt.value}>{opt.label}</Select.Option>
                            ))}
                        </Select>
                    </Field>

                    {activeFilter && (
                        <Field>
                            <Label htmlFor="dl-area" data-size="sm">{activeFilter.label}</Label>
                            <Select
                                id="dl-area"
                                value={areaName}
                                onChange={e => setAreaName(e.target.value)}
                                data-size="sm"
                                disabled={busy || areaLoading || areaNames.length === 0}
                            >
                                {areaLoading
                                    ? <Select.Option value="">Laster…</Select.Option>
                                    : areaNames.map(n => <Select.Option key={n} value={n}>{n}</Select.Option>)
                                }
                            </Select>
                        </Field>
                    )}

                    <Button
                        onClick={handleDownload}
                        data-size="sm"
                        disabled={busy || !apiBaseUrl || (activeFilter && (areaLoading || !areaName))}
                    >
                        <DownloadIcon aria-hidden fontSize="1.2rem" />
                        {busy ? 'Laster ned…' : 'Last ned'}
                    </Button>
                </div>

                {progress > 0 && progress < 100 && (
                    <div className={styles.progressBar}>
                        <div className={styles.progressFill} style={{ width: `${progress}%` }} />
                    </div>
                )}

                {status && (
                    <div className={`${styles.status} ${styles[`status--${status.type}`]}`}>
                        {status.message}
                    </div>
                )}
            </CardBlock>
        </Card>
    );
}

async function pollJob(jobUrl, resultUrl, onProgress) {
    const deadline = Date.now() + 5 * 60 * 1000;
    while (Date.now() < deadline) {
        await new Promise(r => setTimeout(r, 1500));
        const resp = await fetch(jobUrl);
        if (!resp.ok) throw new Error(`Jobbstatussjekk feilet (${resp.status})`);
        const job = await resp.json();
        onProgress(job.progress ?? (job.status === 'running' ? 50 : 0));
        if (job.status === 'successful') return fetch(resultUrl);
        if (job.status === 'failed') throw new Error(job.message || 'Prosessen feilet');
    }
    throw new Error('Tidsavbrutt etter 5 minutter.');
}

function triggerDownload(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 5000);
}
