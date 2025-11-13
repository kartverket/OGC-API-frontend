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