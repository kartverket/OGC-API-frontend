const URI_REGEX = /^http:\/\/www\.opengis\.net\/def\/crs\/(?<auth>\w+)\/.*\/(?<code>\w+)$/m;
const URN_REGEX = /^urn:ogc:def:crs:(?<auth>\w+):.*?:(?<code>\w+)$/m;

export function getCrsCode(value) {
    const match = value.match(URI_REGEX) || value.match(URN_REGEX);

    return match !== null ? 
        `${match.groups['auth']}:${match.groups['code']}` :
        'OGC:CRS84'
}