#!/bin/sh
set -e

echo "DATABASE_URL is set: $([ -n "$DATABASE_URL" ] && echo 'yes' || echo 'NO')"

# Only run migrations if this is the main API server, not the worker
if [ "$1" = "node" ] && [ "$2" = "dist/main.js" ]; then
  echo "Running Prisma migrations..."
  npx prisma migrate deploy 2>&1 || { echo "Migration failed or no migrations to apply, continuing..."; }
fi

echo "Generating Prisma client..."
npx prisma generate 2>&1 || { echo "Prisma generate failed, continuing..."; }

if [ "$#" -gt 0 ]; then
  echo "Starting with custom command: $@"
  exec "$@"
else
  echo "Starting application..."
  exec node dist/main.js
fi
