#!/bin/bash
set -e

directory=/tmp/dumps

for file in "$directory"/*; do
    basename="${file##*/}"
    db="${basename%%.*}"
    schema=$db

    psql -U "$POSTGRES_USER" -c "CREATE DATABASE $db;"
    psql -U "$POSTGRES_USER" -d "$db" -c "CREATE EXTENSION postgis;"
    psql -U "$POSTGRES_USER" -d "$db" -f "$file"
    extg_schema=$(psql -U "$POSTGRES_USER" -d "$db" -t -c "SELECT schema_name FROM information_schema.schemata WHERE schema_name LIKE '$schema%';" | xargs)
    psql -U "$POSTGRES_USER" -d "$db" -c "ALTER SCHEMA \"$extg_schema\" RENAME TO \"$schema\";"
done

rm -r $directory