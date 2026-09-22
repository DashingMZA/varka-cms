import type { ReactNode } from 'react';
import { headers, cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { AdminNav } from '@/components/admin-nav';
import { AdminTopbar } from '@/components/admin-topbar';
import { getAuth } from '@/lib/auth';

/** Never cache auth-gated chrome — otherwise post-login still hits a cached 307→/login */
export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * WordPress-style admin chrome + hard session gate + per-user color scheme.
 * Missing session → /login (unless ALLOW_DEV_AUTH_FALLBACK=true).
 */
export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const allowDevBypass = process.env.ALLOW_DEV_AUTH_FALLBACK === 'true';
  const h = await headers();
  const locale = h.get('x-varka-locale') ?? 'en';
  const dir = h.get('x-varka-dir') ?? 'ltr';

  let scheme = 'default';
  let sessionUserId: string | null = null;

  try {
    const session = await getAuth().api.getSession({
      headers: h,
    });
    sessionUserId = session?.user?.id ?? null;

    if (process.env.NODE_ENV !== 'production' && !sessionUserId) {
      const jar = await cookies();
      const names = jar.getAll().map((c) => c.name);
      console.warn('[varka/auth] No session on dashboard. Cookies present:', names);
    }
  } catch (e) {
    console.warn('[varka/auth] getSession failed', e);
    sessionUserId = null;
  }

  if (!sessionUserId && !allowDevBypass) {
    redirect('/login');
  }

  if (sessionUserId) {
    try {
      const { prisma } = await import('@varka/database');
      const u = await prisma.user.findUnique({
        where: { id: sessionUserId },
        select: { adminColorScheme: true },
      });
      if (u?.adminColorScheme) scheme = u.adminColorScheme;
    } catch {
      /* ignore */
    }
  }

  return (
    <div className="v-admin" data-admin-scheme={scheme} lang={locale} dir={dir}>
      <script
        dangerouslySetInnerHTML={{
          __html: `document.documentElement.setAttribute('data-admin-scheme',${JSON.stringify(scheme)});document.documentElement.setAttribute('lang',${JSON.stringify(locale)});document.documentElement.setAttribute('dir',${JSON.stringify(dir)});`,
        }}
      />
      <AdminTopbar />
      <aside className="v-sidebar">
        <div className="v-sidebar__brand">VARKA</div>
        <AdminNav />
      </aside>
      <div className="v-main">{children}</div>
    </div>
  );
}
