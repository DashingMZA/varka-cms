import { prisma } from '@varka/database';

/** Resolve primary site id (direct DB). */
export async function getSiteId(): Promise<string> {
  const site = await prisma.site.findFirst({ where: { slug: 'varka' } });
  if (!site) throw new Error('Site not found — run pnpm db:seed');
  return site.id;
}

export { prisma };
