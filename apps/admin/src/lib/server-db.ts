import { prisma } from '@varka/database';
import { getAuthContext } from '@/lib/auth-context';
import type { AuthContext } from '@varka/permissions';

export { prisma };

export async function getSiteId(): Promise<string> {
  const site = await prisma.site.findFirst({ where: { slug: 'varka' } });
  if (!site) throw new Error('Site not found — run seed');
  return site.id;
}

export async function getServerAuth(): Promise<AuthContext> {
  return getAuthContext();
}

export async function requireServerAuth(
  permission?: string,
): Promise<{ ctx: AuthContext; siteId: string }> {
  const ctx = await getAuthContext();
  if (!ctx.userId || ctx.disabled) {
    throw new Error('Unauthorized');
  }
  if (permission) {
    const isOwner =
      ctx.roles.includes('owner') ||
      ctx.roles.includes('admin') ||
      ctx.roles.includes('administrator');
    if (!isOwner && !ctx.permissions.includes(permission as never)) {
      throw new Error('Forbidden');
    }
  }
  const siteId = await getSiteId();
  return { ctx, siteId };
}

export function slugifyName(name: string): string {
  return (
    name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 80) || 'item'
  );
}
