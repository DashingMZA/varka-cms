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

/**
 * Build adapter from env.
 * - local: LOCAL_STORAGE_PATH (default .storage), served via /api/media/file/*
 * - s3/r2: needs S3_BUCKET + credentials; optional @aws-sdk/client-s3 (not bundled for local)
 */
export function createStorageAdapterFromEnv(): StorageAdapter {
  const driver = resolveStorageDriver();

  if (driver === 'local') {
    return createLocalAdapter({
      rootDir: process.env.LOCAL_STORAGE_PATH ?? '.storage',
      publicBaseUrl: process.env.MEDIA_PUBLIC_URL ?? '/api/media/file',
    });
  }

  return createS3AdapterFromEnv(driver === 'r2' ? 'r2' : 's3');
}

function createS3AdapterFromEnv(name: 's3' | 'r2'): StorageAdapter {
  const bucket = process.env.S3_BUCKET;
  const publicBaseUrl = process.env.MEDIA_PUBLIC_URL ?? process.env.S3_PUBLIC_URL;
  if (!bucket || !publicBaseUrl) {
    throw new Error('S3/R2 requires S3_BUCKET and MEDIA_PUBLIC_URL (or S3_PUBLIC_URL)');
  }

  // Dynamic package name so Turbopack/webpack do not resolve S3 when STORAGE_DRIVER=local
  const awsPackage = ['@aws-sdk', 'client-s3'].join('/');
  let mod: {
    S3Client: new (c: unknown) => { send: (cmd: unknown) => Promise<unknown> };
    PutObjectCommand: new (i: unknown) => unknown;
    DeleteObjectCommand: new (i: unknown) => unknown;
  };
  try {
    mod = require(awsPackage) as typeof mod;
  } catch {
    throw new Error(
      `STORAGE_DRIVER=${name}: install @aws-sdk/client-s3 (pnpm add @aws-sdk/client-s3) and set S3_* env, or use STORAGE_DRIVER=local`,
    );
  }

  const client = new mod.S3Client({
    region: process.env.S3_REGION ?? 'auto',
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

  return createS3Adapter({
    name,
    bucket,
    publicBaseUrl,
    client: s3Like,
  });
}
