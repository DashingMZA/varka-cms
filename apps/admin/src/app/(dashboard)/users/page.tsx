import { headers } from 'next/headers';
import { listUsers } from '@varka/auth';
import { getAuthContext } from '@/lib/auth-context';

export const dynamic = 'force-dynamic';

export default async function UsersPage() {
  const h = await headers();
  const req = new Request('http://local/api/users', { headers: h });
  let items: Array<{
    id: string;
    name: string | null;
    email: string;
    disabled: boolean;
    roles: Array<{ role: { slug: string; name: string } }>;
  }> = [];
  let error: string | null = null;

  try {
    const ctx = await getAuthContext(req);
    const result = await listUsers(ctx, { limit: 50 });
    items = result.items as typeof items;
  } catch (e) {
    error = e instanceof Error ? e.message : 'Failed to load users';
  }

  return (
    <div>
      <h1 style={{ marginTop: 0 }}>Users</h1>
      <p style={{ color: 'var(--muted)', fontSize: 14 }}>
        RBAC-backed list. Disable / session revoke via API.
      </p>
      {error ? (
        <p role="alert" style={{ color: 'var(--danger)' }}>
          {error}
        </p>
      ) : null}
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
        <thead>
          <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--border)' }}>
            <th style={{ padding: '8px 4px' }}>Name</th>
            <th style={{ padding: '8px 4px' }}>Email</th>
            <th style={{ padding: '8px 4px' }}>Roles</th>
            <th style={{ padding: '8px 4px' }}>Status</th>
          </tr>
        </thead>
        <tbody>
          {items.map((u) => (
            <tr key={u.id} style={{ borderBottom: '1px solid var(--border)' }}>
              <td style={{ padding: '8px 4px' }}>{u.name ?? '—'}</td>
              <td style={{ padding: '8px 4px' }}>{u.email}</td>
              <td style={{ padding: '8px 4px' }}>
                {u.roles.map((r) => r.role.slug).join(', ') || '—'}
              </td>
              <td style={{ padding: '8px 4px' }}>{u.disabled ? 'disabled' : 'active'}</td>
            </tr>
          ))}
          {!items.length && !error ? (
            <tr>
              <td colSpan={4} style={{ padding: 12, color: 'var(--muted)' }}>
                No users yet — run seed.
              </td>
            </tr>
          ) : null}
        </tbody>
      </table>
    </div>
  );
}
