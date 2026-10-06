import { cache } from 'react';
import { cookies } from 'next/headers';
import { getAuth } from '@/lib/auth';
import { authHeadersFromNext } from '@/lib/auth-headers';

export type ResolvedSession = {
  userId: string;
  email?: string | null;
  name?: string | null;
};

function tokenCandidates(raw: string): string[] {
  const decoded = (() => {
    try {
      return decodeURIComponent(raw);
    } catch {
      return raw;
    }
  })();
  const out = new Set<string>([raw, decoded]);
  for (const v of [raw, decoded]) {
    if (v.includes('.')) {
      out.add(v.split('.')[0]!);
      const parts = v.split('.');
      if (parts.length >= 2) out.add(parts.slice(0, -1).join('.'));
    }
  }
  return [...out].filter(Boolean);
}

/**
 * Resolve the current Better Auth session for server components / layouts.
 * 1) auth.api.getSession (primary)
 * 2) Fallback: Session table by varka.session_token (handles signed cookies)
 *
 * Cached per request — one request resolves the session at most once even
 * when layout + actions + pages each ask for it.
 */
export const resolveSession = cache(
  async function resolveSession(): Promise<ResolvedSession | null> {
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
    const raw = jar.get('varka.session_token')?.value;
    if (!raw) {
      if (process.env.NODE_ENV !== 'production') {
        console.warn('[varka/auth] no varka.session_token cookie');
      }
      return null;
    }

    const { prisma } = await import('@varka/database');
    const candidates = tokenCandidates(raw);

    for (const token of candidates) {
      const row = await prisma.session.findUnique({
        where: { token },
        include: {
          user: { select: { id: true, email: true, name: true, disabled: true } },
        },
      });
      if (!row) continue;
      if (row.expiresAt.getTime() <= Date.now()) {
        if (process.env.NODE_ENV !== 'production') {
          console.warn('[varka/auth] session expired', row.expiresAt.toISOString());
        }
        continue;
      }
      if (row.user.disabled) return null;
      return {
        userId: row.user.id,
        email: row.user.email,
        name: row.user.name,
      };
    }

    if (process.env.NODE_ENV !== 'production') {
      const recent = await prisma.session.findMany({
        orderBy: { createdAt: 'desc' },
        take: 3,
        select: { token: true, userId: true, expiresAt: true },
      });
      console.warn('[varka/auth] session token not in DB', {
        cookiePrefix: raw.slice(0, 16),
        candidatesTried: candidates.map((c) => c.slice(0, 16)),
        recentDbTokens: recent.map(
          (r: { token: string; userId: string; expiresAt: Date }) => ({
            prefix: r.token.slice(0, 16),
            userId: r.userId,
            exp: r.expiresAt.toISOString(),
          }),
        ),
      });
    }
    return null;
  } catch (e) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn('[varka/auth] DB session fallback failed', e);
    }
    return null;
  }
});
