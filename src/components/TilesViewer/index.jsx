'use client';

import { Alert, Card, Field, Heading, Label, Link, Select } from '@digdir/designsystemet-react';
import { CheckmarkIcon, FilesIcon, SquareGridFillIcon } from '@navikt/aksel-icons';
import { get as getProjectionByCode } from 'ol/proj';
import { useEffect, useRef, useState } from 'react';
import Zoom from '@/components/Map/Zoom';
import { useCopyToClipboard } from '@/hooks';
import { getLayer } from '@/utils/map/helpers';
import { createTilesMap } from '@/utils/map/map';
import { buildTileGridFromDefinition, createVectorTileSource } from '@/utils/map/vectorTilesLayer';
import styles from './TilesViewer.module.css';

function substitutePlaceholders(href, tmsId) {
  const resolved = new URL(href);
  const rawPath = decodeURIComponent(resolved.pathname + resolved.search);
  return rawPath.replace('{tileMatrixSetId}', tmsId);
}

// Synchronous part of parsing the /tiles response: URL templates and the
// hrefs needed for enrichment, but not the enrichment itself (that's async).
function buildTileMatrixSetSummaries(data, baseUrl) {
  const mvtTemplate = (data.links ?? []).find((l) => l.rel === 'item' && l.href?.includes('{tileMatrixSetId}'));
  if (!mvtTemplate) return [];

  // The TileJSON metadata link is also templated at the document level
  const tileJsonTemplate = (data.links ?? []).find(
    (l) => l.rel === 'describedby' && l.href?.includes('{tileMatrixSetId}'),
  );

  return (data.tilesets ?? [])
    .map((tileset) => {
      // Extract TileMatrixSet ID from the URI last path segment (e.g. "WebMercatorQuad")
      const tmsId = tileset.tileMatrixSetURI?.split('/').pop();
      if (!tmsId) return null;

      const urlTemplate =
        baseUrl +
        substitutePlaceholders(mvtTemplate.href, tmsId)
          .replace('{tileMatrix}', '{z}')
          .replace('{tileRow}', '{y}')
          .replace('{tileCol}', '{x}');

      const tilingSchemeHref = (tileset.links ?? []).find((l) => l.rel?.endsWith('/tiling-scheme'))?.href ?? null;

      const tileJsonHref = tileJsonTemplate ? substitutePlaceholders(tileJsonTemplate.href, tmsId) : null;

      return { id: tmsId, urlTemplate, tilingSchemeHref, tileJsonHref };
    })
    .filter(Boolean);
}

async function fetchTilingScheme(href, tmsId) {
  if (!href) return { tileGrid: null, projectionCode: null };
  try {
    const res = await fetch(href);
    if (res.ok) {
      const definition = await res.json();
      const built = buildTileGridFromDefinition(definition);
      if (built) return built;
    }
  } catch (err) {
    console.warn(`Kunne ikke bygge flisegrid for TileMatrixSet "${tmsId}":`, err);
  }
  return { tileGrid: null, projectionCode: null };
}

async function fetchTileJsonZoomRange(href, tmsId) {
  if (!href) return { minzoom: undefined, maxzoom: undefined };
  try {
    const res = await fetch(href);
    if (res.ok) {
      const tileJson = await res.json();
      return {
        minzoom: typeof tileJson.minzoom === 'number' ? tileJson.minzoom : undefined,
        maxzoom: typeof tileJson.maxzoom === 'number' ? tileJson.maxzoom : undefined,
      };
    }
  } catch (err) {
    console.warn(`Kunne ikke laste TileJSON for TileMatrixSet "${tmsId}":`, err);
  }
  return { minzoom: undefined, maxzoom: undefined };
}

// Fetches this TMS's tiling-scheme definition (-> tile grid) and TileJSON
// metadata (-> zoom range) in parallel, tolerating either failing independently.
async function enrichTileMatrixSet(summary) {
  const [{ tileGrid, projectionCode }, { minzoom, maxzoom }] = await Promise.all([
    fetchTilingScheme(summary.tilingSchemeHref, summary.id),
    fetchTileJsonZoomRange(summary.tileJsonHref, summary.id),
  ]);

  return { ...summary, tileGrid, projectionCode, minzoom, maxzoom };
}

async function resolveTileMatrixSets(data, baseUrl) {
  const summaries = buildTileMatrixSetSummaries(data, baseUrl);
  return Promise.all(summaries.map(enrichTileMatrixSet));
}

function formatZoomRange(entry) {
  if (typeof entry?.minzoom !== 'number' || typeof entry?.maxzoom !== 'number') {
    return null;
  }
  return `Flislag zoom range: ${entry.minzoom}–${entry.maxzoom}`;
}

export default function TilesViewer({ collectionId, defaultBbox, baseUrl }) {
  const containerRef = useRef(null);
  const olMapRef = useRef(null);
  const [olMap, setOlMap] = useState(null);
  const [tileMatrixSets, setTileMatrixSets] = useState([]);
  const [activeTms, setActiveTms] = useState(null);
  const [currentZoom, setCurrentZoom] = useState(null);
  const [error, setError] = useState(null);
  const { copied, copy } = useCopyToClipboard();

  const activeEntry = tileMatrixSets.find((t) => t.id === activeTms) ?? null;

  // Mount OL map
  // biome-ignore lint/correctness/useExhaustiveDependencies: intentional mount-only effect
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
        const res = await fetch(`/collections/${collectionId}/tiles?f=json`);
        if (!res.ok) setError(`HTTP ${res.status}`);
        const data = await res.json();
        const resolved = await resolveTileMatrixSets(data, baseUrl);
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
  }, [collectionId, baseUrl]);

  // Apply tile source whenever the map is ready or the active TMS entry changes.
  // activeEntry is referentially stable across renders that don't touch
  // tileMatrixSets or activeTms (Array.find returns the same object
  // reference), so this doesn't re-fire on every unrelated render.
  useEffect(() => {
    if (!olMap || !activeEntry) return;
    const tileLayer = getLayer(olMap, 'vector-tiles');
    if (tileLayer) {
      tileLayer.setSource(
        createVectorTileSource(activeEntry.urlTemplate, activeEntry.tileGrid, activeEntry.projectionCode),
      );
    }
  }, [olMap, activeEntry]);

  // Live "current zoom" in the active TMS's own zoom indexing. This
  // replicates the exact formula ol/source/VectorTile's getSourceTiles()
  // uses internally to pick a source zoom level for a reprojected tile
  // source (verified in node_modules/ol/source/VectorTile.js:218-230) —
  // a flat getMetersPerUnit() ratio, not a latitude-aware calculation.
  useEffect(() => {
    if (!olMap || !activeEntry) return;

    const view = olMap.getView();
    const viewProjection = view.getProjection();
    const tmsProjection = activeEntry.projectionCode ? getProjectionByCode(activeEntry.projectionCode) : null;

    function updateCurrentZoom() {
      if (!activeEntry.tileGrid || !tmsProjection) {
        const zoom = view.getZoom();
        setCurrentZoom(typeof zoom === 'number' ? Math.round(zoom) : null);
        return;
      }
      const sourceResolution =
        (view.getResolution() / tmsProjection.getMetersPerUnit()) * viewProjection.getMetersPerUnit();
      setCurrentZoom(Math.round(activeEntry.tileGrid.getZForResolution(sourceResolution)));
    }

    updateCurrentZoom();
    view.on('change:resolution', updateCurrentZoom);

    return () => {
      view.un('change:resolution', updateCurrentZoom);
    };
  }, [olMap, activeEntry]);

  function handleTmsChange(tmsId) {
    setActiveTms(tmsId);
  }

  function handleCopyUrl() {
    if (!activeEntry) return;
    copy(activeEntry.urlTemplate);
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
            <Select id="tiles-tms" value={activeTms ?? ''} onChange={(e) => handleTmsChange(e.target.value)}>
              {tileMatrixSets.map((tms) => (
                <Select.Option key={tms.id} value={tms.id}>
                  {tms.id}
                </Select.Option>
              ))}
            </Select>
          </Field>
        )}

        {activeEntry?.tileJsonHref && (
          <Link href={activeEntry.tileJsonHref} target="_blank" rel="noopener noreferrer">
            Metadata
          </Link>
        )}
      </Card>

      <div className={styles.mapContainer}>
        <div className={styles.mapBox}>
          <div ref={containerRef} className={styles.olMap} />
          {olMap && <Zoom map={olMap} className={styles.zoomButtons} />}
          {activeEntry && <div className={styles.zoomBadge}>Zoom: {currentZoom ?? '–'}</div>}
        </div>
        {activeEntry && (
          <>
            {formatZoomRange(activeEntry) && <div className={styles.zoomInfo}>{formatZoomRange(activeEntry)}</div>}
            <div className={styles.urlRow}>
              <span className={styles.url}>{activeEntry.urlTemplate}</span>
              <button
                type="button"
                onClick={handleCopyUrl}
                aria-label="Kopier URL"
                className={`${styles.iconButton} ${copied ? styles.iconButtonCopied : ''}`}
              >
                {copied ? <CheckmarkIcon aria-hidden fontSize="28px" /> : <FilesIcon aria-hidden fontSize="28px" />}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
