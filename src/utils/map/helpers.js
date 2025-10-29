const EPSG_REGEX = /^(http:\/\/www\.opengis\.net\/def\/crs\/EPSG\/0\/|^urn:ogc:def:crs:EPSG::|^EPSG:)(?<epsg>\d+)$/m;

export function getLayer(map, id) {
    return map
        .getLayers()
        .getArray()
        .find(layer => layer.get('id') === id) || null;
}

export function getProjection(geoJson) {
    const crsName = getCrsName(geoJson);
    let epsgCode = 4326;

    if (crsName !== null) {
        epsgCode = getEpsgCode(crsName) || 4326;
    }

    return `EPSG:${epsgCode}`;
}

function getCrsName(geoJson) {
    return geoJson?.crs?.properties?.name || null;
}

function getEpsgCode(crsName) {
    const match = EPSG_REGEX.exec(crsName);

    return match !== null ?
        match.groups.epsg :
        null;
}

