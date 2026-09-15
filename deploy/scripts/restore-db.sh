#!/usr/bin/env sh
set -eu
FILE=${1:-}
if [ -z "$FILE" ] || [ ! -f "$FILE" ]; then
  echo "Usage: $0 backups/varka-YYYYMMDD.sql.gz" >&2
  exit 1
fi
echo "Restoring $FILE (destructive to target DB)"
if [ -n "${DATABASE_URL:-}" ]; then
  gzip -dc "$FILE" | psql "$DATABASE_URL"
else
  gzip -dc "$FILE" | docker compose exec -T postgres psql -U varka varka
fi
echo "OK restored"
