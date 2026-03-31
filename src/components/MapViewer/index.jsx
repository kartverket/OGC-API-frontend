'use client'

import { useState } from 'react';
import { Card, Heading, Field, Label, Button, Select, Textfield } from '@digdir/designsystemet-react';
import { LayersFillIcon, DownloadIcon, FilesIcon } from '@navikt/aksel-icons';
import { getCrsCode } from '@/utils/map/helpers';
import styles from './MapViewer.module.css';

function buildMapUrl(apiBaseUrl, collectionId, { bbox, crs, width, height }) {
    const params = new URLSearchParams({
        f: 'png',
        width,
        height,
        bbox: bbox.join(','),
        crs,
    });
    return decodeURIComponent(`${apiBaseUrl}/collections/${collectionId}/map?${params}`);
}

function isGeographicCrs(crs) {
    const code = getCrsCode(crs);
    return code === 'OGC:CRS84' || code === 'EPSG:4326';
}

export default function MapViewer({ collectionId, defaultBbox, crsOptions, apiBaseUrl }) {
    const defaultCrs = crsOptions[0];
    const [crs, setCrs] = useState(defaultCrs);
    const [bbox, setBbox] = useState(defaultBbox.map(String));
    const [width, setWidth] = useState('800');
    const [height, setHeight] = useState('800');
    const [imageSrc, setImageSrc] = useState(
        buildMapUrl(apiBaseUrl, collectionId, { bbox: defaultBbox, crs: defaultCrs, width: 800, height: 800 })
    );
    const [isLoading, setIsLoading] = useState(true);

    const geographic = isGeographicCrs(crs);
    const bboxLabels = geographic
        ? ['Min lon', 'Min lat', 'Max lon', 'Max lat']
        : ['Min X', 'Min Y', 'Max X', 'Max Y'];

    async function handleDownload() {
        try {
            const response = await fetch(imageSrc);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            const blob = await response.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${collectionId}-kart.png`;
            a.click();
            URL.revokeObjectURL(url);
        } catch (err) {
            console.error('Download failed:', err);
        }
    }

    function handleUpdate() {
        const url = buildMapUrl(apiBaseUrl, collectionId, {
            bbox: bbox.map(Number),
            crs,
            width: Number(width),
            height: Number(height),
        });
        setIsLoading(true);
        setImageSrc(url);
    }

    return (
        <div className={styles.container}>
            <Card className={styles.controls}>
                <div className={styles.heading}>
                    <LayersFillIcon aria-hidden fontSize="24px" />
                    <Heading data-size="2xs">Kartparametre</Heading>
                </div>

                <div className={styles.fields}>
                    <Field id="map-crs-field">
                        <Label htmlFor="map-crs">Koordinatsystem (CRS)</Label>
                        <Select
                            id="map-crs"
                            value={crs}
                            onChange={e => setCrs(e.target.value)}
                        >
                            {crsOptions.map(c => (
                                <Select.Option key={c} value={c}>{getCrsCode(c)}</Select.Option>
                            ))}
                        </Select>
                    </Field>

                    <div>
                        <Label className={styles.groupLabel}>Bbox ({getCrsCode(crs)})</Label>
                        <div className={styles.bboxInputs}>
                            {bboxLabels.map((label, index) => (
                                <Textfield
                                    key={index}
                                    id={`map-bbox-${index}`}
                                    label={label}
                                    type="number"
                                    value={bbox[index]}
                                    onChange={e => {
                                        const next = [...bbox];
                                        next[index] = e.target.value;
                                        setBbox(next);
                                    }}
                                />
                            ))}
                        </div>
                    </div>

                    <div className={styles.sizeInputs}>
                        <Textfield
                            id="map-width"
                            label="Bredde (px)"
                            type="number"
                            value={width}
                            onChange={e => setWidth(e.target.value)}
                        />
                        <Textfield
                            id="map-height"
                            label="Høyde (px)"
                            type="number"
                            value={height}
                            onChange={e => setHeight(e.target.value)}
                        />
                    </div>
                </div>

                <Button
                    data-size="sm"
                    onClick={handleUpdate}
                    className={styles.updateButton}
                >
                    Oppdater kart
                </Button>
            </Card>

            <div className={styles.mapContainer}>
                <div className={styles.mapBox}>
                    {isLoading && <div className={styles.loading}>Laster kart…</div>}
                    <img
                        src={imageSrc}
                        alt="Kartvisning"
                        className={styles.map}
                        onLoad={() => setIsLoading(false)}
                        onError={() => setIsLoading(false)}
                    />
                </div>
                <div className={styles.urlRow}>
                    <span className={styles.url}>{imageSrc}</span>
                    <button
                        onClick={() => navigator.clipboard.writeText(imageSrc).catch(() => {})}
                        aria-label="Kopier URL"
                        className={styles.iconButton}
                    >
                        <FilesIcon aria-hidden fontSize="28px" />
                    </button>
                    <button
                        onClick={handleDownload}
                        aria-label="Last ned kart"
                        className={styles.iconButton}
                    >
                        <DownloadIcon aria-hidden fontSize="28px" />
                    </button>
                </div>
            </div>
        </div>
    );
}
