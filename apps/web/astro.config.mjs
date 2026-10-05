import { defineConfig } from 'astro/config';
import node from '@astrojs/node';
import vercel from '@astrojs/vercel';

/**
 * Server output so published posts appear without a full rebuild.
 * Adapter is switchable: ADAPTER=vercel on Vercel, otherwise Node standalone
 * (local dev, Docker/VPS production).
 */
const adapter =
  process.env.ADAPTER === 'vercel' ? vercel() : node({ mode: 'standalone' });

export default defineConfig({
  output: 'server',
  adapter,
  server: { port: 4321 },
  vite: {
    ssr: {
      noExternal: ['@varka/themes', '@varka/seo', '@varka/i18n'],
    },
  },
});
