#!/bin/sh
set -e

if [ -z "$DATABASE_URL" ]; then
  echo "DATABASE_URL is not set" >&2
  exit 1
fi

echo "Waiting for Postgres..."
attempts=0
max_attempts="${DB_WAIT_MAX_ATTEMPTS:-60}"

until psql "$DATABASE_URL" -c "select 1" >/dev/null 2>&1; do
  attempts=$((attempts + 1))
  if [ "$attempts" -ge "$max_attempts" ]; then
    echo "Postgres not ready after ${max_attempts} attempts" >&2
    exit 1
  fi
  sleep 2
done

echo "Postgres is ready."
