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

_CRS84_EQUIVALENTS = {
    'crs84',
    'ogc:crs84',
    'epsg:4326',
    'http://www.opengis.net/def/crs/ogc/1.3/crs84',
    'http://www.opengis.net/def/crs/epsg/0/4326',
}
_PASSWORD_PATTERN = re.compile(r'(password=)([^\s]+)', re.IGNORECASE)


def _redact_connection(connection: str) -> str:
    """Mask credentials before writing connection details to logs/repr."""
    return _PASSWORD_PATTERN.sub(r'\1***', connection)


def _normalize_crs_identifier(crs):
    """Normalize common CRS84/4326 aliases to CRS84 for MapScript query path."""
    if crs is None:
        return 'CRS84'

    if isinstance(crs, int):
        return 'CRS84' if crs == 4326 else crs

    if not isinstance(crs, str):
        return crs

    crs_clean = crs.strip()
    crs_lc = crs_clean.lower()

    if crs_lc in _CRS84_EQUIVALENTS:
        return 'CRS84'

    if crs_lc.startswith('urn:ogc:def:crs:epsg') and crs_lc.endswith(':4326'):
        return 'CRS84'

    if crs_lc.startswith('urn:ogc:def:crs:ogc') and crs_lc.endswith(':crs84'):
        return 'CRS84'

    return crs_clean


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
                    LOGGER.debug('Applying MapServer class file style')
                    cls = mapscript.classObj(self._layer)
                    with open(style_path) as fh:
                        cls.updateFromString(fh.read())
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
        normalized_crs = _normalize_crs_identifier(crs)

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

