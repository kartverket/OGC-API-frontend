"""
OGC API – Processes: Export a collection as CSV with WKB geometry
─────────────────────────────────────────────────────────────────
The geometry column is hex-encoded WKB so the file stays plain-text CSV
while still carrying full geometry fidelity. Consumers can decode it with
e.g. geopandas.GeoDataFrame.from_wkb() or ST_GeomFromWKB() in PostGIS.

POST /processes/export-collection-csv/execution
{
    "inputs": {
        "collection_id": "my_collection",
        "area_type":     "fylke",      -- optional spatial filter
        "area_name":     "Vestland"    -- required if area_type given
    }
}
Returns: text/csv
"""

import logging
from pygeoapi.process.base import BaseProcessor, ProcessorExecuteError
from .export_utils import (
    load_config,
    get_postgis_collections,
    read_collection,
    read_collection_by_area,
    get_area_geometry,
    gdf_to_csv_bytes,
)

LOGGER = logging.getLogger(__name__)

AREA_CONFIG = {
    'fylke':   {'collection': 'fylker',   'default_field': 'fylkesnavn'},
    'kommune': {'collection': 'kommuner', 'default_field': 'fylkesnavn'},
}

PROCESS_METADATA = {
    'version': '0.1.0',
    'id': 'export-collection-csv',
    'title': {'en': 'Export collection as CSV (WKB geometry)'},
    'description': {
        'en': (
            'Exports a collection to a comma-separated CSV file. The geometry '
            'is encoded as a hex WKB blob in a column named "geometry_wkb". '
            'An optional spatial filter by fylke or kommune can be applied.'
        )
    },
    'jobControlOptions': ['sync-execute', 'async-execute'],
    'outputTransmission': ['value'],
    'keywords': ['csv', 'export', 'wkb', 'download'],
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
            'title': 'Area type (optional)',
            'description': 'Filter by "fylke" or "kommune". Omit for full export.',
            'schema': {'type': 'string', 'enum': ['fylke', 'kommune']},
            'minOccurs': 0,
            'maxOccurs': 1,
        },
        'area_name': {
            'title': 'Area name (required if area_type given)',
            'description': 'Name of the fylke or kommune',
            'schema': {'type': 'string'},
            'minOccurs': 0,
            'maxOccurs': 1,
        },
    },
    'outputs': {
        'result': {
            'title': 'CSV file',
            'description': 'CSV with attribute columns and a geometry_wkb column',
            'schema': {
                'type': 'string',
                'contentMediaType': 'text/csv',
            },
        }
    },
    'example': {
        'inputs': {'collection_id': 'my_collection'}
    },
}


class ExportCollectionCsvProcessor(BaseProcessor):

    def __init__(self, processor_def):
        super().__init__(processor_def, PROCESS_METADATA)

    def execute(self, data, outputs=None, **kwargs):
        collection_id = data.get('collection_id', '').strip()
        area_type     = data.get('area_type', '').strip().lower() or None
        area_name     = data.get('area_name', '').strip() or None

        if not collection_id:
            raise ProcessorExecuteError('collection_id is required')
        if area_type and area_type not in AREA_CONFIG:
            raise ProcessorExecuteError(
                f"area_type must be one of: {', '.join(AREA_CONFIG)}"
            )
        if area_type and not area_name:
            raise ProcessorExecuteError('area_name is required when area_type is given')

        config = load_config()
        collections = get_postgis_collections(config)

        if collection_id not in collections:
            raise ProcessorExecuteError(
                f"Collection '{collection_id}' not found. "
                f"Available: {', '.join(collections)}"
            )

        coll_info = collections[collection_id]

        # ── Optional spatial filter ────────────────────────────────────────
        if area_type:
            area_cfg = AREA_CONFIG[area_type]
            if area_cfg['collection'] not in collections:
                raise ProcessorExecuteError(
                    f"Area collection '{area_cfg['collection']}' not in config."
                )
            wkt = get_area_geometry(
                config,
                area_collection=area_cfg['collection'],
                field_name=area_cfg['default_field'],
                field_value=area_name,
            )
            if wkt is None:
                raise ProcessorExecuteError(
                    f"No {area_type} found with navn = '{area_name}'."
                )
            LOGGER.info(
                'Exporting %s filtered to %s "%s" as CSV',
                collection_id, area_type, area_name,
            )
            gdf = read_collection_by_area(
                collections[collection_id],
                area_geom_wkt=wkt,
                area_srid=4326,
                buffer_metres=1,
            )
        else:
            LOGGER.info('Exporting %s as CSV (full collection)', collection_id)
            gdf = read_collection(coll_info)

        if gdf.empty:
            raise ProcessorExecuteError(
                f"Collection '{collection_id}' returned no features "
                + (f"for {area_type} '{area_name}'." if area_type else '.')
            )

        try:
            csv_bytes = gdf_to_csv_bytes(gdf, geom_col=coll_info['geom_field'])
        except Exception as exc:
            LOGGER.exception('CSV serialisation failed')
            raise ProcessorExecuteError(f'CSV creation failed: {exc}') from exc

        LOGGER.info(
            'CSV for %s: %d rows, %.1f KB',
            collection_id, len(gdf), len(csv_bytes) / 1024,
        )
        return 'text/csv', csv_bytes

    def __repr__(self):
        return '<ExportCollectionCsvProcessor>'
