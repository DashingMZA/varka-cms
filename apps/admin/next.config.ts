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
    '@varka/queue',
    '@varka/security',
    '@varka/seo',
    '@varka/themes',
    '@varka/types',
    '@varka/validation',
  ],
  serverExternalPackages: ['@prisma/client', 'pg', '@prisma/adapter-pg'],
};

export default nextConfig;
