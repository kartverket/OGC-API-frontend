import { transformExtent as _transformExtent } from 'ol/proj';
import { roundDecimals } from '../helper';

const URI_REGEX = /^http:\/\/www\.opengis\.net\/def\/crs\/(?<auth>\w+)\/.*\/(?<code>\w+)$/m;
const URN_REGEX = /^urn:ogc:def:crs:(?<auth>\w+):.*?:(?<code>\w+)$/m;


export function getLayer(map, id) {
    return map
        .getLayers()
        .getArray()
        .find(layer => layer.get('id') === id) || null;
}

export function getCrsCode(crsName) {
    if (crsName === null) {
        return 'OGC:CRS84';
    }

    const match = crsName.match(URI_REGEX) || crsName.match(URN_REGEX);

    return match !== null ? 
        `${match.groups['auth']}:${match.groups['code']}` :
        'OGC:CRS84'
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

function getCrsName(geoJson) {
    return geoJson?.crs?.properties?.name || null;
}
