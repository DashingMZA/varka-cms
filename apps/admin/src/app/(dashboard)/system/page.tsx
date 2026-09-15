import { AuditLogViewer } from '@/components/audit-log-viewer';
import { SystemHealth } from '@/components/system-health';

export default function SystemPage() {
  return (
    <main>
      <h1 style={{ marginTop: 0 }}>System</h1>
      <p style={{ color: 'var(--muted)' }}>
        Health, cache driver, queue depth, security audit. Background worker:{' '}
        <code>pnpm worker</code> (memory queue — process-local).
      </p>
      <h2 style={{ fontSize: 18 }}>Health</h2>
      <SystemHealth />
      <h2 style={{ fontSize: 18 }}>Audit log</h2>
      <AuditLogViewer />
    </main>
  );
}
