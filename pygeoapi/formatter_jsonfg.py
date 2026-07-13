"""JSON-FG output formatter for pygeoapi."""

from copy import deepcopy

from pygeoapi.formatter.base import BaseFormatter

# OGC:CRS84 and CRS84h — when geometry is in these CRSs,
# it stays in "geometry" and "place" must be null.
_WGS84_CRSS = {
    'http://www.opengis.net/def/crs/OGC/1.3/CRS84',
    'http://www.opengis.net/def/crs/OGC/1.3/CRS84h',
    'http://www.opengis.net/def/crs/OGC/0/CRS84',
    'http://www.opengis.net/def/crs/OGC/0/CRS84h',
    'http://www.opengis.net/def/crs/EPSG/0/4326',
}

_CONFORMANCE_URI = (
    'http://www.opengis.net/spec/json-fg-1/1.0/conf/core'
)

_TYPES_SCHEMAS_URI = (
    'http://www.opengis.net/spec/json-fg-1/1.0/conf/types-schemas'
)


class JsonFgFormatter(BaseFormatter):
    """JSON-FG (OGC Features and Geometries JSON) formatter.

    Converts GeoJSON FeatureCollection/Feature responses to JSON-FG format
    per the OGC Features and Geometries JSON standard (OGC 21-045r1).
    """

    def __init__(self, formatter_def):
        """Initialize formatter."""

        super().__init__({'name': 'jsonfg', 'geom': None})
        self.f = 'jsonfg'
        self.mimetype = 'application/vnd.ogc.fg+json'
        self.attachment = False
        self.extension = 'jsonfg.json'

    def write(self, options=None, data=None):
        """Transform GeoJSON to JSON-FG.

        :param options: formatter options
        :param data: GeoJSON dict (FeatureCollection or Feature)

        :returns: JSON-FG dict
        """

        if options is None:
            options = {}

        if data is None:
            return {}

        result = deepcopy(data)

        # Determine if the response CRS is WGS84-based.
        # CRS can be passed explicitly via options['crs_uri'], or
        # detected from the Content-Crs header value in options['content_crs'].
        is_wgs84 = True
        crs_uri = options.get('crs_uri') or options.get('content_crs')

        if crs_uri:
            # Strip angle brackets if present (Content-Crs: <uri>)
            crs_uri = crs_uri.strip('<>')
            if crs_uri not in _WGS84_CRSS:
                is_wgs84 = False

        if result.get('type') == 'FeatureCollection':
            result['conformsTo'] = [_CONFORMANCE_URI]
            feature_type = self._extract_feature_type(result)
            if feature_type:
                result['conformsTo'].append(_TYPES_SCHEMAS_URI)
                result['featureType'] = feature_type
            if not is_wgs84 and crs_uri:
                result['coordRefSys'] = crs_uri
            # featureType on the collection applies to all features;
            # do NOT repeat it on individual features
            for feature in result.get('features', []):
                self._transform_feature(feature, is_wgs84)
        elif result.get('type') == 'Feature':
            result['conformsTo'] = [_CONFORMANCE_URI]
            feature_type = self._extract_feature_type(result)
            if feature_type:
                result['conformsTo'].append(_TYPES_SCHEMAS_URI)
                result['featureType'] = feature_type
            if not is_wgs84 and crs_uri:
                result['coordRefSys'] = crs_uri
            self._transform_feature(result, is_wgs84)

        return result

    def _transform_feature(self, feature, is_wgs84=True):
        """Transform a single GeoJSON feature to JSON-FG format.

        Per the JSON-FG spec:
        - If CRS is CRS84/CRS84h: geometry stays in "geometry", "place" is null
        - If CRS is non-WGS84: geometry goes to "place", "geometry" is null

        :param feature: GeoJSON Feature dict (modified in place)
        :param is_wgs84: whether the geometry CRS is WGS84-based
        """

        # Add 'time' member (null if no temporal info)
        if 'time' not in feature:
            feature['time'] = None

        # Handle geometry/place based on CRS
        if is_wgs84:
            # CRS84: geometry stays, place is null
            feature['place'] = None
        else:
            # Non-WGS84: move geometry to place, set geometry to null
            feature['place'] = feature.get('geometry')
            feature['geometry'] = None

    def _extract_feature_type(self, data):
        """Extract the collection/feature type from links or properties.

        :param data: GeoJSON dict (Feature or FeatureCollection)
        :returns: feature type string or None
        """

        # Try to get from the 'collection' link
        for link in data.get('links', []):
            if link.get('rel') == 'collection':
                href = link.get('href', '')
                # Extract collection name from URL path
                parts = href.rstrip('/').split('/')
                if parts:
                    return parts[-1]

        return None
