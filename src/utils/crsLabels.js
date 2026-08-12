/**
 * Pure CRS label utilities — no OL imports, safe for SSR.
 */

const URI_REGEX = /^http:\/\/www\.opengis\.net\/def\/crs\/(?<auth>\w+)\/.*\/(?<code>\w+)$/m;
const URN_REGEX = /^urn:ogc:def:crs:(?<auth>\w+):.*?:(?<code>\w+)$/m;

function parseCrsCode(crsUri) {
    if (!crsUri) return 'OGC:CRS84';
    const match = crsUri.match(URI_REGEX) || crsUri.match(URN_REGEX);
    return match ? `${match.groups.auth}:${match.groups.code}` : 'OGC:CRS84';
}

const CRS_DESCRIPTIONS = {
    'OGC:CRS84':   'WGS84 Lon/Lat',
    'OGC:CRS84H':  'WGS84 Lon/Lat + høyde',
    'EPSG:4326':   'WGS84 Lat/Lon',
    'EPSG:4258':   'ETRS89 Lat/Lon',
    'EPSG:3857':   'Web Mercator',
    'EPSG:900913': 'Web Mercator (Google)',
    // ETRS89 UTM (25829–25836)
    'EPSG:25829': 'UTM sone 29N (ETRS89)',
    'EPSG:25830': 'UTM sone 30N (ETRS89)',
    'EPSG:25831': 'UTM sone 31N (ETRS89)',
    'EPSG:25832': 'UTM sone 32N (ETRS89)',
    'EPSG:25833': 'UTM sone 33N (ETRS89)',
    'EPSG:25834': 'UTM sone 34N (ETRS89)',
    'EPSG:25835': 'UTM sone 35N (ETRS89)',
    'EPSG:25836': 'UTM sone 36N (ETRS89)',
    // WGS84 UTM (32629–32636)
    'EPSG:32629': 'UTM sone 29N (WGS84)',
    'EPSG:32630': 'UTM sone 30N (WGS84)',
    'EPSG:32631': 'UTM sone 31N (WGS84)',
    'EPSG:32632': 'UTM sone 32N (WGS84)',
    'EPSG:32633': 'UTM sone 33N (WGS84)',
    'EPSG:32634': 'UTM sone 34N (WGS84)',
    'EPSG:32635': 'UTM sone 35N (WGS84)',
    'EPSG:32636': 'UTM sone 36N (WGS84)',
    // ED50 UTM (23029–23036)
    'EPSG:23029': 'UTM sone 29N (ED50)',
    'EPSG:23030': 'UTM sone 30N (ED50)',
    'EPSG:23031': 'UTM sone 31N (ED50)',
    'EPSG:23032': 'UTM sone 32N (ED50)',
    'EPSG:23033': 'UTM sone 33N (ED50)',
    'EPSG:23034': 'UTM sone 34N (ED50)',
    'EPSG:23035': 'UTM sone 35N (ED50)',
    'EPSG:23036': 'UTM sone 36N (ED50)',
    // ETRS89 UTM aliases
    'EPSG:3046': 'UTM sone 34N (ETRS89)',
    'EPSG:3047': 'UTM sone 35N (ETRS89)',
    // UTM + NN2000 høyde
    'EPSG:5972': 'UTM sone 32N + NN2000',
    'EPSG:5973': 'UTM sone 33N + NN2000',
    'EPSG:5975': 'UTM sone 35N + NN2000',
    // SWEREF99
    'EPSG:3006': 'SWEREF99 TM',
    // Svenske RT90 TM-soner
    'EPSG:3007': 'RT90 TM 7,5°V',
    'EPSG:3008': 'RT90 TM 5°V',
    'EPSG:3009': 'RT90 TM 2,5°V',
    'EPSG:3010': 'RT90 TM 0°',
    'EPSG:3011': 'RT90 TM 2,5°Ø',
    'EPSG:3012': 'RT90 TM 5°Ø',
    // Norsk TM (Bessel)
    'EPSG:3029': 'NGO48 Akse I',
    'EPSG:3030': 'NGO48 Akse II',
    // ETRS89 pan-europeisk
    'EPSG:3034': 'Lambert Konform (ETRS89)',
    'EPSG:3035': 'Lambert Areabevarende (ETRS89)',
    // Polar
    'EPSG:3031': 'Antarktisk Polar Stereografisk',
    'EPSG:3032': 'Australsk Antarktisk Stereografisk',
    'EPSG:3033': 'Australsk Antarktisk Lambert',
    'EPSG:3036': 'UTM sone 36S (WGS84)',
    'EPSG:3575': 'Nordpol Lambert (WGS84)',
};

/**
 * Return a human-readable label for a CRS URI, e.g.
 * "EPSG:25833 (UTM sone 33N (ETRS89))".
 * Falls back to just the code for unrecognised CRS.
 */
export function getCrsLabel(crsUri) {
    const code = parseCrsCode(crsUri);

    if (CRS_DESCRIPTIONS[code]) {
        return `${code} (${CRS_DESCRIPTIONS[code]})`;
    }

    // NTM soner 5–30: EPSG:5105–5130
    const ntmMatch = code.match(/^EPSG:51(\d{2})$/);
    if (ntmMatch) {
        const zone = parseInt(ntmMatch[1], 10);
        if (zone >= 5 && zone <= 30) {
            return `${code} (NTM sone ${zone})`;
        }
    }

    // NTM + NN2000 høyde: EPSG:5950–5970
    const ntmHMatch = code.match(/^EPSG:59([5-9]\d)$/);
    if (ntmHMatch) {
        const zone = parseInt(ntmHMatch[1], 10) - 40;
        if (zone >= 10 && zone <= 30) {
            return `${code} (NTM sone ${zone} + NN2000)`;
        }
    }

    return code;
}
