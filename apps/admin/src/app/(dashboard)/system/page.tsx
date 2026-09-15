import { AuditLogViewer } from '@/components/audit-log-viewer';

export default function SystemPage() {
  return (
    <main>
      <h1 style={{ marginTop: 0 }}>System</h1>
      <p style={{ color: 'var(--muted)' }}>
        Security headers via middleware · audit trail for sensitive actions · origin checks on
        public POST.
      </p>
      <h2 style={{ fontSize: 18 }}>Audit log</h2>
      <AuditLogViewer />
    </main>
  );
}
