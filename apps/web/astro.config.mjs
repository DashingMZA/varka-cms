import { defineConfig } from 'astro/config';
import node from '@astrojs/node';

/**
 * Server output so published posts appear without a full rebuild.
 * Dev + Node standalone for production preview.
 */
export default defineConfig({
  output: 'server',
  adapter: node({ mode: 'standalone' }),
  server: { port: 4321 },
  vite: {
    ssr: {
      noExternal: ['@varka/themes', '@varka/seo', '@varka/i18n'],
    },
  },
});
