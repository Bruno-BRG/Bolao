#!/bin/sh
set -e

. /app/scripts/pg-env.sh

MIGRATIONS_DIR="${MIGRATIONS_DIR:-/app/db/migrations}"

if [ ! -d "$MIGRATIONS_DIR" ]; then
  echo "Migrations directory not found: $MIGRATIONS_DIR" >&2
  exit 1
fi

echo "Running SQL migrations from $MIGRATIONS_DIR ..."

for file in $(find "$MIGRATIONS_DIR" -maxdepth 1 -name '*.sql' | sort); do
  echo "-> $(basename "$file")"
  psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f "$file"
done

echo "Migrations complete."
