import ImageSource from 'ol/source/Image';
import { getCrsCode } from './helpers';
import './setup';

const CRS84 = 'http://www.opengis.net/def/crs/OGC/1.3/CRS84';

export function buildOgcMapsUrl(apiBaseUrl, collectionId, { bbox, bboxCrs, crs, width, height }) {
  const effectiveBboxCrs = bboxCrs ?? CRS84;
  // Use the exact OL extent for request bbox so the returned image aligns
  // with how OL positions the image in the current view.
  const normalizedBbox = bbox;
  const params = new URLSearchParams({
    f: 'png',
    width: String(Math.round(width)),
    height: String(Math.round(height)),
    bbox: normalizedBbox.join(','),
  });
  // For CRS84, rely on server default CRS to avoid lowercased URI parsing
  // differences in some pygeoapi/provider combinations.
  if (crs && crs !== CRS84) {
    params.set('crs', crs);
  }
  if (effectiveBboxCrs !== CRS84) {
    params.set('bbox-crs', effectiveBboxCrs);
  }
  return `${apiBaseUrl}/collections/${collectionId}/map?${params}`;
}

/**
 * Resolve a CRS URI to the OL projection identifier.
 */
export function toOlProjection(crsUri) {
  return getCrsCode(crsUri);
}

/**
 * Image source that fetches from the OGC Maps API in the given CRS.
 *
 * The source is created with the selected CRS as its native projection.
 * URL construction mirrors the current backend behavior used in this
 * project to keep stock pygeoapi MapScript requests rendering correctly.
 */
export class OgcMapsImageSource extends ImageSource {
  constructor({ collectionId, apiBaseUrl, crsUri }) {
    const olProjection = toOlProjection(crsUri);
    const loader = (extent, resolution, pixelRatio) => {
      const extentWidth = extent[2] - extent[0];
      const extentHeight = extent[3] - extent[1];
      const width = Math.max(1, Math.round((extentWidth / resolution) * (pixelRatio || 1)));
      const height = Math.max(1, Math.round((extentHeight / resolution) * (pixelRatio || 1)));

      if (!Number.isFinite(width) || !Number.isFinite(height)) {
        return Promise.reject(new Error('Map size not yet available'));
      }
      const url = buildOgcMapsUrl(apiBaseUrl, collectionId, {
        bbox: extent,
        bboxCrs: crsUri,
        crs: crsUri,
        width,
        height,
      });
      const img = new Image();
      img.crossOrigin = 'anonymous';
      return new Promise((resolve, reject) => {
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error(`Failed to load map image: ${url}`));
        img.src = url;
      });
    };
    super({ loader, projection: olProjection });
  }
}
