#!/usr/bin/env node
/**
 * Build the wordpress-import plugin.
 * Compiles src/entry.ts → dist/entry.js (ESM, dependencies external).
 *
 * Usage: node build.mjs   (run from the plugin directory)
 */
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);

// Resolve esbuild from the monorepo's pnpm store.
const esbuildPkg = require.resolve('esbuild', {
  paths: [path.join(dir, '..', '..')],
});
const { build } = await import(esbuildPkg);

await build({
  entryPoints: [path.join(dir, 'src', 'entry.ts')],
  bundle: true,
  platform: 'node',
  format: 'esm',
  target: 'node22',
  outfile: path.join(dir, 'dist', 'entry.js'),
  external: [
    'react',
    'react-dom',
    'next',
    'next/server',
    '@varka/*',
    '@prisma/*',
    'node:*',
  ],
  jsx: 'automatic',
  logLevel: 'info',
});

console.log('[plugin] wordpress-import built → dist/entry.js');
