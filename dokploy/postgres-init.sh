#!/bin/sh
set -e

# Ensure the postgres role password matches POSTGRES_PASSWORD on every start.
# Postgres only initializes on first volume creation; if the password env
# changes later, this script keeps the role in sync so the backend can connect.
if [ -n "$POSTGRES_PASSWORD" ]; then
  psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
    ALTER USER "$POSTGRES_USER" WITH PASSWORD '$POSTGRES_PASSWORD';
EOSQL
fi
