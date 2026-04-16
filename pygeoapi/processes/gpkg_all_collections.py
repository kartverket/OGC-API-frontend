"""
OGC API – Processes: Export all collections into a single GeoPackage
────────────────────────────────────────────────────────────────────
POST /processes/export-all-gpkg/execution
{
    "inputs": {}                          -- export everything
    "inputs": { "collection_ids": ["a", "b"] }  -- or a subset
}
Returns: application/geopackage+sqlite3 binary (one layer per collection)
"""

import logging
from pygeoapi.process.base import BaseProcessor, ProcessorExecuteError
from .export_utils import (
    load_config,
    get_postgis_collections,
    read_collection,
    gdfs_to_gpkg_bytes,
)

LOGGER = logging.getLogger(__name__)

PROCESS_METADATA = {
    'version': '0.1.0',
    'id': 'export-all-gpkg',
    'title': {'en': 'Export all collections as GeoPackage'},
    'description': {
        'en': (
            'Exports every PostGIS-backed OGC API collection into a single '
            'GeoPackage file, with one layer per collection. Optionally '
            'restrict to a subset of collection IDs.'
        )
    },
    'jobControlOptions': ['sync-execute', 'async-execute'],
    'outputTransmission': ['value'],
    'keywords': ['gpkg', 'geopackage', 'export', 'bulk', 'download'],
    'links': [],
    'inputs': {
        'collection_ids': {
            'title': 'Collection IDs (optional)',
            'description': (
                'Comma-separated list of collection IDs to include. '
                'Leave empty to export all collections.'
            ),
            'schema': {'type': 'string'},
            'minOccurs': 0,
            'maxOccurs': 1,
        }
    },
    'outputs': {
        'result': {
            'title': 'GeoPackage file',
            'description': 'Multi-layer GeoPackage with one layer per collection',
            'schema': {
                'type': 'string',
                'contentMediaType': 'application/geopackage+sqlite3',
                'contentEncoding': 'binary',
            },
        }
    },
    'example': {'inputs': {}},
}


class ExportAllGpkgProcessor(BaseProcessor):

    def __init__(self, processor_def):
        super().__init__(processor_def, PROCESS_METADATA)

    def execute(self, data, outputs=None, **kwargs):
        config = load_config()
        all_collections = get_postgis_collections(config)

        if not all_collections:
            raise ProcessorExecuteError('No PostGIS-backed collections found in config.')

        # Optional filter
        raw_ids = data.get('collection_ids', '').strip()
        if raw_ids:
            requested = [c.strip() for c in raw_ids.split(',') if c.strip()]
            missing = [c for c in requested if c not in all_collections]
            if missing:
                raise ProcessorExecuteError(
                    f"Unknown collection(s): {', '.join(missing)}. "
                    f"Available: {', '.join(all_collections.keys())}"
                )
            target = {k: v for k, v in all_collections.items() if k in requested}
        else:
            target = all_collections

        LOGGER.info('Exporting %d collections to single GPKG', len(target))

        layers = {}
        errors = []
        for coll_id, coll_info in target.items():
            try:
                gdf = read_collection(coll_info)
                layers[coll_id] = gdf
                LOGGER.info('  ✓ %s (%d features)', coll_id, len(gdf))
            except Exception as exc:
                LOGGER.warning('  ✗ %s – skipped: %s', coll_id, exc)
                errors.append(f'{coll_id}: {exc}')

        if not layers:
            raise ProcessorExecuteError(
                f'All collections failed to load. Errors: {"; ".join(errors)}'
            )

        try:
            gpkg_bytes = gdfs_to_gpkg_bytes(layers)
        except Exception as exc:
            LOGGER.exception('Failed to create combined GPKG')
            raise ProcessorExecuteError(f'GPKG creation failed: {exc}') from exc

        LOGGER.info(
            'Combined GPKG: %d layers, %.1f KB',
            len(layers), len(gpkg_bytes) / 1024,
        )
        return 'application/geopackage+sqlite3', gpkg_bytes

    def __repr__(self):
        return '<ExportAllGpkgProcessor>'
