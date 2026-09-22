import type { ReactNode } from 'react';
import { redirect } from 'next/navigation';
import { AdminNav } from '@/components/admin-nav';
import { AdminTopbar } from '@/components/admin-topbar';
import { resolveSession } from '@/lib/resolve-session';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const allowDevBypass = process.env.ALLOW_DEV_AUTH_FALLBACK === 'true';
  const session = await resolveSession();
  const sessionUserId = session?.userId ?? null;

  if (!sessionUserId && !allowDevBypass) {
    redirect('/login');
  }

  let scheme = 'default';
  const locale = 'en';
  const dir = 'ltr';

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
