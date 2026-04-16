import TileLayer from 'ol/layer/Tile';
import WMTS, { optionsFromCapabilities } from 'ol/source/WMTS';
import { WMTSCapabilities } from 'ol/format';
import { get } from 'ol/proj';
import basemap from '@/config/basemap';

let _capabilities = null;
const _wmtsOptionsCache = {};

// Map OL projection codes to WMTS matrix set identifiers.
const MATRIX_SETS = {
    'EPSG:3857': 'webmercator',
    'EPSG:25832': 'utm32n',
    'EPSG:25833': 'utm33n',
    'EPSG:25835': 'utm35n',
};

export async function createBaseMap() {
    const options = await getWmtsOptions(basemap.projection);

    if (options === null) {
        return null;
    }

    const tileLayer = new TileLayer({
        source: new WMTS(options),
        minZoom: basemap.minZoom,
        maxZoom: basemap.maxZoom
    });

    tileLayer.set('id', 'basemap');

    return tileLayer;
}

/**
 * Create a WMTS source for the given projection, or null if unsupported.
 */
export async function createBaseMapSource(projection) {
    const options = await getWmtsOptions(projection);
    return options ? new WMTS(options) : null;
}

/**
 * Check whether the basemap WMTS has tiles for the given projection.
 */
export function isBasemapProjection(projection) {
    return projection in MATRIX_SETS;
}

async function getWmtsOptions(projection) {
    if (_wmtsOptionsCache[projection]) {
        return _wmtsOptionsCache[projection];
    }

    const matrixSet = MATRIX_SETS[projection];
    if (!matrixSet) {
        return null;
    }

    const capabilities = await getCapabilities();
    if (!capabilities) {
        return null;
    }

    const options = optionsFromCapabilities(capabilities, {
        layer: basemap.layer,
        projection: get(projection),
        matrixSet,
    });

    if (!options) {
        return null;
    }

    _wmtsOptionsCache[projection] = {
        ...options,
        crossOrigin: 'anonymous'
    };

    return _wmtsOptionsCache[projection];
}

async function getCapabilities() {
    if (_capabilities) {
        return _capabilities;
    }

    let response;

    try {
        response = await fetch(basemap.url);
    } catch {
        return null;
    }

    if (!response.ok) return null;

    const xml = await response.text();
    _capabilities = new WMTSCapabilities().read(xml);

    return _capabilities;
}
