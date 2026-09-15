const path = require('node:path');
const dotenv = require('dotenv');
const { defineConfig, env } = require('prisma/config');

dotenv.config({
  path: path.resolve(__dirname, '../../.env'),
});

module.exports = defineConfig({
  schema: 'prisma/schema.prisma',

  migrations: {
    path: 'prisma/migrations',
    seed: 'node --import tsx prisma/seed.ts',
  },

  datasource: {
    url: env('DATABASE_URL'),
  },
});
