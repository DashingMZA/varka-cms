import type { ReactNode } from 'react';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { AdminNav } from '@/components/admin-nav';
import { AdminTopbar } from '@/components/admin-topbar';
import { getAuth } from '@/lib/auth';

/**
 * WordPress-style admin chrome + session gate + per-user color scheme.
 */
export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const allowFallback =
    process.env.ALLOW_DEV_AUTH_FALLBACK === 'true' ||
    process.env.NODE_ENV !== 'production';

  let scheme = 'default';

  try {
    const h = await headers();
    const session = await getAuth().api.getSession({ headers: h });
    if (!session?.user && !allowFallback) {
      redirect('/login');
    }
    if (session?.user?.id) {
      try {
        const { prisma } = await import('@varka/database');
        const u = await prisma.user.findUnique({
          where: { id: session.user.id },
          select: { adminColorScheme: true },
        });
        if (u?.adminColorScheme) scheme = u.adminColorScheme;
      } catch {
        /* ignore */
      }
    }
  } catch {
    if (!allowFallback) redirect('/login');
  }

  return (
    <div className="v-admin" data-admin-scheme={scheme}>
      <script
        dangerouslySetInnerHTML={{
          __html: `document.documentElement.setAttribute('data-admin-scheme',${JSON.stringify(scheme)});`,
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
