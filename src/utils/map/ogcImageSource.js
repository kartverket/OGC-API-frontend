import ImageSource from 'ol/source/Image';
import {
    clampExtentToProjectionExtent,
    getCrsCode,
    reorderBboxForCrsAxisOrder,
} from './helpers';
import './setup';

const CRS84 = 'http://www.opengis.net/def/crs/OGC/1.3/CRS84';

export function buildOgcMapsUrl(apiBaseUrl, collectionId, { bbox, bboxCrs, crs, width, height }) {
    const effectiveBboxCrs = bboxCrs ?? CRS84;
    const normalizedBbox = reorderBboxForCrsAxisOrder(
        clampExtentToProjectionExtent(bbox, toOlProjection(effectiveBboxCrs)),
        effectiveBboxCrs,
    );
    const params = new URLSearchParams({
        f: 'png',
        width: String(Math.round(width)),
        height: String(Math.round(height)),
        bbox: normalizedBbox.join(','),
        crs,
    });
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
 * `buildOgcMapsUrl()` takes care of serializing bbox coordinates in the
 * axis order required by `bbox-crs` (e.g. lat/lon for EPSG:4326, lon/lat
 * for CRS84), so the backend receives a standards-compliant request.
 */
export class OgcMapsImageSource extends ImageSource {
    constructor({ collectionId, apiBaseUrl, crsUri, getMapSize }) {
        const olProjection = toOlProjection(crsUri);
        const loader = (extent, _resolution, _pixelRatio) => {
            const mapSize = getMapSize();
            const [width, height] = mapSize ?? [];
            if (!width || !height) {
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
