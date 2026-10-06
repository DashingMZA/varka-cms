import { prisma } from '@varka/database';

/** Resolve primary site id (direct DB). Cached — the site ID is immutable. */
export async function getSiteId(): Promise<string> {
  const g = globalThis as unknown as { __varkaSiteId?: string };
  if (g.__varkaSiteId) return g.__varkaSiteId;
  const site = await prisma.site.findFirst({ where: { slug: 'varka' } });
  if (!site) throw new Error('Site not found — run pnpm db:seed');
  g.__varkaSiteId = site.id;
  return site.id;
}

export { prisma };
