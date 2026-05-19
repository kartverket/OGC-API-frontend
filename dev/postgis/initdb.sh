#!/bin/sh
# Keep this POSIX-compatible for Alpine images and cross-platform checkouts.
set -e

directory=/tmp/dumps

db="$DB_NAME"

psql -U "$POSTGRES_USER" -c "CREATE DATABASE $db;"
psql -U "$POSTGRES_USER" -d "$db" -c "CREATE EXTENSION postgis;"

for file in "$directory"/*.sql; do
    psql -U "$POSTGRES_USER" -d "$db" -f "$file"
done

rm -r $directory
