import type { ReactNode } from 'react';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { AdminNav } from '@/components/admin-nav';
import { getAuth } from '@/lib/auth';

/**
 * Dashboard chrome + session gate.
 * Unauthenticated users → /login (unless ALLOW_DEV_AUTH_FALLBACK=true).
 */
export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const allowFallback =
    process.env.ALLOW_DEV_AUTH_FALLBACK === 'true' ||
    process.env.NODE_ENV !== 'production';

  try {
    const h = await headers();
    const session = await getAuth().api.getSession({ headers: h });
    if (!session?.user && !allowFallback) {
      redirect('/login');
    }
  } catch {
    if (!allowFallback) redirect('/login');
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', minHeight: '100vh' }}>
      <aside
        style={{
          borderRight: '1px solid var(--border)',
          background: 'var(--card)',
          padding: 16,
        }}
      >
        <div style={{ fontWeight: 700, marginBottom: 16, letterSpacing: '0.04em' }}>VARKA</div>
        <AdminNav />
      </aside>
      <div style={{ padding: 24 }}>{children}</div>
    </div>
  );
}
