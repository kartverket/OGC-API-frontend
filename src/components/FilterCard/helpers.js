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

export function parseBboxStr(bboxStr) {
    if (bboxStr === null) {
        return null;
    }

    return bboxStr.split(',').map(coordinate => parseFloat(coordinate));
}

export function validateBbox(bbox) {    
    if (!Array.isArray(bbox) || bbox.length !== 4) {
        return false;
    }

    const [minLon, minLat, maxLon, maxLat] = bbox;

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