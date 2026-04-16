"""
OGC API – Processes: Export a collection filtered by fylke or kommune
──────────────────────────────────────────────────────────────────────
Fetches the boundary geometry of the named fylke (or kommune) from the
OGC API Features endpoint (/collections/{id}/items), then runs an
ST_Within query against the target PostGIS collection.

Note: ST_Within returns features fully contained within the area boundary.
Features that straddle the boundary are excluded. Use export-by-area-gpkg
with ST_Intersects behaviour if you need those edge cases included.
...
"""

import logging
from pygeoapi.process.base import BaseProcessor, ProcessorExecuteError
from .export_utils import (
    load_config,
    get_postgis_collections,
    read_collection_by_area,
    get_area_geometry,
    gdf_to_gpkg_bytes,
)

LOGGER = logging.getLogger(__name__)

# ── Adapt these to your collection IDs and column names ──────────────────────
AREA_CONFIG = {
    'fylke':   {'collection': 'fylker',   'default_field': 'fylkesnavn'},
    'kommune': {'collection': 'kommuner', 'default_field': 'kommunenavn'},
}
# ─────────────────────────────────────────────────────────────────────────────

PROCESS_METADATA = {
    'version': '0.1.0',
    'id': 'export-by-area-gpkg',
    'title': {'en': 'Export collection by area (fylke/kommune) as GeoPackage'},
    'description': {
        'en': (
            'Performs a spatial intersection of a named collection against a '
            'fylke or kommune boundary and returns the matching features as a '
            'GeoPackage file.'
        )
    },
    'jobControlOptions': ['sync-execute', 'async-execute'],
    'outputTransmission': ['value'],
    'keywords': ['gpkg', 'geopackage', 'fylke', 'kommune', 'filter', 'download'],
    'links': [],
    'inputs': {
        'collection_id': {
            'title': 'Collection ID',
            'description': 'ID of the collection to export',
            'schema': {'type': 'string'},
            'minOccurs': 1,
            'maxOccurs': 1,
        },
        'area_type': {
            'title': 'Area type',
            'description': '"fylke" or "kommune"',
            'schema': {'type': 'string', 'enum': ['fylke', 'kommune']},
            'minOccurs': 1,
            'maxOccurs': 1,
        },
        'area_name': {
            'title': 'Area name',
            'description': 'Name of the fylke or kommune to filter by',
            'schema': {'type': 'string'},
            'minOccurs': 1,
            'maxOccurs': 1,
        },
        'area_name_field': {
            'title': 'Area name field (optional)',
            'description': (
                'Column name in the area table to match area_name against. '
                'Defaults to "navn".'
            ),
            'schema': {'type': 'string'},
            'minOccurs': 0,
            'maxOccurs': 1,
        },
    },
    'outputs': {
        'result': {
            'title': 'GeoPackage file',
            'description': 'Spatially filtered GeoPackage',
            'schema': {
                'type': 'string',
                'contentMediaType': 'application/geopackage+sqlite3',
                'contentEncoding': 'binary',
            },
        }
    },
    'example': {
        'inputs': {
            'collection_id': 'roads',
            'area_type': 'fylke',
            'area_name': 'Vestland',
        }
    },
}


class ExportByAreaGpkgProcessor(BaseProcessor):

    def __init__(self, processor_def):
        super().__init__(processor_def, PROCESS_METADATA)

    def execute(self, data, outputs=None, **kwargs):
        collection_id = data.get('collection_id', '').strip()
        area_type     = data.get('area_type', '').strip().lower()
        area_name     = data.get('area_name', '').strip()

        # Validate inputs
        if not collection_id:
            raise ProcessorExecuteError('collection_id is required')
        if area_type not in AREA_CONFIG:
            raise ProcessorExecuteError(
                f"area_type must be one of: {', '.join(AREA_CONFIG)}"
            )
        if not area_name:
            raise ProcessorExecuteError('area_name is required')

        area_cfg   = AREA_CONFIG[area_type]
        name_field = data.get('area_name_field', '').strip() or area_cfg['default_field']

        config = load_config()
        collections = get_postgis_collections(config)

        if collection_id not in collections:
            raise ProcessorExecuteError(
                f"Collection '{collection_id}' not found. "
                f"Available: {', '.join(collections)}"
            )
        if area_cfg['collection'] not in collections:
            raise ProcessorExecuteError(
                f"Area collection '{area_cfg['collection']}' not found in config. "
                f"Update AREA_CONFIG in {__file__}."
            )

        # ── Step 1: resolve the area geometry from its own PostGIS table ──
        LOGGER.info('Looking up %s geometry for: %s', area_type, area_name)
        try:
            wkt = get_area_geometry(
                config,
                area_collection=area_cfg['collection'],
                field_name=name_field,
                field_value=area_name,
            )
        except Exception as exc:
            raise ProcessorExecuteError(f'Area lookup failed: {exc}') from exc

        if wkt is None:
            raise ProcessorExecuteError(
                f"No {area_type} found with {name_field} = '{area_name}'. "
                f"Check spelling or area_name_field."
            )

        # ── Step 2: spatially filter the target collection ─────────────────
        LOGGER.info(
            'Filtering %s by %s "%s"', collection_id, area_type, area_name
        )
        try:
            gdf = read_collection_by_area(
                collections[collection_id],
                area_geom_wkt=wkt,
                area_srid=4326,
                buffer_metres=1,
            )
        except Exception as exc:
            LOGGER.exception('Spatial filter failed')
            raise ProcessorExecuteError(f'Spatial filter failed: {exc}') from exc

        if gdf.empty:
            raise ProcessorExecuteError(
                f"No features in '{collection_id}' intersect "
                f"{area_type} '{area_name}'."
            )

        # ── Step 3: serialise to GPKG ──────────────────────────────────────
        layer_name = f'{collection_id}_{area_type}_{area_name}'.replace(' ', '_')
        try:
            gpkg_bytes = gdf_to_gpkg_bytes(gdf, layer_name=layer_name)
        except Exception as exc:
            raise ProcessorExecuteError(f'GPKG creation failed: {exc}') from exc

        LOGGER.info(
            'Done: %d features, %.1f KB', len(gdf), len(gpkg_bytes) / 1024
        )
        return 'application/geopackage+sqlite3', gpkg_bytes

    def __repr__(self):
        return '<ExportByAreaGpkgProcessor>'
