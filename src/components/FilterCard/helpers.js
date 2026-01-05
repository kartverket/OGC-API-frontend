import { getLayer, transformExtent } from '@/utils/map/helpers';

export function getFields(selectedFilters, queryables) {
    return Object
        .keys(queryables.properties)
        .filter(key => key !== 'geometry' && !selectedFilters.some(filter => filter.field === key))
}

export function getControlTypeFromField(selectedField, queryables) {
    if (selectedField === '') {
        return 'text';
    }

    const [, property] = Object.entries(queryables.properties)
        .find(entry => entry[0] === selectedField);

    const { type, format } = property;

    switch (type) {
        case 'integer':
            return 'number'
        case 'string':
            if (format === 'date-time') {
                return 'datetime-local';
            } else if (format === 'date') {
                return 'date';
            } else {
                return 'text';
            }
        case 'boolean':
            return 'bool';
        default:
            return 'text';
    }
}

export function getFeaturesExtent(map) {
    const vectorLayer = getLayer(map, 'features');
    const vectorSource = vectorLayer.getSource();
    const extent = vectorSource.getExtent();

    return extent;
}

export function getBboxExtent(bbox) {
    const parsed = parseBbox(bbox);
    const transformed = transformExtent(parsed, 'EPSG:4326', 'EPSG:3857');

    return transformed;
}

export function getMapViewBounds(map) {
    const view = map.getView();
    const extent = view.calculateExtent(map.getSize());

    return transformExtent(extent, 'EPSG:3857', 'EPSG:4326', 6);
}

export function isWithinBounds(coordinate, index, viewBounds) {
    const parsed = Number.parseFloat(coordinate);

    return index === 0 || index === 1 ?
        parsed >= viewBounds[index] :
        parsed <= viewBounds[index];
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