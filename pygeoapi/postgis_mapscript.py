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
from pygeoapi.crs import get_crs, get_srid

LOGGER = logging.getLogger(__name__)

_PASSWORD_PATTERN = re.compile(r'(password=)([^\s]+)', re.IGNORECASE)


def _redact_connection(connection: str) -> str:
    """Mask credentials before writing connection details to logs/repr."""
    return _PASSWORD_PATTERN.sub(r'\1***', connection)


def _swap_bbox_axes(bbox):
    """Convert [min1, min2, max1, max2] from axis1/axis2 to x/y order."""
    if not bbox or len(bbox) != 4:
        return bbox
    return [bbox[1], bbox[0], bbox[3], bbox[2]]


def _crs_uses_lat_lon_axis_order(crs_obj) -> bool:
    """Return True when a CRS defines its first axis as latitude/northing."""
    try:
        axis_info = getattr(crs_obj, 'axis_info', None) or []
        if len(axis_info) < 2:
            return False

        first_direction = (axis_info[0].direction or '').lower()
        second_direction = (axis_info[1].direction or '').lower()
        return first_direction in ('north', 'south') and second_direction in ('east', 'west')
    except Exception:
        return False


def _normalize_crs_and_bbox(crs, bbox):
    """Normalize CRS identifier and bbox to MapServer's expected x,y extent order.

    :param crs: CRS identifier (URI, URN, or string)
    :param bbox: Bounding box coordinates in the request CRS axis order
    :returns: tuple of (map_projection, bbox_in_xy_order, is_geographic)
    """
    if not crs or not bbox:
        return 'EPSG:4326', bbox, True
    
    LOGGER.info(f'_normalize_crs_and_bbox input - CRS: {crs}, bbox: {bbox}')
    
    try:
        crs_obj = get_crs(crs)
        epsg_code = get_srid(crs_obj)
        LOGGER.info(f'Parsed CRS to EPSG:{epsg_code}')

        crs_lower = str(crs).lower()
        if 'crs84' in crs_lower:
            LOGGER.info('CRS84 request - bbox already in lon/lat order')
            return 'EPSG:4326', bbox, True

        if _crs_uses_lat_lon_axis_order(crs_obj):
            bbox_xy = _swap_bbox_axes(bbox)
            LOGGER.info(f'Lat-first geographic CRS detected - swapped bbox to x/y order: {bbox_xy}')
        else:
            bbox_xy = bbox
            LOGGER.info('CRS already uses x/y axis order - bbox kept as-is')

        is_geographic = getattr(crs_obj, 'is_geographic', False)
        if epsg_code:
            return f'EPSG:{epsg_code}', bbox_xy, is_geographic

        LOGGER.warning('Could not extract SRID - falling back to EPSG:4326')
        return 'EPSG:4326', bbox_xy, True
    except Exception as e:
        LOGGER.warning(f'CRS parsing failed for {crs!r}: {e}. Using EPSG:4326 as fallback.')
        return 'EPSG:4326', bbox, True

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
        LOGGER.info(f'PostGISMapScriptProvider.query() called: bbox={bbox}, width={width}, height={height}, crs={crs}, format={format_}, transparent={transparent}')
        map_crs, norm_bbox, is_geographic = _normalize_crs_and_bbox(crs, bbox)
        LOGGER.info(f'After normalization: map_crs={map_crs}, norm_bbox={norm_bbox}, is_geographic={is_geographic}')

        # Set Map Projection
        self._map.setProjection(map_crs)
        if is_geographic:
            self._map.units = mapscript.MS_DD
            LOGGER.info(f'Map projection set to {map_crs} (geographic)')
        else:
            self._map.units = mapscript.MS_METERS
            LOGGER.info(f'Map projection set to {map_crs} (projected)')

        self._map.setExtent(*norm_bbox)
        LOGGER.info(f'Map extent set to: {norm_bbox}')
        self._map.setSize(width, height)
        self._map.setConfigOption('MS_NONSQUARE', 'yes')
        
        self._map.selectOutputFormat(format_)
        out = self._map.outputformat
        out.transparent = mapscript.MS_ON if transparent else mapscript.MS_OFF
        LOGGER.info(f'Output format: {format_}, transparent={transparent}')

        try:
            img = self._map.draw()
            img_bytes = img.getBytes()
            LOGGER.info(f'Map rendered successfully, image size: {len(img_bytes)} bytes')
            return img_bytes
        except Exception as e:
            LOGGER.error(f'Map rendering error: {e}', exc_info=True)
            from pygeoapi.provider.base import ProviderQueryError
            raise ProviderQueryError(f'Render Error: {e}')