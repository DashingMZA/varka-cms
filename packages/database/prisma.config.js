const path = require('node:path');
const dotenv = require('dotenv');
const { defineConfig } = require('prisma/config');

dotenv.config({
  path: path.resolve(__dirname, '../../.env'),
});

// prisma generate doesn't need a live DB — only the URL string for config.
// Use a dummy when missing so `pnpm db:generate` works in CI/build envs
// without database access (e.g. Vercel build). Runtime still requires the
// real DATABASE_URL (see packages/database/src/client.ts).
const url = process.env.DATABASE_URL ?? 'postgresql://localhost:5432/varka_dummy';
if (!process.env.DATABASE_URL) {
  console.warn(
    '[prisma] DATABASE_URL is missing — using dummy URL for generate only. ' +
      'Set it in the monorepo root .env (copy from .env.example) for migrations/runtime.',
  );
}

module.exports = defineConfig({
  schema: 'prisma/schema.prisma',

  migrations: {
    path: 'prisma/migrations',
    seed: 'node --import tsx prisma/seed.ts',
  },

  datasource: {
    url,
  },
});
