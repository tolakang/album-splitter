#!/bin/sh
set -e

echo "Running Prisma migrations..."
npx prisma migrate deploy

if [ "$#" -gt 0 ]; then
  echo "Starting with custom command: $@"
  exec "$@"
else
  echo "Starting application..."
  exec node dist/main.js
fi
