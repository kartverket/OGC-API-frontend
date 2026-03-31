#!/bin/bash
set -e

directory=/tmp/dumps

db="$DB_NAME"

psql -U "$POSTGRES_USER" -c "CREATE DATABASE $db;"
psql -U "$POSTGRES_USER" -d "$db" -c "CREATE EXTENSION postgis;"

for file in "$directory"/*.sql; do
    # Hack for GiST index
    sed -i '/USING GIST ("representasjonspunkt")/d' "$file"

    psql -U "$POSTGRES_USER" -d "$db" -f "$file"

    # Hack for geom -> geometry column names
    table=$(basename "$file" .sql)
    psql -U "$POSTGRES_USER" -d "$db" -c \
        "ALTER TABLE IF EXISTS \"public\".\"$table\" RENAME COLUMN \"geom\" TO \"geometry\";" 2>/dev/null || true
done

rm -r $directory
