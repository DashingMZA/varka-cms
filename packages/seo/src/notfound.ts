/**
 * 404 not-found logging for SEO monitor.
 * Shared by admin (viewing) and public frontend (logging).
 */

export type NotFoundDb = {
  notFoundLog: {
    upsert: (args: {
      where: { siteId_path: { siteId: string; path: string } };
      update: { hits: { increment: number }; referrer?: string | null; userAgent?: string | null };
      create: {
        siteId: string;
        path: string;
        referrer?: string | null;
        userAgent?: string | null;
      };
    }) => Promise<unknown>;
    findMany: (args: {
      where: { siteId: string };
      select?: Record<string, boolean>;
      orderBy?: Record<string, string>;
      take?: number;
    }) => Promise<
      Array<{ id: string; path: string; hits: number; firstSeen: Date; lastSeen: Date; referrer: string | null }>
    >;
    deleteMany: (args: { where: { siteId: string } }) => Promise<{ count: number }>;
    delete: (args: { where: { id: string } }) => Promise<unknown>;
  };
};

/**
 * Log a 404 hit. Upserts by (siteId, path), incrementing hits.
 * Safe to call from public frontend — no auth required.
 */
export async function logNotFound(
  db: NotFoundDb,
  siteId: string,
  path: string,
  opts?: {
    referrer?: string | null;
    userAgent?: string | null;
    /** Path prefixes/substrings to skip logging (from SEO settings "exclude paths"). */
    exclude?: string[];
  },
): Promise<void> {
  // Normalize path: strip query string, limit length
  const cleanPath = path.split('?')[0]?.slice(0, 500) ?? '';
  if (!cleanPath || cleanPath === '/') return;
  if (opts?.exclude?.some((p) => p && cleanPath.includes(p))) return;

  await db.notFoundLog.upsert({
    where: { siteId_path: { siteId, path: cleanPath } },
    update: {
      hits: { increment: 1 },
      ...(opts?.referrer ? { referrer: opts.referrer.slice(0, 500) } : {}),
      ...(opts?.userAgent ? { userAgent: opts.userAgent.slice(0, 500) } : {}),
    },
    create: {
      siteId,
      path: cleanPath,
      referrer: opts?.referrer?.slice(0, 500) ?? null,
      userAgent: opts?.userAgent?.slice(0, 500) ?? null,
    },
  });
}

/**
 * List 404 logs for admin display.
 */
export async function listNotFoundLogs(
  db: NotFoundDb,
  siteId: string,
  limit = 100,
): Promise<Array<{ id: string; path: string; hits: number; firstSeen: Date; lastSeen: Date; referrer: string | null }>> {
  return db.notFoundLog.findMany({
    where: { siteId },
    select: { id: true, path: true, hits: true, firstSeen: true, lastSeen: true, referrer: true },
    orderBy: { hits: 'desc' },
    take: Math.min(limit, 500),
  });
}

/**
 * Clear all 404 logs for a site.
 */
export async function clearNotFoundLogs(
  db: NotFoundDb,
  siteId: string,
): Promise<{ count: number }> {
  return db.notFoundLog.deleteMany({ where: { siteId } });
}
