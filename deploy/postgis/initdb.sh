#!/bin/bash
set -e

directory=/tmp/dumps

db="$DB_NAME"

psql -U "$POSTGRES_USER" -c "CREATE DATABASE $db;"
psql -U "$POSTGRES_USER" -d "$db" -c "CREATE EXTENSION postgis;"
psql -U "$POSTGRES_USER" -d "$db" -c "CREATE SCHEMA IF NOT EXISTS administrative_enheter;"

# Load SQL files
for file in "$directory"/*.sql; do
    psql -U "$POSTGRES_USER" -d "$db" -f "$file"
done

# Move tables from auto-created schemas to public
# Get the temp schema names and move tables with explicit renaming
psql -U "$POSTGRES_USER" -d "$db" <<'EOF'
-- Handle fylker: find schema with fylke table, move it as fylker
SELECT schema_name INTO TEMP TABLE temp_fylker_schema 
FROM information_schema.schemata 
WHERE schema_name LIKE 'fylker_%' LIMIT 1;

SELECT schema_name INTO TEMP TABLE temp_kommuner_schema 
FROM information_schema.schemata 
WHERE schema_name LIKE 'kommuner_%' LIMIT 1;

SELECT schema_name INTO TEMP TABLE temp_tellekretser_schema 
FROM information_schema.schemata 
WHERE schema_name = 'tellekretser' LIMIT 1;
EOF

# Move fylker tables
FYLKER_SCHEMA=$(psql -U "$POSTGRES_USER" -d "$db" -t -c "SELECT schema_name FROM information_schema.schemata WHERE schema_name LIKE 'fylker_%' LIMIT 1" | xargs)
if [ ! -z "$FYLKER_SCHEMA" ]; then
    psql -U "$POSTGRES_USER" -d "$db" -c "ALTER TABLE \"$FYLKER_SCHEMA\".fylke SET SCHEMA administrative_enheter"
    psql -U "$POSTGRES_USER" -d "$db" -c "ALTER TABLE administrative_enheter.fylke RENAME TO fylker"
    psql -U "$POSTGRES_USER" -d "$db" -c "ALTER TABLE \"$FYLKER_SCHEMA\".grense SET SCHEMA administrative_enheter"
    psql -U "$POSTGRES_USER" -d "$db" -c "ALTER TABLE administrative_enheter.grense RENAME TO fylker_kystkontur"
    psql -U "$POSTGRES_USER" -d "$db" -c "DROP SCHEMA \"$FYLKER_SCHEMA\" CASCADE"
fi

# Move kommuner tables
KOMMUNER_SCHEMA=$(psql -U "$POSTGRES_USER" -d "$db" -t -c "SELECT schema_name FROM information_schema.schemata WHERE schema_name LIKE 'kommuner_%' LIMIT 1" | xargs)
if [ ! -z "$KOMMUNER_SCHEMA" ]; then
    psql -U "$POSTGRES_USER" -d "$db" -c "ALTER TABLE \"$KOMMUNER_SCHEMA\".kommune SET SCHEMA administrative_enheter"
    psql -U "$POSTGRES_USER" -d "$db" -c "ALTER TABLE administrative_enheter.kommune RENAME TO kommuner"
    psql -U "$POSTGRES_USER" -d "$db" -c "ALTER TABLE \"$KOMMUNER_SCHEMA\".grense SET SCHEMA administrative_enheter"
    psql -U "$POSTGRES_USER" -d "$db" -c "ALTER TABLE administrative_enheter.grense RENAME TO kommuner_kystkontur"
    psql -U "$POSTGRES_USER" -d "$db" -c "DROP SCHEMA \"$KOMMUNER_SCHEMA\" CASCADE"
fi

# Move tellekretser tables
TELLEKRETSER_SCHEMA=$(psql -U "$POSTGRES_USER" -d "$db" -t -c "SELECT schema_name FROM information_schema.schemata WHERE schema_name = 'tellekretser' LIMIT 1" | xargs)
if [ ! -z "$TELLEKRETSER_SCHEMA" ]; then
    psql -U "$POSTGRES_USER" -d "$db" -c "ALTER TABLE \"$TELLEKRETSER_SCHEMA\".tellekretser_kystkontur SET SCHEMA administrative_enheter"
    psql -U "$POSTGRES_USER" -d "$db" -c "DROP SCHEMA \"$TELLEKRETSER_SCHEMA\" CASCADE"
fi

rm -f "$directory"/*.sql