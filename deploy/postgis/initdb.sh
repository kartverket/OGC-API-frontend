#!/bin/bash
set -e

SQL_1=/tmp/dumps/fylker.sql
DB_1=fylker
SCHEMA_1=$DB_1

SQL_2=/tmp/dumps/kommuner.sql
DB_2=kommuner
SCHEMA_2=$DB_2

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" <<-EOSQL
  CREATE DATABASE $DB_1;
  CREATE DATABASE $DB_2;
EOSQL

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$DB_1" <<-EOSQL
  CREATE EXTENSION postgis;
EOSQL

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$DB_2" <<-EOSQL
  CREATE EXTENSION postgis;
EOSQL

psql -U "$POSTGRES_USER" -d "$DB_1" -f "$SQL_1"

psql -U "$POSTGRES_USER" -d "$DB_2" -f "$SQL_2"

EXISTING_SCHEMA_1=$(psql -U "$POSTGRES_USER" -d "$DB_1" -t -c "SELECT schema_name FROM information_schema.schemata WHERE schema_name LIKE '$SCHEMA_1%';" | xargs)
psql -U "$POSTGRES_USER" -d "$DB_1" -c "ALTER SCHEMA \"$EXISTING_SCHEMA_1\" RENAME TO \"$SCHEMA_1\";"

EXISTING_SCHEMA_2=$(psql -U "$POSTGRES_USER" -d "$DB_2" -t -c "SELECT schema_name FROM information_schema.schemata WHERE schema_name LIKE '$SCHEMA_2%';" | xargs)
psql -U "$POSTGRES_USER" -d "$DB_2" -c "ALTER SCHEMA \"$EXISTING_SCHEMA_2\" RENAME TO \"$SCHEMA_2\";"
