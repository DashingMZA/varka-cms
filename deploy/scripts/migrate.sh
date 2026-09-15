#!/usr/bin/env sh
set -eu
cd "$(dirname "$0")/../.."
pnpm db:generate
pnpm db:migrate
pnpm db:seed
echo "migrate+seed done"
