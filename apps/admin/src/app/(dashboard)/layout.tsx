import type { ReactNode } from 'react';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { isRtlLocale, resolveLocale } from '@varka/i18n';
import { AdminNav } from '@/components/admin-nav';
import { AdminTopbar } from '@/components/admin-topbar';
import { HtmlAttrs } from '@/components/html-attrs';
import { resolveSession } from '@/lib/resolve-session';

/** Never cache auth-gated chrome — otherwise post-login still hits a cached 307→/login */
export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * WordPress-style admin chrome + hard session gate + per-user color scheme.
 * Missing session → /login (unless ALLOW_DEV_AUTH_FALLBACK=true).
 */
export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const allowDevBypass = process.env.ALLOW_DEV_AUTH_FALLBACK === 'true';
  const session = await resolveSession();
  const sessionUserId = session?.userId ?? null;

  if (!sessionUserId && !allowDevBypass) {
    redirect('/login');
  }

  let scheme = 'default';

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

  const jar = await cookies();
  const locale = resolveLocale(jar.get('varka_locale')?.value ?? 'en');
  const dir = isRtlLocale(locale) ? 'rtl' : 'ltr';

  return (
    <div className="v-admin" data-admin-scheme={scheme} lang={locale} dir={dir}>
      <HtmlAttrs locale={locale} dir={dir} scheme={scheme} />
      <AdminTopbar locale={locale} />
      <aside className="v-sidebar">
        <div className="v-sidebar__brand">VARKA</div>
        <AdminNav locale={locale} />
      </aside>
      <div className="v-main">{children}</div>
    </div>
  );
}
