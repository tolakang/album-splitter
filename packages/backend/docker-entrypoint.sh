#!/bin/sh
set -e

echo "DATABASE_URL is set: $([ -n "$DATABASE_URL" ] && echo 'yes' || echo 'NO')"

# Generate Prisma client
echo "Generating Prisma client..."
npx prisma generate 2>&1 || { echo "Prisma generate failed, continuing..."; }

if [ "$#" -gt 0 ]; then
  echo "Starting with custom command: $@"
  exec "$@"
else
  echo "Starting application..."
  exec node dist/main.js
fi
