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
from pygeoapi.provider.base import BaseProvider, ProviderConnectionError
from pygeoapi.provider.mapscript_ import MapScriptProvider

LOGGER = logging.getLogger(__name__)

# CRS identifiers that are genuinely lon/lat (CRS84 axis order).
# NOTE: 'epsg:4326' and its URI/URN forms are intentionally NOT included here.
# Although they refer to the same datum as CRS84, EPSG:4326 defines axis
# order as lat/lon.  maps.py reprojects the bbox into lat/lon order when the
# collection CRS resolves to EPSG:4326, so we must swap it back before
# passing to MapScript, which always expects lon/lat.  See _EPSG4326_FORMS.
_CRS84_FORMS = {
    'crs84', 'ogc:crs84', 
    'http://www.opengis.net/def/crs/ogc/1.3/crs84'
}

# Geographic coordinate systems that OGC/pygeoapi deliver as Lat/Lon.
# We must swap these to Lon/Lat for Mapscript.
_GEOGRAPHIC_FORMS = {
    'epsg:4326', 
    'http://www.opengis.net/def/crs/epsg/0/4326',
    'epsg:4258',
    'http://www.opengis.net/def/crs/epsg/0/4258'
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

def _swap_axes(bbox):
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
    return [bbox[1], bbox[0], bbox[3], bbox[2]]

def _normalize_crs(crs, bbox=None):
    if bbox is None: bbox = []
    if not crs: return 'CRS84', bbox

    c = str(crs).strip().lower()

    # 1. Handle Lon/Lat native forms
    if c in _CRS84_FORMS or (c.startswith('urn:ogc:def:crs:ogc') and c.endswith(':crs84')):
        return 'CRS84', bbox

    # 2. Handle Geographic Lat/Lon forms (Swap required)
    if c in _GEOGRAPHIC_FORMS or \
       (c.startswith('urn:ogc:def:crs:epsg') and (c.endswith(':4326') or c.endswith(':4258'))):
        return 'CRS84', _swap_axes(bbox)

    # 3. Handle Projected Coordinate Systems (No swap)
    match = re.search(r'(\d+)$', c)
    return match.group(1) if match else '4326', bbox

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

        connection = os.path.expandvars(self.data)
        layer_data = self.options.get('layer_data')
        layer_type = self.options.get('type')

        if not all([connection, layer_data, layer_type]):
            raise ProviderConnectionError("Missing data, layer_data, or type in config")

        try:
            self._map = mapscript.mapObj()
            
            # Load fonts if available
            fontset = self.options.get('fontset', '/pygeoapi/fonts.txt')
            if os.path.exists(fontset):
                self._map.setFontSet(fontset)

            self._layer = mapscript.layerObj(self._map)
            self._layer.status = mapscript.MS_ON
            # Use MapServer native PostGIS driver.
            self._layer.setConnectionType(mapscript.MS_POSTGIS, '')
            self._layer.connection = connection
            self._layer.data = layer_data

            self._layer.type = getattr(mapscript, layer_type)
            
            # Internal projection setup
            self.crs = int(self.options.get('projection', 4326))
            self._layer.setProjection(self._epsg2projstring(self.crs))
            LOGGER.debug(f'Layer projection: {self._layer.getProjection()}')

            # Styling
            if 'style' in self.options:
                style_path = self.options['style']
                with open(style_path) as f:
                    content = f.read()
                if style_path.endswith(('xml', 'sld')):
                    
                    self._layer.applySLD(content, self.options.get('layer', ''))
                elif style_path.endswith('inc'):
                    self._layer.updateFromString(f'LAYER\n{content}\nEND')
                    self._layer.name = self.name or 'postgis_layer'
            else:
                cls = mapscript.classObj(self._layer)
                style = mapscript.styleObj(cls)
                style.color.setRGB(100, 150, 200)
                style.outlinecolor.setRGB(50, 80, 120)
                style.width = 1

        except Exception as e:
            raise ProviderConnectionError(f'MapScript Init Error: {e}')

    def query(self, bbox=None, width=500, height=300, crs='CRS84', format_='png', transparent=True, **kwargs):
        norm_crs, norm_bbox = _normalize_crs(crs, bbox)

        # Set Map Projection
        if norm_crs == 'CRS84':
            self._map.setProjection("EPSG:4326")
            self._map.units = mapscript.MS_DD
        else:
            self._map.setProjection(f"EPSG:{norm_crs}")
            self._map.units = mapscript.MS_METERS

        self._map.setExtent(*norm_bbox)
        self._map.setSize(width, height)
        self._map.setConfigOption('MS_NONSQUARE', 'yes')
        
        self._map.selectOutputFormat(format_)
        out = self._map.outputformat
        out.transparent = mapscript.MS_ON if transparent else mapscript.MS_OFF

        try:
            img = self._map.draw()
            return img.getBytes()
        except Exception as e:
            from pygeoapi.provider.base import ProviderQueryError
            raise ProviderQueryError(f'Render Error: {e}')