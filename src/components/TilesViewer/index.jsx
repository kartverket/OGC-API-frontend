'use client';

import { useEffect, useRef, useState } from 'react';
import {
    Alert,
    Card,
    Field,
    Heading,
    Label,
    Link,
    Select,
} from '@digdir/designsystemet-react';
import { CheckmarkIcon, FilesIcon, SquareGridFillIcon } from '@navikt/aksel-icons';
import { get as getProjectionByCode } from 'ol/proj';
import { createTilesMap } from '@/utils/map/map';
import { createVectorTileSource, buildTileGridFromDefinition } from '@/utils/map/vectorTilesLayer';
import { getLayer } from '@/utils/map/helpers';
import Zoom from '@/components/Map/Zoom';
import styles from './TilesViewer.module.css';

function substitutePlaceholders(href, apiBaseUrl, tmsId) {
    const resolved = new URL(href, apiBaseUrl);
    const rawPath = decodeURIComponent(resolved.pathname + resolved.search);
    const path = rawPath.replace('{tileMatrixSetId}', tmsId);
    return `${apiBaseUrl}${path}`;
}

// Synchronous part of parsing the /tiles response: URL templates and the
// hrefs needed for enrichment, but not the enrichment itself (that's async).
function buildTileMatrixSetSummaries(data, apiBaseUrl) {
    // The top-level tile-item link contains {tileMatrixSetId} as a placeholder.
    // Matched by rel="item" rather than a specific vector-tile media type,
    // since that varies by provider (e.g. pygeoapi's native MVT-postgresql
    // provider reports "application/vnd.mapbox-vector-tile", while its
    // MVT-proxy provider passes through whatever the proxied tile server
    // reports, e.g. "application/x-protobuf; type=mapbox-vector-tile") —
    // rel="item" is the stable OGC API - Tiles convention either way.
    const mvtTemplate = (data.links ?? []).find(
        l => l.rel === 'item' && l.href?.includes('{tileMatrixSetId}')
    );
    if (!mvtTemplate) return [];

    // The TileJSON metadata link is also templated at the document level
    const tileJsonTemplate = (data.links ?? []).find(
        l => l.rel === 'describedby' && l.href?.includes('{tileMatrixSetId}')
    );

    return (data.tilesets ?? [])
        .map(tileset => {
            // Extract TileMatrixSet ID from the URI last path segment (e.g. "WebMercatorQuad")
            const tmsId = tileset.tileMatrixSetURI?.split('/').pop();
            if (!tmsId) return null;

            const urlTemplate = substitutePlaceholders(mvtTemplate.href, apiBaseUrl, tmsId)
                .replace('{tileMatrix}', '{z}')
                .replace('{tileRow}', '{y}')
                .replace('{tileCol}', '{x}');

            const tilingSchemeHref = (tileset.links ?? [])
                .find(l => l.rel?.endsWith('/tiling-scheme'))?.href ?? null;

            const tileJsonHref = tileJsonTemplate
                ? substitutePlaceholders(tileJsonTemplate.href, apiBaseUrl, tmsId)
                : null;

            return { id: tmsId, urlTemplate, tilingSchemeHref, tileJsonHref };
        })
        .filter(Boolean);
}

// Fetches this TMS's tiling-scheme definition (-> tile grid) and TileJSON
// metadata (-> zoom range), tolerating either failing independently.
async function enrichTileMatrixSet(summary) {
    let tileGrid = null;
    let projectionCode = null;
    let minzoom;
    let maxzoom;

    if (summary.tilingSchemeHref) {
        try {
            const res = await fetch(summary.tilingSchemeHref);
            if (res.ok) {
                const definition = await res.json();
                const built = buildTileGridFromDefinition(definition);
                if (built) {
                    tileGrid = built.tileGrid;
                    projectionCode = built.projectionCode;
                }
            }
        } catch (err) {
            console.warn(`Kunne ikke bygge flisegrid for TileMatrixSet "${summary.id}":`, err);
        }
    }

    if (summary.tileJsonHref) {
        try {
            const res = await fetch(summary.tileJsonHref);
            if (res.ok) {
                const tileJson = await res.json();
                if (typeof tileJson.minzoom === 'number') minzoom = tileJson.minzoom;
                if (typeof tileJson.maxzoom === 'number') maxzoom = tileJson.maxzoom;
            }
        } catch (err) {
            console.warn(`Kunne ikke laste TileJSON for TileMatrixSet "${summary.id}":`, err);
        }
    }

    return { ...summary, tileGrid, projectionCode, minzoom, maxzoom };
}

async function resolveTileMatrixSets(data, apiBaseUrl) {
    const summaries = buildTileMatrixSetSummaries(data, apiBaseUrl);
    return Promise.all(summaries.map(enrichTileMatrixSet));
}

function formatZoomRange(entry) {
    if (typeof entry?.minzoom !== 'number' || typeof entry?.maxzoom !== 'number') {
        return null;
    }
    return `Flislag zoom range: ${entry.minzoom}–${entry.maxzoom}`;
}

export default function TilesViewer({ collectionId, defaultBbox, apiBaseUrl }) {
    const containerRef = useRef(null);
    const olMapRef = useRef(null);
    const [olMap, setOlMap] = useState(null);
    const [tileMatrixSets, setTileMatrixSets] = useState([]);
    const [activeTms, setActiveTms] = useState(null);
    const [currentZoom, setCurrentZoom] = useState(null);
    const [error, setError] = useState(null);
    const [copied, setCopied] = useState(false);

    const activeEntry = tileMatrixSets.find(t => t.id === activeTms) ?? null;

    // Mount OL map
    useEffect(() => {
        let cancelled = false;

        async function init() {
            const { map, initialExtent } = await createTilesMap(defaultBbox);
            if (cancelled) {
                map.dispose();
                return;
            }
            olMapRef.current = map;
            setOlMap(map);
            map.setTarget(containerRef.current);
            map.getView().fit(initialExtent);
        }

        init();

        return () => {
            cancelled = true;
            olMapRef.current?.setTarget(undefined);
            olMapRef.current?.dispose();
            olMapRef.current = null;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Fetch tile metadata from OGC API, resolving each TileMatrixSet's tile
    // grid and zoom range up front.
    useEffect(() => {
        let cancelled = false;

        async function loadTileMatrixSets() {
            setError(null);
            try {
                const res = await fetch(`${apiBaseUrl}/collections/${collectionId}/tiles?f=json`);
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                const data = await res.json();
                const resolved = await resolveTileMatrixSets(data, apiBaseUrl);
                if (cancelled) return;
                if (resolved.length === 0) {
                    setError('Ingen fliselag tilgjengelig for dette datasettet.');
                    return;
                }
                setTileMatrixSets(resolved);
                setActiveTms(resolved[0].id);
            } catch {
                if (!cancelled) setError('Kunne ikke laste flisemetadata.');
            }
        }

        loadTileMatrixSets();

        return () => {
            cancelled = true;
        };
    }, [apiBaseUrl, collectionId]);

    // Apply tile source whenever the map is ready or the active TMS changes.
    // Depends on activeTms (a stable string), not the derived activeEntry
    // object, so this doesn't re-fire on every unrelated render.
    useEffect(() => {
        if (!olMap || !activeTms) return;
        const entry = tileMatrixSets.find(t => t.id === activeTms);
        if (!entry) return;
        const tileLayer = getLayer(olMap, 'vector-tiles');
        if (tileLayer) {
            tileLayer.setSource(createVectorTileSource(entry.urlTemplate, entry.tileGrid, entry.projectionCode));
        }
    }, [olMap, activeTms, tileMatrixSets]);

    // Live "current zoom" in the active TMS's own zoom indexing. This
    // replicates the exact formula ol/source/VectorTile's getSourceTiles()
    // uses internally to pick a source zoom level for a reprojected tile
    // source (verified in node_modules/ol/source/VectorTile.js:218-230) —
    // a flat getMetersPerUnit() ratio, not a latitude-aware calculation.
    useEffect(() => {
        if (!olMap || !activeTms) return;
        const entry = tileMatrixSets.find(t => t.id === activeTms);
        if (!entry) return;

        const view = olMap.getView();
        const viewProjection = view.getProjection();

        function updateCurrentZoom() {
            if (!entry.tileGrid || !entry.projectionCode) {
                setCurrentZoom(Math.round(view.getZoom()));
                return;
            }
            const tmsProjection = getProjectionByCode(entry.projectionCode);
            const sourceResolution = view.getResolution()
                / tmsProjection.getMetersPerUnit()
                * viewProjection.getMetersPerUnit();
            setCurrentZoom(Math.round(entry.tileGrid.getZForResolution(sourceResolution)));
        }

        updateCurrentZoom();
        view.on('change:resolution', updateCurrentZoom);

        return () => {
            view.un('change:resolution', updateCurrentZoom);
        };
    }, [olMap, activeTms, tileMatrixSets]);

    function handleTmsChange(tmsId) {
        setActiveTms(tmsId);
    }

    function handleCopyUrl() {
        if (!activeEntry) return;
        navigator.clipboard.writeText(activeEntry.urlTemplate).catch(() => {});
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    }

    if (error) {
        return <Alert data-color="danger">{error}</Alert>;
    }

    return (
        <div className={styles.container}>
            <Card className={styles.controls}>
                <div className={styles.heading}>
                    <SquareGridFillIcon aria-hidden fontSize="24px" />
                    <Heading data-size="2xs">Fliseparametre</Heading>
                </div>
                {tileMatrixSets.length > 0 && (
                    <Field id="tiles-tms-field">
                        <Label htmlFor="tiles-tms">Tile Matrix Set</Label>
                        <Select
                            id="tiles-tms"
                            value={activeTms ?? ''}
                            onChange={(e) => handleTmsChange(e.target.value)}
                        >
                            {tileMatrixSets.map((tms) => (
                                <Select.Option key={tms.id} value={tms.id}>
                                    {tms.id}
                                </Select.Option>
                            ))}
                        </Select>
                    </Field>
                )}

                {activeEntry?.tileJsonHref && (
                    <Link
                        href={activeEntry.tileJsonHref.replace('f=json', 'f=html')}
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        Metadata
                    </Link>
                )}
            </Card>

            <div className={styles.mapContainer}>
                <div className={styles.mapBox}>
                    <div ref={containerRef} className={styles.olMap} />
                    {olMap && <Zoom map={olMap} className={styles.zoomButtons} />}
                    {activeEntry && (
                        <div className={styles.zoomBadge}>
                            Zoom: {currentZoom ?? '–'}
                        </div>
                    )}
                </div>
                {activeEntry && (
                    <>
                        {formatZoomRange(activeEntry) && (
                            <div className={styles.zoomInfo}>
                                {formatZoomRange(activeEntry)}
                            </div>
                        )}
                        <div className={styles.urlRow}>
                            <span className={styles.url}>{activeEntry.urlTemplate}</span>
                            <button
                                type="button"
                                onClick={handleCopyUrl}
                                aria-label="Kopier URL"
                                className={`${styles.iconButton} ${copied ? styles.iconButtonCopied : ''}`}
                            >
                                {copied
                                    ? <CheckmarkIcon aria-hidden fontSize="28px" />
                                    : <FilesIcon aria-hidden fontSize="28px" />
                                }
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
