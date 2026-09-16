/**
 * ESLint 10 + TypeScript 7.0.2
 *
 * typescript-eslint still gates on TS < 7. We only adjust the *reported*
 * version string for that check; the installed typescript remains 7.0.2
 * for tsc / the whole repo. Type-aware lint rules are not used.
 *
 * @see https://github.com/typescript-eslint/typescript-eslint/issues/10940
 */
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

// --- version gate shim (must run before importing typescript-eslint) ---
{
  const ts = require('typescript');
  if (typeof ts.version === 'string' && ts.version.startsWith('7.')) {
    const reported = '5.9.2';
    Object.defineProperty(ts, 'version', {
      configurable: true,
      enumerable: true,
      get: () => reported,
    });
    Object.defineProperty(ts, 'versionMajorMinor', {
      configurable: true,
      enumerable: true,
      get: () => '5.9',
    });
  }
}

const tseslint = require('typescript-eslint');

export default tseslint.config(
  {
    ignores: [
      '**/node_modules/**',
      '**/dist/**',
      '**/build/**',
      '**/.next/**',
      '**/.astro/**',
      '**/coverage/**',
      'pnpm-lock.yaml',
      '**/*.css.ts',
    ],
  },
  // Non-type-aware recommended rules only (works without project service)
  ...tseslint.configs.recommended,
  {
    files: ['**/*.{ts,tsx,mts,cts}'],
    languageOptions: {
      parserOptions: {
        ecmaFeatures: { jsx: true },
        // Do not set `project` — avoids deep TS 7 program API requirements
      },
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
      '@typescript-eslint/no-require-imports': 'off',
      '@typescript-eslint/ban-ts-comment': 'off',
      '@typescript-eslint/no-empty-object-type': 'off',
      '@typescript-eslint/no-unsafe-function-type': 'off',
      '@typescript-eslint/no-wrapper-object-types': 'off',
      'no-unused-vars': 'off',
      eqeqeq: ['error', 'always'],
      'no-eval': 'error',
      'no-implied-eval': 'error',
    },
  },
  {
    files: ['**/*.{js,mjs,cjs}'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
    },
    rules: {
      'no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      'no-undef': 'off',
      eqeqeq: ['error', 'always'],
      'no-eval': 'error',
      'no-implied-eval': 'error',
    },
  },
);
