'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';

type Role = { slug: string; name: string };
type UserRow = {
  id: string;
  name: string;
  email: string;
  nickname?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  disabled: boolean;
  roles: { role: Role }[];
  _count?: { posts: number };
};

export function UsersAdmin() {
  const [items, setItems] = useState<UserRow[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [q, setQ] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkRole, setBulkRole] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ limit: '100' });
      if (q.trim()) params.set('q', q.trim());
      if (roleFilter) params.set('role', roleFilter);
      const [usersRes, rolesRes] = await Promise.all([
        fetch(`/api/users?${params}`, { credentials: 'include' }),
        fetch('/api/users?roles=1', { credentials: 'include' }),
      ]);
      if (!usersRes.ok) throw new Error((await usersRes.json()).error ?? 'Failed to load users');
      const data = (await usersRes.json()) as { items: UserRow[] };
      setItems(data.items ?? []);
      if (rolesRes.ok) {
        const rd = (await rolesRes.json()) as { roles: Role[] };
        setRoles(rd.roles ?? []);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Load error');
    } finally {
      setLoading(false);
    }
  }, [q, roleFilter]);

  useEffect(() => {
    void load();
  }, [load]);

  const roleCounts = useMemo(() => {
    const m = new Map<string, number>();
    for (const u of items) {
      for (const r of u.roles) {
        m.set(r.role.slug, (m.get(r.role.slug) ?? 0) + 1);
      }
    }
    return m;
  }, [items]);

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    if (selected.size === items.length) setSelected(new Set());
    else setSelected(new Set(items.map((u) => u.id)));
  }

  async function applyBulkRole() {
    if (!bulkRole || selected.size === 0) return;
    setMessage(null);
    try {
      await Promise.all(
        [...selected].map((id) =>
          fetch(`/api/users/${id}`, {
            method: 'PATCH',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ roleSlug: bulkRole }),
          }),
        ),
      );
      setSelected(new Set());
      setMessage('Roles updated.');
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Bulk update failed');
    }
  }

  return (
    <div>
      <div className="v-page-header">
        <h1 className="v-page-title">Users</h1>
        <Link href="/users/new" className="v-btn v-btn--primary">
          Add User
        </Link>
      </div>

      <ul className="v-subsub">
        <li>
          <button
            type="button"
            className={!roleFilter ? 'is-current' : ''}
            onClick={() => setRoleFilter('')}
            style={{ background: 'none', border: 'none', color: 'inherit', padding: 0 }}
          >
            All <span className="count">({items.length})</span>
          </button>
        </li>
        {roles.map((r) => (
          <li key={r.slug}>
            <button
              type="button"
              className={roleFilter === r.slug ? 'is-current' : ''}
              onClick={() => setRoleFilter(r.slug)}
              style={{ background: 'none', border: 'none', color: 'inherit', padding: 0 }}
            >
              {r.name} <span className="count">({roleCounts.get(r.slug) ?? 0})</span>
            </button>
          </li>
        ))}
      </ul>

      <div className="v-tablenav">
        <select
          value={bulkRole}
          onChange={(e) => setBulkRole(e.target.value)}
          aria-label="Change role to"
        >
          <option value="">Change role to…</option>
          {roles.map((r) => (
            <option key={r.slug} value={r.slug}>
              {r.name}
            </option>
          ))}
        </select>
        <button type="button" className="v-btn" onClick={() => void applyBulkRole()}>
          Change
        </button>
        <input
          type="search"
          placeholder="Search users…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <button type="button" className="v-btn" onClick={() => void load()}>
          Search Users
        </button>
      </div>

      {error ? <p className="v-alert v-alert--error">{error}</p> : null}
      {message ? <p className="v-alert v-alert--ok">{message}</p> : null}
      {loading ? <p className="v-muted">Loading…</p> : null}

      <div className="v-table-wrap">
        <table className="v-table">
          <thead>
            <tr>
              <th className="check-col">
                <input
                  type="checkbox"
                  checked={items.length > 0 && selected.size === items.length}
                  onChange={toggleAll}
                  aria-label="Select all"
                />
              </th>
              <th>Username</th>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Posts</th>
            </tr>
          </thead>
          <tbody>
            {items.map((u) => {
              const username = u.nickname || u.email.split('@')[0];
              const roleLabel = u.roles.map((r) => r.role.name).join(', ') || '—';
              return (
                <tr key={u.id}>
                  <td className="check-col">
                    <input
                      type="checkbox"
                      checked={selected.has(u.id)}
                      onChange={() => toggle(u.id)}
                      aria-label={`Select ${username}`}
                    />
                  </td>
                  <td>
                    <span className="row-title">{username}</span>
                    {u.disabled ? (
                      <span className="v-status" style={{ marginLeft: 6 }}>
                        Disabled
                      </span>
                    ) : null}
                    <div className="row-actions">
                      <Link href="/users/profile">Edit profile</Link>
                    </div>
                  </td>
                  <td>{u.name || '—'}</td>
                  <td>
                    <a href={`mailto:${u.email}`}>{u.email}</a>
                  </td>
                  <td>{roleLabel}</td>
                  <td>{u._count?.posts ?? 0}</td>
                </tr>
              );
            })}
            {!loading && items.length === 0 ? (
              <tr>
                <td colSpan={6} className="v-muted">
                  No users found.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
      <p className="v-muted" style={{ marginTop: 8 }}>
        {items.length} item{items.length === 1 ? '' : 's'}
      </p>
    </div>
  );
}
