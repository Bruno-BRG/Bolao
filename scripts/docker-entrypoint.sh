#!/bin/sh

cd /app

. /app/scripts/pg-env.sh

if [ -z "$DATABASE_URL" ]; then
  echo "WARNING: DATABASE_URL not set — migrations skipped."
  echo "         Link o Postgres na Railway: DATABASE_URL=\${{Postgres.DATABASE_URL}}"
elif [ "${SKIP_MIGRATIONS:-0}" != "1" ]; then
  (
    /app/scripts/wait-for-postgres.sh && /app/scripts/run-migrations.sh
  ) &
  echo "Migrations running in background (pid $!)."
else
  echo "Skipping migrations (SKIP_MIGRATIONS=1)."
fi

port="${PORT:-3000}"
echo "Starting Next.js on port ${port} ..."
node node_modules/next/dist/bin/next start -H 0.0.0.0 -p "$port" &
NEXT_PID=$!

trap 'kill "$NEXT_PID" 2>/dev/null' TERM INT
wait "$NEXT_PID"
