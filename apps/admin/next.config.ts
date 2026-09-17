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
