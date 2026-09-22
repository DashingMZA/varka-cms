import type { NextConfig } from 'next';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

/** Load monorepo root .env into process.env before Next boots (AUTH_SECRET etc.) */
function loadRootEnv() {
  const candidates = [
    path.resolve(process.cwd(), '.env'),
    path.resolve(process.cwd(), '.env.local'),
    path.resolve(process.cwd(), '../../.env'),
    path.resolve(process.cwd(), '../../.env.local'),
  ];
  for (const file of candidates) {
    if (!existsSync(file)) continue;
    try {
      const text = readFileSync(file, 'utf8');
      for (const line of text.split(/\r?\n/)) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) continue;
        const eq = trimmed.indexOf('=');
        if (eq <= 0) continue;
        const key = trimmed.slice(0, eq).trim();
        if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(key)) continue;
        if (process.env[key] !== undefined && process.env[key] !== '') continue;
        let val = trimmed.slice(eq + 1).trim();
        if (
          (val.startsWith('"') && val.endsWith('"')) ||
          (val.startsWith("'") && val.endsWith("'"))
        ) {
          val = val.slice(1, -1);
        }
        process.env[key] = val;
      }
    } catch {
      /* ignore */
    }
  }
}
loadRootEnv();

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
    '@varka/security',
    '@varka/seo',
    '@varka/themes',
    '@varka/types',
    '@varka/validation',
    '@varka/queue',
  ],
  experimental: {},
  compress: true,
  async headers() {
    return [
      {
        source: '/api/media/file/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
          { key: 'Cross-Origin-Resource-Policy', value: 'cross-origin' },
        ],
      },
    ];
  },
};

export default nextConfig;
