import type { NextConfig } from 'next';

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
  // Prefer TS sources for workspace packages (Turbopack on Windows)
  experimental: {
    // keep empty — transpilePackages is the main lever
  },
};

export default nextConfig;
