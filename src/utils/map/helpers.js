import { get as getProjectionByCode, transformExtent as _transformExtent } from 'ol/proj';
import { roundDecimals } from '../helper';

const URI_REGEX = /^http:\/\/www\.opengis\.net\/def\/crs\/(?<auth>\w+)\/.*\/(?<code>\w+)$/m;
const URN_REGEX = /^urn:ogc:def:crs:(?<auth>\w+):.*?:(?<code>\w+)$/m;
const LAT_LON_AXIS_CRS = new Set(['EPSG:4326', 'EPSG:4258']);
const GEOGRAPHIC_CRS = new Set(['OGC:CRS84', 'OGC:CRS84H', ...LAT_LON_AXIS_CRS]);


export function getLayer(map, id) {
    return map
        .getLayers()
        .getArray()
        .find(layer => layer.get('id') === id) || null;
}

export function getCrsCode(crsName) {
    if (!crsName) {
        return 'OGC:CRS84';
    }

    const match = crsName.match(URI_REGEX) || crsName.match(URN_REGEX);

    return match !== null ?
        `${match.groups['auth'].toUpperCase()}:${match.groups['code'].toUpperCase()}` :
        'OGC:CRS84'
}

export function isGeographicCrs(crsName) {
    return GEOGRAPHIC_CRS.has(getCrsCode(crsName));
}

/**
 * OGC API bbox coordinates must follow the axis order of bbox-crs.
 * EPSG:4326 and EPSG:4258 are latitude/longitude; CRS84 stays longitude/latitude.
 */
export function crsUsesLatLonAxisOrder(crsName) {
    return LAT_LON_AXIS_CRS.has(getCrsCode(crsName));
}

export function reorderBboxForCrsAxisOrder(bbox, crsName) {
    if (!Array.isArray(bbox) || bbox.length !== 4) {
        return bbox;
    }

    if (!crsUsesLatLonAxisOrder(crsName)) {
        return bbox;
    }

    return [bbox[1], bbox[0], bbox[3], bbox[2]];
}

export function clampExtentToProjectionExtent(extent, projectionLike) {
    if (!Array.isArray(extent) || extent.length !== 4) {
        return extent;
    }

    const projection = getProjectionByCode(projectionLike);
    const projectionExtent = projection?.getExtent?.();

    if (!projectionExtent) {
        return extent;
    }

    const clamped = [
        Math.max(extent[0], projectionExtent[0]),
        Math.max(extent[1], projectionExtent[1]),
        Math.min(extent[2], projectionExtent[2]),
        Math.min(extent[3], projectionExtent[3]),
    ];

    return [
        Math.min(clamped[0], clamped[2]),
        Math.min(clamped[1], clamped[3]),
        Math.max(clamped[0], clamped[2]),
        Math.max(clamped[1], clamped[3]),
    ];
}

export function getProjection(geoJson) {
    const crsName = getCrsName(geoJson);

    return getCrsCode(crsName);
}

export function transformExtent(extent, sourceProj, destProj, precision = -1) {
    const transformed = _transformExtent(extent, sourceProj, destProj);

    if (precision === -1) {
        return transformed;
    }

    return [
        roundDecimals(transformed[0], precision),
        roundDecimals(transformed[1], precision),
        roundDecimals(transformed[2], precision),
        roundDecimals(transformed[3], precision)
    ];
}

export function parseBbox(bbox) {
    return bbox.map(coordinate => Number.parseFloat(coordinate));
}

export function parseBboxStr(bboxStr) {
    if (bboxStr === null) {
        return null;
    }

    return parseBbox(bboxStr.split(','));
}

export function isBboxValid(bbox) {
    if (!Array.isArray(bbox) || bbox.length !== 4) {
        return false;
    }

    const parsed = parseBbox(bbox);
    const [minLon, minLat, maxLon, maxLat] = parsed;

    if (![minLon, minLat, maxLon, maxLat].every(coordinate => Number.isFinite(coordinate))) {
        return false;
    }

    if (
        minLon < -180 || minLon > 180 ||
        maxLon < -180 || maxLon > 180 ||
        minLat < -90 || minLat > 90 ||
        maxLat < -90 || maxLat > 90
    ) {
        return false;
    }

    if (minLon > maxLon || minLat > maxLat) {
        return false;
    }

    if (minLon === maxLon || minLat === maxLat) {
        return false;
    }

    return true;
}

function getCrsName(geoJson) {
    return geoJson?.crs?.properties?.name || null;
}
