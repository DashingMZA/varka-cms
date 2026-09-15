#!/usr/bin/env sh
set -eu
cd "$(dirname "$0")/../.."
corepack enable 2>/dev/null || true
pnpm db:generate
pnpm db:migrate
echo "migrate done (seed separately: pnpm db:seed)"
