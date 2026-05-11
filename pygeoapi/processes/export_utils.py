"""
Shared utilities for pygeoapi export processes.
Reads connection details directly from pygeoapi's own config so there's no
duplication and any change to the config is automatically picked up.
"""

import io
import os
import logging
import tempfile

import geopandas as gpd
from sqlalchemy import create_engine, text

LOGGER = logging.getLogger(__name__)

# ──────────────────────────────────────────────
# Config helpers
# ──────────────────────────────────────────────

def load_config() -> dict:
    from pygeoapi.config import get_config
    return get_config()


def get_postgis_collections(config: dict) -> dict[str, dict]:
    """
    Return every feature collection backed by the PostgreSQL provider.

    Each value is a dict with keys:
        connection  – SQLAlchemy connection URL
        table       – fully qualified table name (schema.table or just table)
        geom_field  – geometry column name
        id_field    – primary-key column name
        title       – human-readable title
    """
    collections = {}

    for coll_id, resource in config.get('resources', {}).items():
        if resource.get('type') != 'collection':
            continue

        providers = resource.get('providers', [])
        if not providers:
            continue

        # We only care about the first (feature) provider
        prov = providers[0]
        if prov.get('name') not in ('PostgreSQL', 'MVT-postgresql'):
            continue

        data = prov.get('data', {})

        try:
            conn_str = _build_connection_string(data)
        except KeyError as exc:
            LOGGER.warning('Skipping collection %s – missing connection key: %s', coll_id, exc)
            continue

        collections[coll_id] = {
            'connection': conn_str,
            'table': _qualify_table(prov),
            'geom_field': prov.get('geom_field', 'geom'),
            'id_field': prov.get('id_field', 'id'),
            'title': resource.get('title', coll_id),
        }

    return collections


def _build_connection_string(data: dict) -> str:
    """Build a SQLAlchemy postgresql+psycopg2 URL from provider data block."""
    host = data.get('host', 'localhost')
    port = data.get('port', 5432)
    dbname = data.get('dbname') or data.get('database')
    user = data.get('user') or data.get('username')
    password = data.get('password', '')

    if not dbname:
        raise KeyError('dbname / database')
    if not user:
        raise KeyError('user / username')

    return f'postgresql+psycopg2://{user}:{password}@{host}:{port}/{dbname}'


def _qualify_table(provider: dict) -> str:
    # table is at provider level, not inside data:
    table = provider.get('table') or provider.get('data', {}).get('table') or provider.get('data', {}).get('entity')
    if not table:
        raise KeyError('table / entity')
    # schema comes from search_path inside data:
    search_path = provider.get('data', {}).get('search_path', [])
    schema = search_path[0] if search_path else 'public'
    return f'{schema}.{table}'


# ──────────────────────────────────────────────
# Data-reading helpers
# ──────────────────────────────────────────────

def read_collection(coll_info: dict, where: str | None = None) -> gpd.GeoDataFrame:
    """
    Read a PostGIS collection into a GeoDataFrame.

    Args:
        coll_info: dict from get_postgis_collections()
        where:     optional SQL WHERE clause (without the WHERE keyword)
    """
    engine = create_engine(coll_info['connection'])
    geom = coll_info['geom_field']
    table = coll_info['table']

    sql = f'SELECT * FROM {table}'
    if where:
        sql += f' WHERE {where}'

    gdf = gpd.read_postgis(text(sql), con=engine.connect(), geom_col=geom)
    LOGGER.info('Read %d features from %s', len(gdf), table)
    return gdf


def read_collection_by_area(
    coll_info: dict,
    area_geom_wkt: str,
    area_srid: int = 4326,
) -> gpd.GeoDataFrame:
    """
    Spatially filter a collection to features that intersect a given geometry.

    Args:
        coll_info:      dict from get_postgis_collections()
        area_geom_wkt:  WKT of the filter geometry (e.g. a fylke polygon)
        area_srid:      SRID of the WKT geometry
    """
    engine = create_engine(coll_info['connection'])
    geom = coll_info['geom_field']
    table = coll_info['table']

    sql = text(f"""
        SELECT *
        FROM   {table}
        WHERE  ST_Intersects(
                   {geom},
                   ST_Transform(
                       ST_GeomFromText(:wkt, :srid),
                       ST_SRID({geom})
                   )
               )
    """)

    gdf = gpd.read_postgis(
        sql, con=engine.connect(), geom_col=geom,
        params={'wkt': area_geom_wkt, 'srid': area_srid},
    )
    LOGGER.info('Spatially filtered %d features from %s', len(gdf), table)
    return gdf


def get_area_geometry(
    config: dict,
    area_collection: str,
    field_name: str,
    field_value: str,
) -> str | None:
    """
    Fetch the WKT geometry of a single area feature by calling the OGC API
    Features endpoint rather than querying the data source directly.

    Uses the internal service URL from the pygeoapi config so the request
    stays inside the Docker network (port 5000, not the mapped port).

    Returns WKT string in EPSG:4326, or None if no matching feature found.
    """
    import urllib.request
    import urllib.parse
    import json
    import re
    from shapely.geometry import shape

    base_url = config.get('server', {}).get('url', 'http://localhost:5000').rstrip('/')
    internal_base = re.sub(r'https?://[^/]+', 'http://localhost:5000', base_url)

    params = urllib.parse.urlencode({
        field_name: field_value,
        'f': 'json',
        'limit': 1,
    })
    url = f'{internal_base}/collections/{area_collection}/items?{params}'
    LOGGER.info('Fetching area geometry from: %s', url)

    try:
        with urllib.request.urlopen(url, timeout=30) as resp:
            data = json.loads(resp.read().decode('utf-8'))
    except Exception as exc:
        raise RuntimeError(f'Failed to fetch area geometry from Features API: {exc}') from exc

    features = data.get('features', [])
    if not features:
        return None

    geom = features[0].get('geometry')
    if not geom:
        return None

    # GeoJSON is always EPSG:4326 — convert to WKT via shapely
    return shape(geom).wkt


def read_collection_by_area(
    coll_info: dict,
    area_geom_wkt: str,
    area_srid: int = 4326,
    buffer_metres: float = 1,
) -> gpd.GeoDataFrame:
    """
    Filter a collection to features that are fully within a given geometry,
    with an optional buffer applied to the area boundary before the query.

    The buffer is applied in EPSG:25833 (UTM zone 33N) for metric accuracy,
    then the geometry is transformed back to match the table's native SRID.

    Args:
        coll_info:      dict from get_postgis_collections()
        area_geom_wkt:  WKT of the filter geometry in EPSG:4326
        area_srid:      SRID of the WKT geometry (default 4326)
        buffer_metres:  buffer distance in metres (default 1)
    """
    engine = create_engine(coll_info['connection'])
    geom  = coll_info['geom_field']
    table = coll_info['table']

    sql = text(f"""
        SELECT *
        FROM   {table}
        WHERE  ST_Within(
                   {geom},
                   ST_Transform(
                       ST_Buffer(
                           ST_Transform(
                               ST_GeomFromText(:wkt, :srid),
                               25833
                           ),
                           :buffer_m
                       ),
                       ST_SRID({geom})
                   )
               )
    """)

    gdf = gpd.read_postgis(
        sql, con=engine.connect(), geom_col=geom,
        params={'wkt': area_geom_wkt, 'srid': area_srid, 'buffer_m': buffer_metres},
    )
    LOGGER.info(
        'ST_Within (buffer=%dm) filtered %d features from %s',
        buffer_metres, len(gdf), table,
    )
    return gdf

# ──────────────────────────────────────────────
# Output serialisation helpers
# ──────────────────────────────────────────────

def gdf_to_gpkg_bytes(gdf: gpd.GeoDataFrame, layer_name: str = 'data') -> bytes:
    """Write a GeoDataFrame to an in-memory GeoPackage and return the raw bytes."""
    with tempfile.NamedTemporaryFile(suffix='.gpkg', delete=False) as tmp:
        tmp_path = tmp.name

    try:
        gdf.to_file(tmp_path, driver='GPKG', layer=layer_name)
        with open(tmp_path, 'rb') as fh:
            return fh.read()
    finally:
        os.unlink(tmp_path)


def gdfs_to_gpkg_bytes(layers: dict[str, gpd.GeoDataFrame]) -> bytes:
    """
    Write multiple GeoDataFrames as separate layers in one GeoPackage.

    Args:
        layers: mapping of layer_name → GeoDataFrame
    """
    with tempfile.NamedTemporaryFile(suffix='.gpkg', delete=False) as tmp:
        tmp_path = tmp.name

    try:
        first = True
        for layer_name, gdf in layers.items():
            if gdf is None or len(gdf) == 0:
                continue
            mode = 'w' if first else 'a'
            gdf.to_file(tmp_path, driver='GPKG', layer=layer_name, mode=mode)
            first = False

        with open(tmp_path, 'rb') as fh:
            return fh.read()
    finally:
        os.unlink(tmp_path)


def gdf_to_csv_bytes(gdf: gpd.GeoDataFrame, geom_col: str = 'geom') -> bytes:
    """
    Serialise a GeoDataFrame to CSV with geometry encoded as hex-WKB.
    The geometry column is renamed to 'geometry_wkb'.
    """
    import pandas as pd

    df = gdf.copy()

    # Find the active geometry column
    active_geom = df.geometry.name if hasattr(df, 'geometry') else geom_col

    # Encode as WKB hex, drop the shapely geometry column
    df['geometry_wkb'] = df[active_geom].apply(
        lambda g: g.wkb_hex if g is not None else None
    )
    df = df.drop(columns=[active_geom])

    buf = io.StringIO()
    df.to_csv(buf, index=False)
    return buf.getvalue().encode('utf-8')
