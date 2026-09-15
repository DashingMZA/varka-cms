#!/usr/bin/env sh
# Backup Postgres (docker compose service "postgres" or DATABASE_URL)
set -eu
STAMP=$(date -u +%Y%m%dT%H%M%SZ)
OUT_DIR=${BACKUP_DIR:-./backups}
mkdir -p "$OUT_DIR"
FILE="$OUT_DIR/varka-$STAMP.sql.gz"

if [ -n "${DATABASE_URL:-}" ]; then
  echo "Backing up via DATABASE_URL → $FILE"
  # strip prisma-specific query params if any
  pg_dump "$DATABASE_URL" | gzip -c > "$FILE"
else
  echo "Backing up docker compose postgres → $FILE"
  docker compose exec -T postgres pg_dump -U varka varka | gzip -c > "$FILE"
fi

echo "OK $FILE"
# retain last 14 backups
ls -1t "$OUT_DIR"/varka-*.sql.gz 2>/dev/null | tail -n +15 | xargs -r rm -f
