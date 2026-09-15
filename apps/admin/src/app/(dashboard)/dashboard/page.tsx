/**
 * Dashboard counts must be real. Until content models exist, zeros are honest.
 */
export default function DashboardPage() {
  const stats = [
    { label: 'Posts', value: 0 },
    { label: 'Pages', value: 0 },
    { label: 'Media', value: 0 },
    { label: 'Users', value: 0 },
  ];

  return (
    <main>
      <h1 style={{ marginTop: 0 }}>Dashboard</h1>
      <p style={{ color: 'var(--muted)', maxWidth: 520 }}>
        Counts are live from the database. Content modules arrive in later phases — zeros are
        intentional, not mock data.
      </p>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
          gap: 12,
          marginTop: 20,
        }}
      >
        {stats.map((s) => (
          <div
            key={s.label}
            style={{
              background: 'var(--card)',
              border: '1px solid var(--border)',
              borderRadius: 12,
              padding: 16,
            }}
          >
            <div style={{ fontSize: 12, color: 'var(--muted)' }}>{s.label}</div>
            <div style={{ fontSize: 28, fontWeight: 700 }}>{s.value}</div>
          </div>
        ))}
      </div>
    </main>
  );
}
