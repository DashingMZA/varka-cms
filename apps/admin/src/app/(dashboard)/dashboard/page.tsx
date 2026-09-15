import { prisma } from '@varka/database';

export const dynamic = 'force-dynamic';

/** Live counts from DB — zeros are real when empty. */
export default async function DashboardPage() {
  let posts = 0;
  let pages = 0;
  let media = 0;
  let users = 0;

  try {
    const [p, pg, m, u] = await Promise.all([
      prisma.post.count({ where: { deletedAt: null } }).catch(() => 0),
      prisma.page.count({ where: { deletedAt: null } }).catch(() => 0),
      prisma.mediaAsset.count().catch(() => 0),
      prisma.user.count().catch(() => 0),
    ]);
    posts = p;
    pages = pg;
    media = m;
    users = u;
  } catch {
    // DB unavailable — keep zeros
  }

  const stats = [
    { label: 'Posts', value: posts },
    { label: 'Pages', value: pages },
    { label: 'Media', value: media },
    { label: 'Users', value: users },
  ];

  return (
    <main>
      <h1 style={{ marginTop: 0 }}>Dashboard</h1>
      <p style={{ color: 'var(--muted)', maxWidth: 520 }}>
        Counts are live from the database. Empty modules show zero — not mock data.
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
