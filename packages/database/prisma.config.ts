import { existsSync, readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'prisma/config';

const packageRoot = dirname(fileURLToPath(import.meta.url));
const monorepoRoot = resolve(packageRoot, '../..');

function loadEnvFile(filePath: string) {
  if (!existsSync(filePath)) return;
  const text = readFileSync(filePath, 'utf8');
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    if (process.env[key] === undefined) process.env[key] = val;
  }
}

loadEnvFile(resolve(monorepoRoot, '.env'));
loadEnvFile(resolve(packageRoot, '.env'));

const url = process.env.DATABASE_URL;
// prisma generate doesn't need a live DB — only the URL string for config.
// Use a dummy when missing so `pnpm db:generate` works in CI/build envs
// without database access (e.g. Vercel build). Runtime still requires the
// real DATABASE_URL (see packages/database/src/client.ts).
const effectiveUrl = url ?? 'postgresql://localhost:5432/varka_dummy';
if (!url) {
  console.warn(
    '[prisma] DATABASE_URL is missing — using dummy URL for generate only. ' +
      'Set it in the monorepo root .env (copy from .env.example) for migrations/runtime.',
  );
}

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'npx tsx prisma/seed.ts',
  },
  datasource: {
    url: effectiveUrl,
  },
});
