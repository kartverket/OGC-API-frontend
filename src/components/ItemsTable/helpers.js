import { sort } from 'fast-sort';

export function getLimit(searchParams) {
    const limit = searchParams.get('limit');
    const parsed = parseInt(limit);

    return !isNaN(parsed) && parsed > 0 ?
        parsed :
        0;
}

export function getOffset(searchParams) {
    const offset = searchParams.get('offset')
    const parsed = parseInt(offset);

    return !isNaN(parsed) && parsed > 0 ?
        parsed :
        0;
}

export function getLimits(searchParams, defaultLimits) {
    const limit = getLimit(searchParams).toString();
    const entries = Object.entries(defaultLimits);

    if (!(limit in defaultLimits) && limit > 0 && limit < entries[entries.length - 1][0]) {
        entries.push([limit, limit]);
    }

    return sort(entries).asc(limit => parseInt(limit[0]));
}

export function getCurrentPage(searchParams) {
    const offset = getOffset(searchParams);

    if (offset === 0) {
        return 1;
    }

    const limit = getLimit(searchParams);

    return (offset / limit) + 1;
}

export function getItemsShowingText(searchParams, defaultLimits, data) {
    const offset = getOffset(searchParams);
    const limit = getLimit(searchParams) || Object.keys(defaultLimits)[0];

    if (limit.toString() === '1') {
        return `${offset} av ${data.numberMatched} items`;
    }

    return `${offset + 1} - ${offset + data.numberReturned} av ${data.numberMatched} items`;    
}
