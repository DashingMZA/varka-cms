import type { AuthContext } from '@varka/permissions';
import { getAuth } from '@/lib/auth';
import { authHeadersFromNext, authHeadersFromRequest } from '@/lib/auth-headers';

/**
 * Resolve AuthContext for admin API routes.
 * 1) Better Auth session → loadAuthContext(userId)
 * 2) Fallback owner context only when ALLOW_DEV_AUTH_FALLBACK=true (explicit)
 */
export async function getAuthContext(req?: Request): Promise<AuthContext> {
  try {
    const auth = getAuth();
    const hdrs = req ? authHeadersFromRequest(req) : await authHeadersFromNext();
    const session = await auth.api.getSession({ headers: hdrs });
    if (session?.user?.id) {
      const { loadAuthContext } = await import('@varka/auth');
      const ctx = await loadAuthContext(session.user.id);
      if (ctx && !ctx.disabled) return ctx;
    }
  } catch {
    // session unavailable
  }

  const allowFallback = process.env.ALLOW_DEV_AUTH_FALLBACK === 'true';

  if (!allowFallback) {
    return {
      userId: '',
      roles: [],
      permissions: [],
      disabled: true,
    };
  }

  let userId = 'dev-user';
  try {
    const { prisma } = await import('@varka/database');
    const owner = await prisma.user.findFirst({
      where: {
        roles: { some: { role: { slug: { in: ['owner', 'admin', 'administrator'] } } } },
      },
      orderBy: { createdAt: 'asc' },
      select: { id: true },
    });
    if (owner?.id) userId = owner.id;
    else {
      const any = await prisma.user.findFirst({
        orderBy: { createdAt: 'asc' },
        select: { id: true },
      });
      if (any?.id) userId = any.id;
    }
  } catch {
    /* keep dev-user */
  }

  return {
    userId,
    roles: ['owner'],
    permissions: [
      'posts.read',
      'posts.create',
      'posts.update',
      'posts.publish',
      'posts.delete',
      'pages.read',
      'pages.create',
      'pages.update',
      'pages.publish',
      'media.read',
      'media.upload',
      'media.update',
      'media.delete',
      'comments.read',
      'comments.moderate',
      'comments.delete',
      'themes.read',
      'themes.activate',
      'seo.read',
      'seo.update',
      'settings.read',
      'settings.update',
      'users.read',
      'users.manage',
      'languages.read',
      'languages.manage',
      'audit.read',
      'security.read',
    ],
  };
}
