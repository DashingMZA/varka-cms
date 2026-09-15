import { createLocalAdapter } from './local-adapter';
import type { StorageAdapter, StorageDriverName } from './types';

export function resolveStorageDriver(): StorageDriverName {
  const d = (process.env.STORAGE_DRIVER ?? 'local').toLowerCase();
  if (d === 's3' || d === 'r2' || d === 'local') return d;
  return 'local';
}

/**
 * Build adapter from env.
 * - local: LOCAL_STORAGE_PATH (default .storage)
 * - s3/r2: requires runtime injection of AWS client (see createS3Adapter)
 */
export function createStorageAdapterFromEnv(): StorageAdapter {
  const driver = resolveStorageDriver();
  if (driver === 'local') {
    return createLocalAdapter({
      rootDir: process.env.LOCAL_STORAGE_PATH ?? '.storage',
      publicBaseUrl: process.env.MEDIA_PUBLIC_URL ?? '/media',
    });
  }
  throw new Error(
    `STORAGE_DRIVER=${driver} requires S3 client wiring (createS3Adapter). Use local for day-1 without AWS SDK.`,
  );
}
