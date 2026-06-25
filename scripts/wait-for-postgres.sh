#!/bin/sh
set -e

. /app/scripts/pg-env.sh

if [ -z "$DATABASE_URL" ]; then
  echo "DATABASE_URL is not set" >&2
  exit 1
fi

echo "Waiting for Postgres..."
attempts=0
max_attempts="${DB_WAIT_MAX_ATTEMPTS:-30}"

while [ "$attempts" -lt "$max_attempts" ]; do
  if psql "$DATABASE_URL" -c "select 1" >/dev/null 2>&1; then
    echo "Postgres is ready."
    exit 0
  fi

  attempts=$((attempts + 1))
  echo "Postgres not ready (attempt ${attempts}/${max_attempts})..."
  sleep 2
done

echo "Postgres not ready after ${max_attempts} attempts" >&2
exit 1
