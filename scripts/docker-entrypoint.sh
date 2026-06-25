#!/bin/sh

cd /app

. /app/scripts/pg-env.sh

missing=""
for var in SUPABASE_URL SUPABASE_SERVICE_ROLE_KEY; do
  eval "value=\$$var"
  if [ -z "$value" ]; then
    missing="$missing $var"
  fi
done

if [ -n "$missing" ]; then
  echo "WARNING: missing required env vars:$missing"
  echo "         /api/health will fail until PostgREST + gateway are configured."
fi

port="${PORT:-3000}"
echo "Starting Next.js on port ${port} ..."
node node_modules/next/dist/bin/next start -H 0.0.0.0 -p "$port" &
NEXT_PID=$!

if [ -n "$DATABASE_URL" ] && [ "${SKIP_MIGRATIONS:-0}" != "1" ]; then
  (
    /app/scripts/wait-for-postgres.sh && /app/scripts/run-migrations.sh
  ) &
  echo "Migrations running in background (pid $!)."
elif [ -z "$DATABASE_URL" ]; then
  echo "WARNING: DATABASE_URL not set — migrations skipped."
  echo "         Link Postgres on Railway: DATABASE_URL=\${{Postgres.DATABASE_PRIVATE_URL}}"
else
  echo "Skipping migrations (SKIP_MIGRATIONS=1)."
fi

trap 'kill "$NEXT_PID" 2>/dev/null' TERM INT
wait "$NEXT_PID"
