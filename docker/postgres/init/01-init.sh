#!/bin/sh
# Crea el schema de la solución. Solo corre cuando el volumen de la base es nuevo.
set -e

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
  CREATE SCHEMA IF NOT EXISTS ${POSTGRES_SCHEMA};
EOSQL
