#!/bin/sh
set -e

export POSTGREST_HOST="${POSTGREST_HOST:-postgrest}"
export PORT="${PORT:-8000}"
envsubst '${POSTGREST_HOST} ${PORT}' < /etc/nginx/nginx.conf.template > /etc/nginx/nginx.conf
exec nginx -g 'daemon off;'
