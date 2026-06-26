#!/bin/sh
set -e

. /app/scripts/pg-env.sh

MIGRATIONS_DIR="${MIGRATIONS_DIR:-/app/db/migrations}"
PATCHES_DIR="${PATCHES_DIR:-/app/db/patches}"

if [ ! -d "$MIGRATIONS_DIR" ]; then
  echo "Migrations directory not found: $MIGRATIONS_DIR" >&2
  exit 1
fi

psql "$DATABASE_URL" -v ON_ERROR_STOP=1 <<'SQL'
CREATE TABLE IF NOT EXISTS schema_migrations (
  version text PRIMARY KEY,
  applied_at timestamptz NOT NULL DEFAULT now()
);
SQL

migration_applied() {
  version="$1"
  psql "$DATABASE_URL" -tAc \
    "SELECT 1 FROM schema_migrations WHERE version = '$version' LIMIT 1"
}

mark_migration_applied() {
  version="$1"
  psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -c \
    "INSERT INTO schema_migrations (version) VALUES ('$version')"
}

bootstrap_existing_database() {
  applied_count="$(psql "$DATABASE_URL" -tAc "SELECT count(*)::int FROM schema_migrations")"
  if [ "$applied_count" != "0" ]; then
    return 0
  fi

  users_exist="$(psql "$DATABASE_URL" -tAc \
    "SELECT EXISTS (
       SELECT 1
       FROM information_schema.tables
       WHERE table_schema = 'public' AND table_name = 'users'
     )")"

  if [ "$users_exist" != "t" ]; then
    return 0
  fi

  echo "Existing database detected — marking prior migrations as applied (no re-run)."

  for dir in "$MIGRATIONS_DIR" "$PATCHES_DIR"; do
    [ -d "$dir" ] || continue
    for file in $(find "$dir" -maxdepth 1 -name '*.sql' | sort); do
      version="$(basename "$file")"
      if [ "$(migration_applied "$version")" != "1" ]; then
        mark_migration_applied "$version"
        echo "  marked $version"
      fi
    done
  done
}

bootstrap_existing_database

echo "Running pending SQL migrations from $MIGRATIONS_DIR ..."

pending=0
for file in $(find "$MIGRATIONS_DIR" -maxdepth 1 -name '*.sql' | sort); do
  version="$(basename "$file")"
  if [ "$(migration_applied "$version")" = "1" ]; then
    echo "skip $version (already applied)"
    continue
  fi

  pending=$((pending + 1))
  echo "-> $version"
  psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f "$file"
  mark_migration_applied "$version"
done

if [ "$pending" -eq 0 ]; then
  echo "No pending migrations."
else
  echo "Applied $pending migration(s)."
fi

echo "Migrations complete."
