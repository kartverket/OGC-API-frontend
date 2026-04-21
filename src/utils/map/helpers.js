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

export function getFeature(map, id) {
    const vectorLayer = getLayer(map, 'features');
    const vectorSource = vectorLayer.getSource();
    
    return vectorSource.getFeatures()
        .find(feature => feature.getId() === id) || null;
}

export function zoomToFeature(map, id) {
    const feature = getFeature(map, id);

    if (feature !== null) {
        const geometry = feature.getGeometry();
        const view = map.getView();

        view.fit(geometry, { padding: [50, 50, 50, 50], duration: 500 });
    }
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