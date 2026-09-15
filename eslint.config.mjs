/** @type {import("eslint").Linter.Config[]} */
const config = [
  {
    ignores: [
      "**/node_modules/**",
      "**/dist/**",
      "**/build/**",
      "**/.next/**",
      "**/.astro/**",
      "**/coverage/**",
      "pnpm-lock.yaml",
    ],
  },
  {
    files: ["**/*.{js,mjs,cjs,ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
    },
    rules: {
      "no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
        },
      ],
      "no-undef": "off",
      "eqeqeq": ["error", "always"],
      "no-eval": "error",
      "no-implied-eval": "error",
    },
  },
];

export default config;
