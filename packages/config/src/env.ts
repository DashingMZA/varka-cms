import { z } from 'zod';

const emptyToUndefined = (value: unknown) =>
  value === '' || value === null || value === undefined ? undefined : value;

const optionalUrl = z.preprocess(emptyToUndefined, z.string().url().optional());
const optionalString = z.preprocess(emptyToUndefined, z.string().min(1).optional());

/**
 * Server-side environment schema for VARKA.
 * Never import this module from browser bundles.
 */
export const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),

  // Database
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),

  // Cache / queues
  REDIS_URL: optionalUrl,

  // Auth
  AUTH_SECRET: z.string().min(32, 'AUTH_SECRET must be at least 32 characters'),
  SEED_OWNER_EMAIL: z.string().email().optional(),
  SEED_OWNER_PASSWORD: z.string().min(12).optional(),

  // Public + admin origins
  SITE_URL: z.string().url(),
  ADMIN_URL: z.string().url(),
  ADMIN_SUBDOMAIN: z.string().default('adminzb'),

  // Media
  STORAGE_DRIVER: z.enum(['local', 's3']).default('local'),
  LOCAL_STORAGE_PATH: z.string().default('.storage'),
  S3_ENDPOINT: optionalUrl,
  S3_REGION: optionalString,
  S3_BUCKET: optionalString,
  S3_ACCESS_KEY_ID: optionalString,
  S3_SECRET_ACCESS_KEY: optionalString,
  S3_FORCE_PATH_STYLE: z
    .preprocess(emptyToUndefined, z.enum(['true', 'false']).optional())
    .transform((v) => v === 'true'),

  // OAuth (optional — disabled when missing)
  GOOGLE_CLIENT_ID: optionalString,
  GOOGLE_CLIENT_SECRET: optionalString,
  GITHUB_CLIENT_ID: optionalString,
  GITHUB_CLIENT_SECRET: optionalString,

  // Theme
  THEME_LOCKED: optionalString,
  DEFAULT_THEME: z.string().default('theme-01'),
});

export type Env = z.infer<typeof envSchema>;

export type LoadEnvOptions = {
  /** When true, require production-critical secrets even if NODE_ENV is not production */
  strict?: boolean;
};

export function loadEnv(
  source: NodeJS.ProcessEnv | Record<string, string | undefined> = process.env,
  options: LoadEnvOptions = {},
): Env {
  const parsed = envSchema.safeParse(source);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((i) => `  - ${i.path.join('.')}: ${i.message}`)
      .join('\n');
    throw new Error(`Invalid environment configuration:\n${issues}`);
  }

  const env = parsed.data;
  const isProd = env.NODE_ENV === 'production' || options.strict === true;

  if (isProd) {
    if (!env.AUTH_SECRET || env.AUTH_SECRET.length < 32) {
      throw new Error('Production boot failed: AUTH_SECRET missing or too short');
    }
    if (!env.DATABASE_URL) {
      throw new Error('Production boot failed: DATABASE_URL missing');
    }
    if (env.STORAGE_DRIVER === 's3') {
      const missing = [
        !env.S3_BUCKET && 'S3_BUCKET',
        !env.S3_ACCESS_KEY_ID && 'S3_ACCESS_KEY_ID',
        !env.S3_SECRET_ACCESS_KEY && 'S3_SECRET_ACCESS_KEY',
        !env.S3_REGION && 'S3_REGION',
      ].filter(Boolean);
      if (missing.length > 0) {
        throw new Error(
          `Production boot failed: STORAGE_DRIVER=s3 requires ${missing.join(', ')}`,
        );
      }
    }
  }

  return env;
}
