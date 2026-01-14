import { getLayer, parseBbox, transformExtent } from '@/utils/map/helpers';

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
