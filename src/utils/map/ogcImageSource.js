import ImageSource from 'ol/source/Image';
import { getCrsCode } from './helpers';
import './setup';

// The OGC:CRS84 URI — axis order is lon,lat (matches EPSG:4326 extent from OL).
const CRS84 = 'http://www.opengis.net/def/crs/OGC/1.3/CRS84';

export function buildOgcMapsUrl(apiBaseUrl, collectionId, { bbox, crs, width, height }) {
    const params = new URLSearchParams({
        f: 'png',
        width: String(Math.round(width)),
        height: String(Math.round(height)),
        bbox: bbox.join(','),
        crs,
    });
    return `${apiBaseUrl}/collections/${collectionId}/map?${params}`;
}

/**
 * Resolve a CRS URI to the OL projection identifier.
 * CRS84 is treated as EPSG:4326 (same axis order in OL).
 */
export function toOlProjection(crsUri) {
    const code = getCrsCode(crsUri);
    return code === 'OGC:CRS84' ? 'EPSG:4326' : code;
}

/**
 * Image source that fetches from the OGC Maps API.
 *
 * Always fetches in CRS84 (bbox and rendering) so the source projection
 * is EPSG:4326. OL reprojects the image to the view projection as needed.
 * pygeoapi does not reliably interpret bbox-crs for all projections,
 * so we avoid it entirely.
 */
export class OgcMapsImageSource extends ImageSource {
    constructor({ collectionId, apiBaseUrl, getMapSize }) {
        const loader = (extent, _resolution, _pixelRatio) => {
            const mapSize = getMapSize();
            const [width, height] = mapSize ?? [];
            if (!width || !height) {
                return Promise.reject(new Error('Map size not yet available'));
            }
            const url = buildOgcMapsUrl(apiBaseUrl, collectionId, {
                bbox: extent,
                crs: CRS84,
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
        super({ loader, projection: 'EPSG:4326' });
    }
}
