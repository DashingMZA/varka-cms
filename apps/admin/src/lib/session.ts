import { cookies } from 'next/headers';
import { getAuth } from '@/lib/auth';
import { authHeadersFromNext } from '@/lib/auth-headers';

export type ResolvedSession = {
  userId: string;
  email?: string | null;
  name?: string | null;
};

/**
 * Resolve the current Better Auth session for RSC / layouts.
 * 1) auth.api.getSession with explicit Cookie header
 * 2) Fallback: look up Session by token in DB (handles signed cookie token.hmac)
 */
export async function resolveSession(): Promise<ResolvedSession | null> {
  const authHeaders = await authHeadersFromNext();

  try {
    const session = await getAuth().api.getSession({ headers: authHeaders });
    if (session?.user?.id) {
      return {
        userId: session.user.id,
        email: session.user.email,
        name: session.user.name,
      };
    }
  } catch (e) {
    console.warn('[varka/auth] getSession threw', e);
  }

  try {
    const jar = await cookies();
    const raw =
      jar.get('varka.session_token')?.value ??
      jar.get('better-auth.session_token')?.value;
    if (!raw) return null;

    const token = raw.includes('.') ? raw.split('.')[0]! : raw;
    const { prisma } = await import('@varka/database');
    const row = await prisma.session.findUnique({
      where: { token },
      select: {
        userId: true,
        expiresAt: true,
        user: { select: { id: true, email: true, name: true, disabled: true } },
      },
    });

    if (!row) {
      const row2 = await prisma.session.findUnique({
        where: { token: raw },
        select: {
          userId: true,
          expiresAt: true,
          user: { select: { id: true, email: true, name: true, disabled: true } },
        },
      });
      if (!row2 || row2.expiresAt < new Date() || row2.user.disabled) {
        if (process.env.NODE_ENV !== 'production') {
          console.warn('[varka/auth] Session DB fallback: no row for token prefix', token.slice(0, 12));
        }
        return null;
      }
      return {
        userId: row2.user.id,
        email: row2.user.email,
        name: row2.user.name,
      };
    }

    if (row.expiresAt < new Date() || row.user.disabled) return null;

    return {
      userId: row.user.id,
      email: row.user.email,
      name: row.user.name,
    };
  } catch (e) {
    console.warn('[varka/auth] Session DB fallback failed', e);
    return null;
  }
}
