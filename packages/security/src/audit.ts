export type AuditWrite = {
  siteId?: string | null;
  actorId?: string | null;
  actorEmail?: string | null;
  action: string;
  entityType?: string | null;
  entityId?: string | null;
  ip?: string | null;
  userAgent?: string | null;
  meta?: Record<string, unknown> | null;
};

export type AuditDb = {
  auditLog: {
    create: (args: unknown) => Promise<unknown>;
    findMany: (args: unknown) => Promise<unknown[]>;
  };
};

/** Fire-and-forget safe: caller may void this */
export async function writeAudit(db: AuditDb, entry: AuditWrite): Promise<void> {
  await db.auditLog.create({
    data: {
      siteId: entry.siteId ?? null,
      actorId: entry.actorId ?? null,
      actorEmail: entry.actorEmail ?? null,
      action: entry.action,
      entityType: entry.entityType ?? null,
      entityId: entry.entityId ?? null,
      ip: entry.ip ?? null,
      userAgent: entry.userAgent ?? null,
      meta: entry.meta ?? undefined,
    },
  });
}

export async function listAudit(
  db: AuditDb,
  opts: { siteId?: string; limit?: number; cursor?: string },
) {
  const limit = Math.min(opts.limit ?? 50, 200);
  const items = (await db.auditLog.findMany({
    where: opts.siteId ? { siteId: opts.siteId } : {},
    take: limit + 1,
    ...(opts.cursor ? { cursor: { id: opts.cursor }, skip: 1 } : {}),
    orderBy: { createdAt: 'desc' },
  })) as Array<{ id: string }>;
  const hasMore = items.length > limit;
  const page = hasMore ? items.slice(0, limit) : items;
  return {
    items: page,
    nextCursor: hasMore ? page[page.length - 1]?.id ?? null : null,
    hasMore,
  };
}
