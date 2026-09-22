import type { AuthContext } from '@varka/permissions';
import { getAuth } from '@/lib/auth';
import { authHeadersFromNext, authHeadersFromRequest } from '@/lib/auth-headers';

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

  try {
    let token: string | undefined;
    if (req) {
      const cookie = req.headers.get('cookie') ?? '';
      const m = cookie.match(/(?:^|;\s*)varka\.session_token=([^;]+)/);
      token = m?.[1] ? decodeURIComponent(m[1]) : undefined;
    } else {
      const { cookies } = await import('next/headers');
      token = (await cookies()).get('varka.session_token')?.value;
    }
    if (token) {
      const { prisma } = await import('@varka/database');
      const row = await prisma.session.findUnique({
        where: { token },
        select: { userId: true, expiresAt: true, user: { select: { disabled: true } } },
      });
      if (row && row.expiresAt.getTime() > Date.now() && !row.user.disabled) {
        const { loadAuthContext } = await import('@varka/auth');
        const ctx = await loadAuthContext(row.userId);
        if (ctx && !ctx.disabled) return ctx;
      }
    }
  } catch {
    /* ignore */
  }

  const allowFallback = process.env.ALLOW_DEV_AUTH_FALLBACK === 'true';
  if (!allowFallback) {
    return { userId: '', roles: [], permissions: [], disabled: true };
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
  } catch {
    /* keep */
  }

  return {
    userId,
    roles: ['owner'],
    permissions: [
      'posts.read', 'posts.create', 'posts.update', 'posts.publish', 'posts.delete',
      'pages.read', 'pages.create', 'pages.update', 'pages.publish',
      'media.read', 'media.upload', 'media.update', 'media.delete',
      'comments.read', 'comments.moderate', 'comments.delete',
      'themes.read', 'themes.activate',
      'seo.read', 'seo.update',
      'settings.read', 'settings.update',
      'users.read', 'users.manage',
      'languages.read', 'languages.manage',
      'audit.read', 'security.read',
    ],
  };
}
