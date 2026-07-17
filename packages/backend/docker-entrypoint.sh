#!/bin/sh
set -e

echo "DATABASE_URL is set: $([ -n "$DATABASE_URL" ] && echo 'yes' || echo 'NO')"

# Generate Prisma client
echo "Generating Prisma client..."
npx prisma generate 2>&1 || { echo "Prisma generate failed, continuing..."; }

# Apply database migrations (idempotent). Falls back to db push if migrate deploy
# fails (e.g. no migration history). Retries a few times in case the DB is still
# warming up. Does not block startup on failure.
echo "Applying database migrations..."
for i in 1 2 3 4 5; do
  if npx prisma migrate deploy 2>/dev/null; then
    echo "Migrations applied successfully."
    break
  fi
  echo "migrate deploy attempt $i failed, retrying in 5s..."
  sleep 5
done
# Best-effort fallback: ensure schema exists even without migration history.
npx prisma db push --accept-data-loss 2>/dev/null || echo "db push fallback skipped"

if [ "$#" -gt 0 ]; then
  echo "Starting with custom command: $@"
  exec "$@"
else
  echo "Starting application..."
  exec node dist/main.js
fi
