'use client';

import { useMessages } from '@/lib/i18n';

/** Label with hard fallback so missing i18n never shows raw keys */
function L(
  t: (ns: 'security' | 'common', key: string) => string,
  key: string,
  fallback: string,
): string {
  const v = t('security', key);
  if (!v || v === key || v.startsWith('security.')) return fallback;
  return v;
}
import { AuditLogViewer } from '@/components/audit-log-viewer';
import { SystemHealth } from '@/components/system-health';

export default function SystemPage() {
  const { t } = useMessages();
  return (
    <main>
      <h1 style={{ marginTop: 0 }}>{L(t, 'system', 'System')}</h1>
      <p style={{ color: 'var(--muted)' }}>
        {L(t, 'systemDescPrefix', 'Health, cache driver, queue depth, security audit. Background worker: ')}
        <code>pnpm worker</code>
        {L(t, 'systemDescSuffix', ' (memory queue — process-local).')}
      </p>
      <h2 style={{ fontSize: 18 }}>{L(t, 'health', 'Health')}</h2>
      <SystemHealth />
      <h2 style={{ fontSize: 18 }}>{L(t, 'auditLog', 'Audit log')}</h2>
      <AuditLogViewer />
    </main>
  );
}
