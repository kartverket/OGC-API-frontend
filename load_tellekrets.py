import geopandas as gpd
from sqlalchemy import create_engine, text

GPKG = '/tmp/tellekretser_kystkontur.gpkg'
DB = 'postgresql+psycopg2://postgres:qwer1234@postgis:5432/pygeoapi_test'
SCHEMA = 'tellekretser'
TABLE = 'tellekretser_kystkontur'

print('Reading geopackage...')
gdf = gpd.read_file(GPKG)
print(f'Read {len(gdf)} features, CRS: {gdf.crs}')

# Rename geometry column to 'omrade' to match the project convention
gdf = gdf.rename_geometry('omrade')

# Add an 'objid' column from the GeoDataFrame index so pygeoapi has an id field
gdf = gdf.reset_index(drop=True)
gdf.index.name = 'objid'

engine = create_engine(DB)

print(f'Creating schema {SCHEMA}...')
with engine.connect() as conn:
    conn.execute(text(f'DROP SCHEMA IF EXISTS {SCHEMA} CASCADE'))
    conn.execute(text(f'CREATE SCHEMA {SCHEMA}'))
    conn.commit()

print(f'Writing {len(gdf)} features to {SCHEMA}.{TABLE}...')
gdf.to_postgis(
    TABLE,
    engine,
    schema=SCHEMA,
    if_exists='replace',
    index=True,
    index_label='objid',
)

# Verify
with engine.connect() as conn:
    count = conn.execute(text(f'SELECT COUNT(*) FROM {SCHEMA}.{TABLE}')).scalar()
print(f'Done. {count} rows in {SCHEMA}.{TABLE}')
