import { cookies } from 'next/headers';
import { getAuth } from '@/lib/auth';
import { authHeadersFromNext } from '@/lib/auth-headers';

export type ResolvedSession = {
  userId: string;
  email?: string | null;
  name?: string | null;
};

/**
 * Resolve the current Better Auth session for server components / layouts.
 * 1) auth.api.getSession (primary)
 * 2) Fallback: look up Session by varka.session_token in DB
 */
export async function resolveSession(): Promise<ResolvedSession | null> {
  try {
    const headers = await authHeadersFromNext();
    const session = await getAuth().api.getSession({ headers });
    if (session?.user?.id) {
      return {
        userId: session.user.id,
        email: session.user.email,
        name: session.user.name,
      };
    }
  } catch (e) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn('[varka/auth] getSession threw', e);
    }
  }

  try {
    const jar = await cookies();
    const token = jar.get('varka.session_token')?.value;
    if (!token) return null;

    const { prisma } = await import('@varka/database');
    const row = await prisma.session.findUnique({
      where: { token },
      include: {
        user: { select: { id: true, email: true, name: true, disabled: true } },
      },
    });

    if (!row) {
      if (process.env.NODE_ENV !== 'production') {
        console.warn('[varka/auth] session token not in DB', token.slice(0, 12));
      }
      return null;
    }
    if (row.expiresAt.getTime() <= Date.now()) {
      if (process.env.NODE_ENV !== 'production') {
        console.warn('[varka/auth] session expired', row.expiresAt.toISOString());
      }
      return null;
    }
    if (row.user.disabled) return null;

    return {
      userId: row.user.id,
      email: row.user.email,
      name: row.user.name,
    };
  } catch (e) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn('[varka/auth] DB session fallback failed', e);
    }
    return null;
  }
}
