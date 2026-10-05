import {
  createStorageAdapterFromEnv,
  normalizeDriverName,
  resolveStorageDriver,
  type StorageAdapter,
  type StorageDriverName,
} from '@varka/media';

/**
 * Storage driver resolution with admin-dashboard override.
 *
 * Priority:
 *  1. `media.storage_driver` SiteSetting (set from Settings → Media in the
 *     admin dashboard). Empty/missing = "use env".
 *  2. `STORAGE_DRIVER` env (local|s3|r2, default local).
 *
 * All driver credentials stay in .env — only the driver *selection* lives in
 * the database, so switching storage is one dropdown change.
 */
export const STORAGE_DRIVER_SETTING_KEY = 'media.storage_driver';

export async function getStorageDriver(): Promise<{
  driver: StorageDriverName;
  source: 'database' | 'env';
}> {
  try {
    const { prisma } = await import('@varka/database');
    const site = await prisma.site.findFirst({ where: { slug: 'varka' } });
    if (site) {
      const row = await prisma.siteSetting.findUnique({
        where: { siteId_key: { siteId: site.id, key: STORAGE_DRIVER_SETTING_KEY } },
      });
      const fromDb = normalizeDriverName(
        (row?.value as { driver?: unknown } | null)?.driver ?? row?.value,
      );
      if (fromDb) return { driver: fromDb, source: 'database' };
    }
  } catch {
    /* DB unavailable — fall through to env */
  }
  return { driver: resolveStorageDriver(), source: 'env' };
}

/** Storage adapter honoring the dashboard override. Use instead of createStorageAdapterFromEnv(). */
export async function getStorageAdapter(): Promise<StorageAdapter> {
  const { driver } = await getStorageDriver();
  return createStorageAdapterFromEnv(driver);
}
