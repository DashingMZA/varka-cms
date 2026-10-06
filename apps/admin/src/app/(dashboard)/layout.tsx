import type { ReactNode } from 'react';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { isRtlLocale, resolveLocale } from '@varka/i18n';
import { AdminNav } from '@/components/admin-nav';
import { AdminTopbar } from '@/components/admin-topbar';
import { HtmlAttrs } from '@/components/html-attrs';
import { resolveSession } from '@/lib/resolve-session';
import { getActivePluginMenuAction } from '@/actions/plugins';

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

  const jar = await cookies();
  const locale = resolveLocale(jar.get('varka_locale')?.value ?? 'en');
  const dir = isRtlLocale(locale) ? 'rtl' : 'ltr';

  // Independent per-request work runs in parallel instead of sequentially:
  // user color scheme + active plugin menu entries (e.g. "WP Import").
  const [resolvedScheme, pluginMenu] = await Promise.all([
    (async (): Promise<string> => {
      if (!sessionUserId) return 'default';
      try {
        const { prisma } = await import('@varka/database');
        const u = await prisma.user.findUnique({
          where: { id: sessionUserId },
          select: { adminColorScheme: true },
        });
        return u?.adminColorScheme ?? 'default';
      } catch {
        return 'default';
      }
    })(),
    (async (): Promise<Array<{ slug: string; title: string; icon: string }>> => {
      if (!sessionUserId) return [];
      try {
        const r = await getActivePluginMenuAction();
        return r.ok ? r.data : [];
      } catch {
        /* nav renders without plugin entries */
        return [];
      }
    })(),
  ]);
  scheme = resolvedScheme;

  return (
    <div className="v-admin" data-admin-scheme={scheme} lang={locale} dir={dir}>
      <HtmlAttrs locale={locale} dir={dir} scheme={scheme} />
      <AdminTopbar locale={locale} />
      <aside className="v-sidebar">
        <div className="v-sidebar__brand">VARKA</div>
        <AdminNav locale={locale} pluginMenu={pluginMenu} />
      </aside>
      <main className="v-main">{children}</main>
    </div>
  );
}
