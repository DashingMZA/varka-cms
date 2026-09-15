import type { AuthContext } from '@varka/permissions';

/**
 * Resolve AuthContext for admin API routes.
 * 1) Try Better Auth session → loadAuthContext(userId)
 * 2) Dev/deploy fallback: owner-like context when AUTH is not wired
 *    (set ALLOW_DEV_AUTH_FALLBACK=false in production once login works).
 */
export async function getAuthContext(req?: Request): Promise<AuthContext> {
  try {
    const { auth } = await import('@varka/auth');
    // better-auth API: getSession from headers
    const session = await auth.api.getSession({
      headers: req?.headers ?? new Headers(),
    });
    if (session?.user?.id) {
      const { loadAuthContext } = await import('@varka/auth');
      const ctx = await loadAuthContext(session.user.id);
      if (ctx && !ctx.disabled) return ctx;
    }
  } catch {
    // auth package or session unavailable
  }

  const allowFallback =
    process.env.ALLOW_DEV_AUTH_FALLBACK !== 'false' &&
    process.env.NODE_ENV !== 'production';

  if (!allowFallback && process.env.ALLOW_DEV_AUTH_FALLBACK !== 'true') {
    // Production without session: empty permissions (callers must 401)
    return {
      userId: '',
      roles: [],
      permissions: [],
      disabled: true,
    };
  }

  return {
    userId: 'dev-user',
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
      'comments.read',
      'comments.moderate',
      'themes.read',
      'themes.activate',
      'seo.read',
      'seo.update',
      'settings.read',
      'settings.update',
      'users.read',
      'audit.read',
    ],
  };
}
