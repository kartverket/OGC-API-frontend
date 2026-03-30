"""Custom pygeoapi MapScript provider backed by native PostGIS.

Expected provider configuration:
- ``data``: PostgreSQL connection string (no ``PG:`` prefix)
- ``options.layer_data``: MapServer PostGIS DATA expression

Example ``pygeoapi-config.yml`` block:

  providers:
    - type: map
      name: postgis_mapscript.PostGISMapScriptProvider
      data: "host=myhost dbname=mydb user=myuser password=mypassword"
      options:
        type: MS_LAYER_POLYGON
        layer_data: "geom FROM myschema.mytable USING UNIQUE id USING SRID=25833"
        projection: 25833
      format:
        name: png
        mimetype: image/png
"""

import logging
import os
import re

import mapscript
from mapscript import MapServerError

from pygeoapi.provider.base import BaseProvider, ProviderConnectionError
from pygeoapi.provider.mapscript_ import MapScriptProvider

LOGGER = logging.getLogger(__name__)

# CRS identifiers that are genuinely lon/lat (CRS84 axis order).
# NOTE: 'epsg:4326' and its URI/URN forms are intentionally NOT included here.
# Although they refer to the same datum as CRS84, EPSG:4326 defines axis
# order as lat/lon.  maps.py reprojects the bbox into lat/lon order when the
# collection CRS resolves to EPSG:4326, so we must swap it back before
# passing to MapScript, which always expects lon/lat.  See _EPSG4326_FORMS.
_CRS84_EQUIVALENTS = {
    'crs84',
    'ogc:crs84',
    'http://www.opengis.net/def/crs/ogc/1.3/crs84',
}

# All string forms of EPSG:4326 (lat/lon axis order).
# maps.py uses DEFAULT_CRS = 'http://www.opengis.net/def/crs/EPSG/0/4326' when
# the collection config has no explicit crs, and reprojects the incoming bbox
# into lat/lon order to match.  We must swap the bbox back to lon/lat and then
# treat the CRS as CRS84 so MapScript receives consistent coordinates.
_EPSG4326_FORMS = {
    'epsg:4326',
    'http://www.opengis.net/def/crs/epsg/0/4326',
}

_PASSWORD_PATTERN = re.compile(r'(password=)([^\s]+)', re.IGNORECASE)

# Matches OGC HTTP URIs for EPSG codes, e.g.:
#   http://www.opengis.net/def/crs/EPSG/0/25833
# maps.py passes the full URI form straight through to the provider without
# normalising it, so we must extract the EPSG code here before handing it to
# MapScriptProvider, which expects either 'CRS84' or a bare 'EPSG:<code>' string.
_OGC_HTTP_EPSG_URI = re.compile(
    r'https?://www\.opengis\.net/def/crs/epsg/[^/]+/(\d+)$',
    re.IGNORECASE,
)

# Matches OGC URN forms for EPSG codes, e.g.:
#   urn:ogc:def:crs:EPSG::25833
#   urn:ogc:def:crs:EPSG:6.9:25833
_OGC_URN_EPSG = re.compile(
    r'urn:ogc:def:crs:epsg:[^:]*:(\d+)$',
    re.IGNORECASE,
)


def _redact_connection(connection: str) -> str:
    """Mask credentials before writing connection details to logs/repr."""
    return _PASSWORD_PATTERN.sub(r'\1***', connection)


def _swap_bbox_axes(bbox):
    """Swap a bbox from lat/lon to lon/lat axis order.

    maps.py reprojects the bbox into the collection's CRS before calling the
    provider.  When the collection CRS resolves to EPSG:4326, that reprojected
    bbox arrives in lat/lon order [minLat, minLon, maxLat, maxLon].  MapScript
    always works in lon/lat, so we must flip it back.

    Input/output: [minA, minB, maxA, maxB]  →  [minB, minA, maxB, maxA]
    e.g. [57.518, 4.116, 71.205, 33.593]  →  [4.116, 57.518, 33.593, 71.205]
    """
    if not bbox or len(bbox) != 4:
        return bbox
    min_a, min_b, max_a, max_b = bbox
    return [min_b, min_a, max_b, max_a]

def _normalize_crs_identifier(crs, bbox=None):
    """Normalize a CRS identifier into a form MapScript / MapScriptProvider understands.

    Returns a (normalized_crs, bbox) tuple. The bbox may be axis-swapped when
    the incoming CRS is an EPSG:4326 variant — see axis order note below.

    MapScriptProvider.query() internally calls:
        self._epsg2projstring(int(crs.split("/")[-1]))
    for any CRS that is not the literal string 'CRS84'. This means it accepts:
      - The string 'CRS84'
      - A bare numeric string e.g. '25833'  (split("/")[-1] = '25833')
      - A full OGC HTTP URI                 (split("/")[-1] yields the code)

    It does NOT accept 'EPSG:25833' style strings — split("/")[-1] returns the
    whole thing and int() raises ValueError.

    maps.py does NOT normalise the CRS value it passes to the provider — it
    forwards whatever is in the collection config or DEFAULT_CRS verbatim.
    Incoming forms we must handle:

      - Full OGC HTTP URI : http://www.opengis.net/def/crs/EPSG/0/25833  → '25833'
      - OGC URN           : urn:ogc:def:crs:EPSG::25833                  → '25833'
      - Short authority   : EPSG:25833 / epsg:25833                      → '25833'
      - Bare integer      : 25833                                         → '25833'

    Axis order — why EPSG:4326 requires a bbox swap
    ------------------------------------------------
    maps.py sets query_args['crs'] from the collection config, defaulting to
    DEFAULT_CRS = 'http://www.opengis.net/def/crs/EPSG/0/4326'. When the
    incoming bbox-crs differs from that, maps.py calls transform_bbox() and
    delivers the bbox in EPSG:4326 lat/lon order [minLat, minLon, maxLat, maxLon].

    MapScript always works in lon/lat, so we must:
      1. Swap the bbox back to [minLon, minLat, maxLon, maxLat]
      2. Return 'CRS84' so MapScript uses the matching lon/lat projection

    This is not about what the client sent — it is about undoing the axis
    convention that maps.py applies when reprojecting into EPSG:4326.
    """
    if bbox is None:
        bbox = []

    if crs is None:
        return 'CRS84', bbox

    # Bare integer: convert to string for MapScriptProvider's split/int parse.
    if isinstance(crs, int):
        return str(crs), bbox

    if not isinstance(crs, str):
        return crs, bbox

    crs_clean = crs.strip()
    crs_lc = crs_clean.lower()

    # ------------------------------------------------------------------ CRS84 (lon/lat)
    if crs_lc in _CRS84_EQUIVALENTS:
        return 'CRS84', bbox

    if crs_lc.startswith('urn:ogc:def:crs:ogc') and crs_lc.endswith(':crs84'):
        return 'CRS84', bbox

    # ------------------------------------------------------------------ EPSG:4326 (lat/lon → swap)
    # maps.py reprojects the bbox into lat/lon order for these CRS forms.
    # Swap back to lon/lat and use CRS84 so MapScript interprets correctly.
    if crs_lc in _EPSG4326_FORMS:
        return 'CRS84', _swap_bbox_axes(bbox)

    if crs_lc.startswith('urn:ogc:def:crs:epsg') and crs_lc.endswith(':4326'):
        return 'CRS84', _swap_bbox_axes(bbox)

    # ------------------------------------------------------------------ OGC HTTP URI
    # e.g. http://www.opengis.net/def/crs/EPSG/0/25833  →  '25833'
    m = _OGC_HTTP_EPSG_URI.match(crs_lc)
    if m:
        return m.group(1), bbox

    # ------------------------------------------------------------------ OGC URN
    # e.g. urn:ogc:def:crs:EPSG::25833  →  '25833'
    m = _OGC_URN_EPSG.match(crs_lc)
    if m:
        return m.group(1), bbox

    # ------------------------------------------------------------------ short authority form
    # e.g. 'EPSG:25833' or 'epsg:25833'  →  '25833'
    if crs_lc.startswith('epsg:'):
        return crs_clean.split(':', 1)[1], bbox

    # Fall back: return the stripped original and let MapScriptProvider decide.
    return crs_clean, bbox


class PostGISMapScriptProvider(MapScriptProvider):
    """
    MapScript map provider using MapServer native PostGIS.

    The 'data' config field must be a PostgreSQL connection string:
      "host=... dbname=... user=... password=..."

    The 'layer_data' option must be a MapServer PostGIS DATA expression:
      options:
        layer_data: "geom FROM schema.table USING UNIQUE id USING SRID=xxxx"
    """

    def __init__(self, provider_def):
        # Initialize BaseProvider directly; we override layer setup below.
        BaseProvider.__init__(self, provider_def)

        self.crs_list = []
        self.styles = []
        self.default_format = 'png'

        LOGGER.debug(f'MapScript version: {mapscript.MS_VERSION}')

        layer_data = self.options.get('layer_data')
        if not layer_data:
            raise ProviderConnectionError(
                "Missing required option 'layer_data' for MapServer PostGIS provider."
            )

        layer_type_name = self.options.get('type')
        if not layer_type_name:
            raise ProviderConnectionError(
                "Missing required option 'type' (for example: MS_LAYER_POLYGON)."
            )
        if not hasattr(mapscript, layer_type_name):
            raise ProviderConnectionError(
                f"Unsupported layer type '{layer_type_name}'."
            )

        # Resolve ${VAR} placeholders if present in configuration.
        connection = os.path.expandvars(self.data)
        connection_safe = _redact_connection(connection)

        LOGGER.debug(
            f'PostGISMapScriptProvider init | connection={connection_safe!r} | layer_data={layer_data!r}'
        )

        try:
            LOGGER.debug('Creating mapObj and layerObj with native PostGIS driver')
            self._map = mapscript.mapObj()

            # Register the fontset if configured, so FONT references in .inc
            # style files resolve correctly. Without this, any FONT directive
            # causes a MapServer error and the map fails to render.
            fontset_path = self.options.get('fontset', '/pygeoapi/fonts.txt')
            if os.path.exists(fontset_path):
                self._map.setFontSet(fontset_path)
                LOGGER.debug(f'Loaded fontset from {fontset_path!r}')
            else:
                LOGGER.debug(f'No fontset found at {fontset_path!r} — FONT directives in styles will fail')
            self._layer = mapscript.layerObj(self._map)
            self._layer.status = mapscript.MS_ON

            # Use MapServer native PostGIS driver.
            self._layer.setConnectionType(mapscript.MS_POSTGIS, '')
            self._layer.connection = connection
            self._layer.data = layer_data

            LOGGER.debug(
                f'PostGISMapScriptProvider | layer.connection={connection_safe!r} '
                f'| layer.data={self._layer.data!r}'
            )

            self._layer.type = getattr(mapscript, layer_type_name)

            try:
                self.crs = int(self.options.get('projection', 4326))
            except (TypeError, ValueError) as err:
                raise ProviderConnectionError(
                    f"Invalid 'projection' value: {self.options.get('projection')!r}. Expected integer EPSG code."
                ) from err

            self._layer.setProjection(self._epsg2projstring(self.crs))
            LOGGER.debug(f'Layer projection: {self._layer.getProjection()}')

            # Apply optional style file (SLD/XML or MapServer .inc class file)
            if 'style' in self.options:
                style_path = self.options['style']
                if style_path.endswith(('xml', 'sld')):
                    LOGGER.debug('Applying SLD style')
                    with open(style_path) as fh:
                        self._layer.applySLD(fh.read(), self.options.get('layer', ''))
                elif style_path.endswith('inc'):
                    LOGGER.debug(f'Applying MapServer class file style from {style_path!r}')
                    with open(style_path) as fh:
                        class_content = fh.read()
                    # classObj.updateFromString() is unreliable with full CLASS...END
                    # blocks. The robust approach is to wrap the content in a LAYER
                    # block and call updateFromString() on the layer object, which
                    # correctly parses and attaches all CLASS definitions including
                    # EXPRESSION, LABEL, and STYLE blocks.
                    layer_snippet = f'LAYER\n{class_content}\nEND'
                    self._layer.updateFromString(layer_snippet)
                    # updateFromString resets the layer name to None — restore it
                    # using the collection name from the provider definition so
                    # MapServer error messages reference a meaningful name.
                    self._layer.name = self.name or 'postgis_layer'
                    LOGGER.debug(
                        f'Layer now has {self._layer.numclasses} class(es) after style load'
                    )
            else:
                LOGGER.debug('No style defined, applying explicit default polygon style')
                # classObj(layer) attaches the class directly to this layer.
                cls = mapscript.classObj(self._layer)
                cls.name = 'default'
                style = mapscript.styleObj(cls)
                style.color.setRGB(100, 150, 200)
                style.outlinecolor.setRGB(50, 80, 120)
                style.width = 1

        except MapServerError as err:
            LOGGER.warning(err)
            raise ProviderConnectionError(f'Cannot initialise native PostGIS map layer: {err}')

    def __repr__(self):
        safe_data = _redact_connection(os.path.expandvars(str(self.data)))
        return f'<PostGISMapScriptProvider> {safe_data}'

    def query(self, style=None, bbox=None, width=500, height=300, crs='CRS84',
              datetime_=None, format_='png', transparent=True, **kwargs):
        bbox_value = bbox if bbox is not None else []
        normalized_crs, bbox_value = _normalize_crs_identifier(crs, bbox_value)

        LOGGER.debug(
            'PostGISMapScriptProvider query | '
            f'bbox={bbox_value!r} width={width} height={height} '
            f'crs={crs!r} normalized_crs={normalized_crs!r} format={format_!r}'
        )
        return super().query(
            style=style,
            bbox=bbox_value,
            width=width,
            height=height,
            crs=normalized_crs,
            datetime_=datetime_,
            format_=format_,
            transparent=transparent,
            **kwargs,
        )
