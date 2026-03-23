"""
OGC API – Processes: Export a single collection as GeoPackage
─────────────────────────────────────────────────────────────
POST /processes/export-collection-gpkg/execution
{
    "inputs": { "collection_id": "my_collection" }
}
Returns: application/geopackage+sqlite3 binary
"""

import logging
from pygeoapi.process.base import BaseProcessor, ProcessorExecuteError
from .export_utils import (
    load_config,
    get_postgis_collections,
    read_collection,
    gdf_to_gpkg_bytes,
)

LOGGER = logging.getLogger(__name__)

PROCESS_METADATA = {
    'version': '0.1.0',
    'id': 'export-collection-gpkg',
    'title': {'en': 'Export collection as GeoPackage'},
    'description': {
        'en': (
            'Exports all features from a single OGC API collection to a '
            'GeoPackage file (.gpkg). The collection must be backed by a '
            'PostgreSQL/PostGIS provider.'
        )
    },
    'jobControlOptions': ['sync-execute', 'async-execute'],
    'outputTransmission': ['value'],
    'keywords': ['gpkg', 'geopackage', 'export', 'download'],
    'links': [],
    'inputs': {
        'collection_id': {
            'title': 'Collection ID',
            'description': 'ID of the collection to export (as it appears in the API)',
            'schema': {'type': 'string'},
            'minOccurs': 1,
            'maxOccurs': 1,
        }
    },
    'outputs': {
        'result': {
            'title': 'GeoPackage file',
            'description': 'Binary GeoPackage containing all features',
            'schema': {
                'type': 'string',
                'contentMediaType': 'application/geopackage+sqlite3',
                'contentEncoding': 'binary',
            },
        }
    },
    'example': {
        'inputs': {'collection_id': 'my_collection'}
    },
}


class ExportCollectionGpkgProcessor(BaseProcessor):

    def __init__(self, processor_def):
        super().__init__(processor_def, PROCESS_METADATA)

    def execute(self, data, outputs=None, **kwargs):
        collection_id = data.get('collection_id', '').strip()
        if not collection_id:
            raise ProcessorExecuteError('collection_id is required')

        config = load_config()
        collections = get_postgis_collections(config)

        if collection_id not in collections:
            available = ', '.join(collections.keys())
            raise ProcessorExecuteError(
                f"Collection '{collection_id}' not found. "
                f"Available PostGIS collections: {available}"
            )

        LOGGER.info('Exporting collection %s to GPKG', collection_id)

        try:
            gdf = read_collection(collections[collection_id])
        except Exception as exc:
            LOGGER.exception('Failed to read collection %s', collection_id)
            raise ProcessorExecuteError(f'Database read failed: {exc}') from exc

        if gdf.empty:
            raise ProcessorExecuteError(f"Collection '{collection_id}' returned no features.")

        try:
            gpkg_bytes = gdf_to_gpkg_bytes(gdf, layer_name=collection_id)
        except Exception as exc:
            LOGGER.exception('Failed to create GPKG for %s', collection_id)
            raise ProcessorExecuteError(f'GPKG creation failed: {exc}') from exc

        LOGGER.info(
            'GPKG for %s: %d features, %.1f KB',
            collection_id, len(gdf), len(gpkg_bytes) / 1024,
        )

        return 'application/geopackage+sqlite3', gpkg_bytes

    def __repr__(self):
        return f'<ExportCollectionGpkgProcessor>'
