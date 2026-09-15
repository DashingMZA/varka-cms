import type { AuthContext } from '@varka/permissions';
import { getAuth } from '@/lib/auth';

/**
 * Resolve AuthContext for admin API routes.
 * 1) Better Auth session → loadAuthContext(userId)
 * 2) Fallback owner context when ALLOW_DEV_AUTH_FALLBACK=true (or non-production)
 */
export async function getAuthContext(req?: Request): Promise<AuthContext> {
  try {
    const auth = getAuth();
    const session = await auth.api.getSession({
      headers: req?.headers ?? new Headers(),
    });
    if (session?.user?.id) {
      const { loadAuthContext } = await import('@varka/auth');
      const ctx = await loadAuthContext(session.user.id);
      if (ctx && !ctx.disabled) return ctx;
    }
  } catch {
    // session unavailable
  }

  const allowFallback =
    process.env.ALLOW_DEV_AUTH_FALLBACK === 'true' ||
    process.env.NODE_ENV !== 'production';

  if (!allowFallback) {
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
      'languages.read',
      'languages.manage',
      'audit.read',
      'security.read',
    ],
  };
}
