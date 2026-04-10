'use client';

import { useEffect, useRef, useState } from 'react';
import {
    Card,
    Field,
    Heading,
    Label,
    Select,
} from '@digdir/designsystemet-react';
import { DownloadIcon, FilesIcon, LayersFillIcon } from '@navikt/aksel-icons';
import { View } from 'ol';
import { createMapViewerMap } from '@/utils/map/map';
import { OgcMapsImageSource, buildOgcMapsUrl, toOlProjection } from '@/utils/map/ogcImageSource';
import { getCrsCode, getLayer, transformExtent } from '@/utils/map/helpers';
import { createBaseMapSource, isBasemapProjection } from '@/utils/map/baseMap';
import basemapConfig from '@/config/basemap';
import styles from './MapViewer.module.css';

function createSource(collectionId, apiBaseUrl, olMapRef) {
    return new OgcMapsImageSource({
        collectionId,
        apiBaseUrl,
        getMapSize: () => olMapRef.current?.getSize(),
    });
}

/**
 * Determine the OL view projection for a given CRS URI.
 * Geographic CRS (4326, 4258, CRS84) use EPSG:3857 so the basemap works;
 * projected CRS (UTM etc.) use their native projection.
 */
function viewProjectionFor(crsUri) {
    const olProj = toOlProjection(crsUri);
    // Geographic CRS and EPSG:3857 (already the basemap projection) → keep Web Mercator view.
    const keepMercator = ['EPSG:4326', 'EPSG:4258', 'EPSG:3857'];
    if (keepMercator.includes(olProj)) {
        return basemapConfig.projection;
    }
    return olProj;
}

export default function MapViewer({ collectionId, defaultBbox, crsOptions, apiBaseUrl }) {
    const containerRef = useRef(null);
    const olMapRef = useRef(null);
    const unwireRef = useRef(null);
    const [crs, setCrs] = useState(crsOptions[0]);
    const [isLoading, setIsLoading] = useState(true);
    const [mapUrl, setMapUrl] = useState('');

    // Mount OL map
    useEffect(() => {
        let cancelled = false;

        async function init() {
            const { map, initialExtent } = await createMapViewerMap(defaultBbox);
            if (cancelled) {
                map.dispose();
                return;
            }
            olMapRef.current = map;
            map.setTarget(containerRef.current);
            map.getView().fit(initialExtent);

            const source = createSource(collectionId, apiBaseUrl, olMapRef);
            getLayer(map, 'ogc-image').setSource(source);
            unwireRef.current = wireLoadingEvents(source);
            updateMapUrl(map);

            map.on('moveend', () => updateMapUrl(olMapRef.current));
        }

        init();

        return () => {
            cancelled = true;
            unwireRef.current?.();
            olMapRef.current?.setTarget(undefined);
            olMapRef.current?.dispose();
            olMapRef.current = null;
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    function wireLoadingEvents(source) {
        const onStart = () => setIsLoading(true);
        const onEnd = () => setIsLoading(false);
        source.on('imageloadstart', onStart);
        source.on('imageloadend', onEnd);
        source.on('imageloaderror', onEnd);
        return () => {
            source.un('imageloadstart', onStart);
            source.un('imageloadend', onEnd);
            source.un('imageloaderror', onEnd);
        };
    }

    function updateMapUrl(map) {
        if (!map) return;
        const size = map.getSize();
        if (!size) return;
        const view = map.getView();
        const extent = view.calculateExtent(size);
        const [w, h] = size;
        const viewProj = view.getProjection().getCode();
        // Download URL: bbox and crs always in CRS84 because pygeoapi only
        // reliably renders for CRS84, EPSG:4326, and its native EPSG:25833.
        // Other crs values (25832, 25835, 3857) return blank images.
        const bbox = viewProj === 'EPSG:4326'
            ? extent
            : transformExtent(extent, viewProj, 'EPSG:4326');
        const crs = 'http://www.opengis.net/def/crs/OGC/1.3/CRS84';
        setMapUrl(buildOgcMapsUrl(apiBaseUrl, collectionId, { bbox, crs, width: w, height: h }));
    }

    async function handleCrsChange(newCrs) {
        setCrs(newCrs);
        const map = olMapRef.current;
        if (!map) return;

        const oldView = map.getView();
        const oldProj = oldView.getProjection().getCode();
        const viewProj = viewProjectionFor(newCrs);

        // Switch the view projection when the target projection differs.
        if (viewProj !== oldProj) {
            const center = oldView.getCenter();
            const newCenter = center
                ? transformExtent([center[0], center[1], center[0], center[1]], oldProj, viewProj).slice(0, 2)
                : undefined;

            const newView = new View({
                projection: viewProj,
                center: newCenter,
                zoom: oldView.getZoom(),
                padding: [50, 50, 50, 50],
            });
            map.setView(newView);

            // Fit to the default bbox so the user sees the data area.
            const fitExtent = transformExtent(defaultBbox, 'EPSG:4326', viewProj);
            newView.fit(fitExtent);

            // Swap the basemap source to match the new projection, or hide if unsupported.
            const basemapLayer = getLayer(map, 'basemap');
            if (basemapLayer) {
                if (isBasemapProjection(viewProj)) {
                    const basemapSource = await createBaseMapSource(viewProj);
                    basemapLayer.setSource(basemapSource);
                    basemapLayer.setVisible(true);
                } else {
                    basemapLayer.setVisible(false);
                }
            }

        }

        // The OGC source always fetches in CRS84 — no need to replace it on CRS change.
        // Just refresh the image to match the new view extent.
        getLayer(map, 'ogc-image').getSource()?.changed();

        updateMapUrl(map);
    }

    async function handleDownload() {
        if (!mapUrl) return;
        try {
            const response = await fetch(mapUrl);
            if (!response.ok) {
                window.open(mapUrl, '_blank', 'noopener,noreferrer');
                return;
            }
            const blob = await response.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${collectionId}-kart.png`;
            a.click();
            setTimeout(() => URL.revokeObjectURL(url), 0);
        } catch {
            window.open(mapUrl, '_blank', 'noopener,noreferrer');
        }
    }

    return (
        <div className={styles.container}>
            <Card className={styles.controls}>
                <div className={styles.heading}>
                    <LayersFillIcon aria-hidden fontSize="24px" />
                    <Heading data-size="2xs">Kartparametre</Heading>
                </div>
                <Field id="map-crs-field">
                    <Label htmlFor="map-crs">Koordinatsystem (CRS)</Label>
                    <Select
                        id="map-crs"
                        value={crs}
                        onChange={(e) => handleCrsChange(e.target.value)}
                    >
                        {crsOptions.map((c) => (
                            <Select.Option key={c} value={c}>
                                {getCrsCode(c)}
                            </Select.Option>
                        ))}
                    </Select>
                </Field>
            </Card>

            <div className={styles.mapContainer}>
                <div className={styles.mapBox}>
                    {isLoading && <div className={styles.loading}>Laster kart…</div>}
                    <div ref={containerRef} className={styles.olMap} />
                </div>
                <div className={styles.urlRow}>
                    <span className={styles.url}>{mapUrl}</span>
                    <button
                        type="button"
                        onClick={() => navigator.clipboard.writeText(mapUrl).catch(() => {})}
                        aria-label="Kopier URL"
                        className={styles.iconButton}
                    >
                        <FilesIcon aria-hidden fontSize="28px" />
                    </button>
                    <button
                        type="button"
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
