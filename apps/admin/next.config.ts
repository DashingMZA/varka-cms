import type { NextConfig } from 'next';
import path from 'node:path';
import { existsSync } from 'node:fs';
import { createRequire } from 'node:module';

// Monorepo: load root `.env` so DATABASE_URL is visible to Next (app cwd is apps/admin).
try {
  const require = createRequire(import.meta.url);
  const dotenv = require('dotenv') as { config: (o?: { path?: string }) => void };
  const rootEnv = path.resolve(__dirname, '../../.env');
  if (existsSync(rootEnv)) {
    dotenv.config({ path: rootEnv });
  }
} catch {
  /* optional */
}

const nextConfig: NextConfig = {
  output: 'standalone',
  transpilePackages: [
    '@varka/auth',
    '@varka/cache',
    '@varka/config',
    '@varka/content',
    '@varka/database',
    '@varka/i18n',
    '@varka/media',
    '@varka/permissions',
    '@varka/queue',
    '@varka/security',
    '@varka/seo',
    '@varka/themes',
    '@varka/types',
    '@varka/validation',
  ],
  serverExternalPackages: [
    '@prisma/client',
    'pg',
    '@prisma/adapter-pg',
    'dotenv',
    '@aws-sdk/client-s3',
  ],
};

export default nextConfig;
