import VectorTileLayer from 'ol/layer/VectorTile';
import VectorTileSource from 'ol/source/VectorTile';
import MVT from 'ol/format/MVT';
import TileGrid from 'ol/tilegrid/TileGrid';
import { featureStyle } from './styles';
import { getCrsCode } from './helpers';

/**
 * Create a vector tile source for the given URL template; tileGrid/projectionCode are optional and fall back to OL's default Web-Mercator grid.
 */
export function createVectorTileSource(urlTemplate, tileGrid, projectionCode) {
  return new VectorTileSource({
    format: new MVT(),
    url: urlTemplate,
    ...(tileGrid && { tileGrid }),
    ...(projectionCode && { projection: projectionCode }),
  });
}

export function createVectorTileLayer() {
  const layer = new VectorTileLayer({ style: featureStyle });
  layer.set('id', 'vector-tiles');
  return layer;
}

/**
 * Builds an OL tile grid from a TileMatrixSet's own JSON definition
 * (the response of its "tiling-scheme" link, e.g. GET /TileMatrixSets/WorldCRS84Quad?f=json).
 * Returns null if the definition is missing or malformed — callers should
 * fall back to OL's default grid in that case (see createVectorTileSource).
 */
export function buildTileGridFromDefinition(definition) {
  const tileMatrices = definition?.tileMatrices;
  if (!Array.isArray(tileMatrices) || tileMatrices.length === 0) {
    return null;
  }

  if (!tileMatrices.every(isValidTileMatrix)) {
    return null;
  }

  const sorted = [...tileMatrices].sort((a, b) => Number(a.id) - Number(b.id));

  const minZoom = Number(sorted[0].id);
  const isContiguous = sorted.every((m, i) => Number(m.id) === minZoom + i);
  if (!isContiguous) {
    return null;
  }

  const resolutions = sorted.map((m) => m.cellSize);
  const origins = sorted.map((m) => m.pointOfOrigin);
  const tileSizes = sorted.map((m) => [m.tileWidth, m.tileHeight]);
  const sizes = sorted.map((m) => [m.matrixWidth, m.matrixHeight]);

  const tileGrid = new TileGrid({
    resolutions,
    origins,
    tileSizes,
    sizes,
    minZoom,
  });

  const projectionCode = getCrsCode(definition.crs);

  return { tileGrid, projectionCode };
}

/**
 * Validates that a tileMatrices[] entry has a numeric id and all fields
 * required by buildTileGridFromDefinition present as finite numbers.
 */
function isValidTileMatrix(matrix) {
  if (!matrix || !Number.isFinite(Number(matrix.id))) {
    return false;
  }

  if (!Number.isFinite(matrix.cellSize)) {
    return false;
  }

  if (
    !Array.isArray(matrix.pointOfOrigin) ||
    matrix.pointOfOrigin.length !== 2 ||
    !matrix.pointOfOrigin.every(Number.isFinite)
  ) {
    return false;
  }

  return (
    Number.isFinite(matrix.tileWidth) &&
    Number.isFinite(matrix.tileHeight) &&
    Number.isFinite(matrix.matrixWidth) &&
    Number.isFinite(matrix.matrixHeight)
  );
}
