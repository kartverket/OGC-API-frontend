'use client';

import { Alert, Card, Field, Heading, Label, Link, Select } from '@digdir/designsystemet-react';
import { CheckmarkIcon, FilesIcon, PaletteFillIcon, SquareGridFillIcon } from '@navikt/aksel-icons';
import { get as getProjectionByCode } from 'ol/proj';
import { useEffect, useRef, useState } from 'react';
import Zoom from '@/components/Map/Zoom';
import { useCopyToClipboard } from '@/hooks';
import { getLayer } from '@/utils/map/helpers';
import { createTilesMap } from '@/utils/map/map';
import { featureStyle } from '@/utils/map/styles';
import {
  applyVectorTileStyle,
  buildTileGridFromDefinition,
  createVectorTileSource,
} from '@/utils/map/vectorTilesLayer';
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

function styleTitle(style) {
  const title = style.title;
  if (typeof title === 'string') return title;
  if (!title || typeof title !== 'object' || Array.isArray(title)) return style.id;

  return (
    title['nb-NO'] ?? title['en-US'] ?? Object.values(title).find((value) => typeof value === 'string') ?? style.id
  );
}

export default function TilesViewer({ collectionId, defaultBbox, baseUrl, initialStyleId }) {
  const containerRef = useRef(null);
  const olMapRef = useRef(null);
  const [olMap, setOlMap] = useState(null);
  const [tileMatrixSets, setTileMatrixSets] = useState([]);
  const [activeTms, setActiveTms] = useState(null);
  const [currentZoom, setCurrentZoom] = useState(null);
  const [error, setError] = useState(null);
  const [styleError, setStyleError] = useState(null);
  const [availableStyles, setAvailableStyles] = useState([]);
  const [activeStyleId, setActiveStyleId] = useState(null);
  const { copied, copy } = useCopyToClipboard();

  const activeEntry = tileMatrixSets.find((t) => t.id === activeTms) ?? null;
  const unknownStyle =
    initialStyleId !== undefined &&
    availableStyles.length > 0 &&
    (typeof initialStyleId !== 'string' || !availableStyles.some((style) => style.id === initialStyleId));

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
        if (!res.ok) throw Error(`HTTP ${res.status}`);
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

  useEffect(() => {
    let cancelled = false;

    async function loadStyles() {
      setStyleError(null);
      setAvailableStyles([]);
      setActiveStyleId(null);
      try {
        const response = await fetch(`/collections/${encodeURIComponent(collectionId)}/styles?f=json`);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();
        if (!Array.isArray(data.styles)) throw new Error('Ugyldig stilliste');
        if (cancelled) return;
        setAvailableStyles(data.styles);
        const requestedStyle = data.styles.find((style) => style.id === initialStyleId);
        setActiveStyleId(requestedStyle?.id ?? data.default ?? data.styles[0]?.id ?? null);
      } catch (err) {
        if (!cancelled) {
          console.error('Kunne ikke laste stiler:', err);
          setStyleError('Kunne ikke laste stiler for flislaget.');
        }
      }
    }

    loadStyles();
    return () => {
      cancelled = true;
    };
  }, [collectionId, initialStyleId]);

  useEffect(() => {
    if (!olMap || !activeStyleId) return;
    const tileLayer = getLayer(olMap, 'vector-tiles');
    if (!tileLayer) return;
    let cancelled = false;
    const selected = availableStyles.find((style) => style.id === activeStyleId);
    const stylesheet = selected?.links?.find((link) => link.rel === 'stylesheet' && link.href);

    async function loadStyle() {
      setStyleError(null);
      tileLayer.setStyle(featureStyle);
      try {
        if (!stylesheet) throw new Error(`Mangler stil-lenke for ${activeStyleId}`);
        const response = await fetch(stylesheet.href);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const styleDocument = await response.json();
        if (cancelled) return;
        applyVectorTileStyle(tileLayer, styleDocument, collectionId);
      } catch (err) {
        if (!cancelled) {
          console.error('Kunne ikke bruke flisstilen:', err);
          setStyleError('Kunne ikke vise valgt stil for flislaget.');
        }
      }
    }

    loadStyle();
    return () => {
      cancelled = true;
    };
  }, [olMap, collectionId, availableStyles, activeStyleId]);

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
      <div className={styles.sidebar}>
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
          {activeEntry ? (
            <Link href={`/collections/${collectionId}/tiles/${encodeURIComponent(activeEntry.id)}/metadata`}>
              Metadata
            </Link>
          ) : null}
        </Card>

        {(availableStyles.length > 0 || styleError) && (
          <Card className={styles.controls}>
            <div className={styles.heading}>
              <PaletteFillIcon aria-hidden fontSize="24px" />
              <Heading data-size="2xs">Stil</Heading>
            </div>
            {availableStyles.length > 1 && (
              <Field id="tiles-style-field">
                <Label htmlFor="tiles-style">Velg stil</Label>
                <Select id="tiles-style" value={activeStyleId ?? ''} onChange={(e) => setActiveStyleId(e.target.value)}>
                  {availableStyles.map((style) => (
                    <Select.Option key={style.id} value={style.id}>
                      {styleTitle(style)}
                    </Select.Option>
                  ))}
                </Select>
              </Field>
            )}
            {styleError && <Alert data-color="danger">{styleError}</Alert>}
            {unknownStyle && <Alert data-color="warning">Ukjent stil. Viser standardstilen.</Alert>}
            {availableStyles.length > 0 && (
              <Link href={`/collections/${encodeURIComponent(collectionId)}/styles`}>Se stiler</Link>
            )}
          </Card>
        )}
      </div>

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
