import { createRequire } from 'node:module';
import { createLocalAdapter } from './local-adapter';
import { createS3Adapter, type S3LikeClient } from './s3-adapter';
import type { StorageAdapter, StorageDriverName } from './types';

const require = createRequire(import.meta.url);

export function resolveStorageDriver(): StorageDriverName {
  const d = (process.env.STORAGE_DRIVER ?? 'local').toLowerCase();
  if (d === 's3' || d === 'r2' || d === 'local') return d;
  return 'local';
}

/** Normalize a user-supplied driver value (e.g. from the admin dashboard DB setting). */
export function normalizeDriverName(v: unknown): StorageDriverName | null {
  const d = String(v ?? '').toLowerCase();
  if (d === 's3' || d === 'r2' || d === 'local') return d;
  return null;
}

/**
 * Build adapter from env, with fully separated variables per driver.
 *
 * Switch drivers by changing ONE value: STORAGE_DRIVER=local|s3|r2
 * (or the `media.storage_driver` SiteSetting in the admin dashboard,
 * which overrides the env value).
 *
 * - local: LOCAL_STORAGE_PATH (default ./public/uploads — served statically
 *   by Next.js at /uploads/<key>), LOCAL_PUBLIC_URL (default /uploads)
 * - s3 (Amazon S3): S3_BUCKET, S3_REGION, S3_ACCESS_KEY_ID,
 *   S3_SECRET_ACCESS_KEY, S3_PUBLIC_URL, optional S3_ENDPOINT / S3_FORCE_PATH_STYLE
 * - r2 (Cloudflare R2): R2_BUCKET, R2_ENDPOINT
 *   (https://<account-id>.r2.cloudflarestorage.com), R2_ACCESS_KEY_ID,
 *   R2_SECRET_ACCESS_KEY, R2_PUBLIC_URL (https://<custom-domain> or r2.dev URL)
 *
 * s3/r2 need the optional `@aws-sdk/client-s3` package (not bundled for local).
 */
export function createStorageAdapterFromEnv(driverOverride?: string): StorageAdapter {
  const fromOverride = driverOverride ? normalizeDriverName(driverOverride) : null;
  const driver = fromOverride ?? resolveStorageDriver();

  if (driver === 'local') {
    return createLocalAdapter({
      rootDir: process.env.LOCAL_STORAGE_PATH ?? './public/uploads',
      publicBaseUrl: process.env.LOCAL_PUBLIC_URL ?? process.env.MEDIA_PUBLIC_URL ?? '/uploads',
    });
  }

  return driver === 'r2' ? createR2AdapterFromEnv() : createS3AdapterFromEnv();
}

function loadAwsSdk(driver: 's3' | 'r2'): {
  S3Client: new (c: unknown) => { send: (cmd: unknown) => Promise<unknown> };
  PutObjectCommand: new (i: unknown) => unknown;
  DeleteObjectCommand: new (i: unknown) => unknown;
} {
  // Dynamic package name so Turbopack/webpack do not resolve S3 when STORAGE_DRIVER=local
  const awsPackage = ['@aws-sdk', 'client-s3'].join('/');
  try {
    return require(awsPackage) as ReturnType<typeof loadAwsSdk>;
  } catch {
    throw new Error(
      `STORAGE_DRIVER=${driver}: install @aws-sdk/client-s3 (pnpm add @aws-sdk/client-s3) and set ${driver === 'r2' ? 'R2_' : 'S3_'}* env, or use STORAGE_DRIVER=local`,
    );
  }
}

function createS3AdapterFromEnv(): StorageAdapter {
  const bucket = process.env.S3_BUCKET;
  const publicBaseUrl = process.env.S3_PUBLIC_URL ?? process.env.MEDIA_PUBLIC_URL;
  if (!bucket || !publicBaseUrl) {
    throw new Error(
      'STORAGE_DRIVER=s3 requires S3_BUCKET and S3_PUBLIC_URL (or MEDIA_PUBLIC_URL)',
    );
  }

  const mod = loadAwsSdk('s3');
  const client = new mod.S3Client({
    region: process.env.S3_REGION ?? 'us-east-1',
    endpoint: process.env.S3_ENDPOINT || undefined,
    forcePathStyle: process.env.S3_FORCE_PATH_STYLE === 'true',
    credentials:
      process.env.S3_ACCESS_KEY_ID && process.env.S3_SECRET_ACCESS_KEY
        ? {
            accessKeyId: process.env.S3_ACCESS_KEY_ID,
            secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
          }
        : undefined,
  });

  const s3Like: S3LikeClient = {
    async putObject(args) {
      await client.send(
        new mod.PutObjectCommand({
          Bucket: args.Bucket,
          Key: args.Key,
          Body: args.Body,
          ContentType: args.ContentType,
        }),
      );
    },
    async deleteObject(args) {
      await client.send(
        new mod.DeleteObjectCommand({ Bucket: args.Bucket, Key: args.Key }),
      );
    },
  };

  return createS3Adapter({ name: 's3', bucket, publicBaseUrl, client: s3Like });
}

function createR2AdapterFromEnv(): StorageAdapter {
  const bucket = process.env.R2_BUCKET;
  const endpoint = process.env.R2_ENDPOINT;
  const publicBaseUrl = process.env.R2_PUBLIC_URL ?? process.env.MEDIA_PUBLIC_URL;
  if (!bucket || !endpoint || !publicBaseUrl) {
    throw new Error(
      'STORAGE_DRIVER=r2 requires R2_BUCKET, R2_ENDPOINT (https://<account-id>.r2.cloudflarestorage.com) and R2_PUBLIC_URL',
    );
  }

  const mod = loadAwsSdk('r2');
  const client = new mod.S3Client({
    region: 'auto',
    endpoint,
    forcePathStyle: false,
    credentials:
      process.env.R2_ACCESS_KEY_ID && process.env.R2_SECRET_ACCESS_KEY
        ? {
            accessKeyId: process.env.R2_ACCESS_KEY_ID,
            secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
          }
        : undefined,
  });

  const s3Like: S3LikeClient = {
    async putObject(args) {
      await client.send(
        new mod.PutObjectCommand({
          Bucket: args.Bucket,
          Key: args.Key,
          Body: args.Body,
          ContentType: args.ContentType,
        }),
      );
    },
    async deleteObject(args) {
      await client.send(
        new mod.DeleteObjectCommand({ Bucket: args.Bucket, Key: args.Key }),
      );
    },
  };

  return createS3Adapter({ name: 'r2', bucket, publicBaseUrl, client: s3Like });
}
