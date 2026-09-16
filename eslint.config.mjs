/**
 * Optional JS-only ESLint (pnpm lint:js).
 * Primary lint is oxlint — works with TypeScript 7.0.2.
 * typescript-eslint cannot run on TS 7 (API break: ModuleKind.Cjs).
 */
/** @type {import('eslint').Linter.Config[]} */
const config = [
  {
    ignores: [
      '**/node_modules/**',
      '**/dist/**',
      '**/build/**',
      '**/.next/**',
      '**/.astro/**',
      '**/coverage/**',
      'pnpm-lock.yaml',
      '**/*.{ts,tsx,mts,cts}',
    ],
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
];

export default config;
