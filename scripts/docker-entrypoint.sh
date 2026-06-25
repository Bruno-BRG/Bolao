#!/bin/sh
set -e

cd /app

if [ "${SKIP_MIGRATIONS:-0}" != "1" ] && [ -n "$DATABASE_URL" ]; then
  /app/scripts/wait-for-postgres.sh
  /app/scripts/run-migrations.sh
else
  echo "Skipping migrations (SKIP_MIGRATIONS=${SKIP_MIGRATIONS:-0}, DATABASE_URL set=${DATABASE_URL:+yes})."
fi

port="${PORT:-3000}"
echo "Starting Next.js on port ${port} ..."
exec node node_modules/next/dist/bin/next start -H 0.0.0.0 -p "$port"
