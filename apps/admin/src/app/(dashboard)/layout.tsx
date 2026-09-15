import type { ReactNode } from 'react';
import { AdminNav } from '@/components/admin-nav';

/**
 * Dashboard chrome. Session gate is enforced in middleware / server layouts
 * once Better Auth session helpers are connected after local install.
 */
export default function DashboardLayout({ children }: { children: ReactNode }) {
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
