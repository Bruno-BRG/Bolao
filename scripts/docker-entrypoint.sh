#!/bin/sh
set -e

cd /app

# Railway Postgres: prefere URL privada para migrations dentro da rede interna.
if [ -z "$DATABASE_URL" ] && [ -n "$DATABASE_PRIVATE_URL" ]; then
  export DATABASE_URL="$DATABASE_PRIVATE_URL"
fi
if [ -z "$DATABASE_URL" ] && [ -n "$POSTGRES_URL" ]; then
  export DATABASE_URL="$POSTGRES_URL"
fi

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

if [ -z "$DATABASE_URL" ]; then
  echo "WARNING: DATABASE_URL not set — migrations skipped."
  echo "         Link the Postgres service on Railway (DATABASE_URL or DATABASE_PRIVATE_URL)."
else
  if [ "${SKIP_MIGRATIONS:-0}" != "1" ]; then
    /app/scripts/wait-for-postgres.sh
    /app/scripts/run-migrations.sh
  else
    echo "Skipping migrations (SKIP_MIGRATIONS=1)."
  fi
fi

port="${PORT:-3000}"
echo "Starting Next.js on port ${port} ..."
exec node node_modules/next/dist/bin/next start -H 0.0.0.0 -p "$port"
