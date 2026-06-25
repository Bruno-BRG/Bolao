#!/bin/sh
# Resolve and normalize Postgres connection for Railway/Docker.

resolve_database_url() {
  if [ -z "$DATABASE_URL" ] && [ -n "$DATABASE_PRIVATE_URL" ]; then
    export DATABASE_URL="$DATABASE_PRIVATE_URL"
  fi
  if [ -z "$DATABASE_URL" ] && [ -n "$POSTGRES_URL" ]; then
    export DATABASE_URL="$POSTGRES_URL"
  fi

  if [ -z "$DATABASE_URL" ]; then
    return 0
  fi

  export PGCONNECT_TIMEOUT="${PGCONNECT_TIMEOUT:-5}"

  case "$DATABASE_URL" in
    *railway.internal*)
      export PGSSLMODE="${PGSSLMODE:-disable}"
      ;;
    *proxy.rlwy.net*|*railway.app*)
      if ! echo "$DATABASE_URL" | grep -q 'sslmode='; then
        if echo "$DATABASE_URL" | grep -q '?'; then
          export DATABASE_URL="${DATABASE_URL}&sslmode=require"
        else
          export DATABASE_URL="${DATABASE_URL}?sslmode=require"
        fi
      fi
      export PGSSLMODE="${PGSSLMODE:-require}"
      ;;
    *)
      export PGSSLMODE="${PGSSLMODE:-prefer}"
      ;;
  esac
}

resolve_database_url
