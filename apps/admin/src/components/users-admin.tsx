'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { useMessages } from '@/lib/i18n';
import { Subsubsub } from '@/components/list-table/list-table';
import {
  listUsersAction,
  listRolesAction,
  updateUserAction,
} from '@/actions/users';

type Role = { slug: string; name: string };
type UserRow = {
  id: string;
  name: string;
  email: string;
  username?: string | null;
  nickname?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  image?: string | null;
  disabled?: boolean;
  postCount?: number;
  roles?: Array<{ role: { slug: string; name: string } }>;
};

export function UsersAdmin() {
  const { t } = useMessages();
  const [items, setItems] = useState<UserRow[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [q, setQ] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkAction, setBulkAction] = useState('');
  const [changeRole, setChangeRole] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [usersRes, rolesRes] = await Promise.all([
        listUsersAction({
          q: q.trim() || undefined,
          role: roleFilter !== 'all' ? roleFilter : undefined,
          limit: 100,
        }),
        listRolesAction(),
      ]);
      if (!usersRes.ok) {
        setError(usersRes.error);
        setLoading(false);
        return;
      }
      const data = usersRes.data as { items?: UserRow[]; users?: UserRow[] };
      setItems(data.items ?? data.users ?? (Array.isArray(usersRes.data) ? (usersRes.data as UserRow[]) : []));
      if (rolesRes.ok) {
        setRoles((rolesRes.data.roles as Role[]) ?? []);
      }
    } catch {
      setError(t('errors', 'networkError', 'Network error'));
    }
    setLoading(false);
  }, [q, roleFilter, t]);

  useEffect(() => {
    void load();
  }, [load]);

  async function toggleDisabled(user: UserRow) {
    const result = await updateUserAction(user.id, { disabled: !user.disabled });
    if (!result.ok) {
      setError(result.error);
      return;
    }
    await load();
  }

  async function applyBulk() {
    if (!bulkAction || selected.size === 0) return;
    if (bulkAction === 'delete') {
      if (!window.confirm(t('users', 'deleteConfirm', 'Delete selected users?'))) return;
    }
    setLoading(true);
    for (const id of selected) {
      if (bulkAction === 'disable') {
        await updateUserAction(id, { disabled: true });
      } else if (bulkAction === 'enable') {
        await updateUserAction(id, { disabled: false });
      }
    }
    setSelected(new Set());
    setBulkAction('');
    await load();
  }

  async function applyChangeRole() {
    if (!changeRole || selected.size === 0) return;
    setLoading(true);
    for (const id of selected) {
      await updateUserAction(id, { role: changeRole });
    }
    setSelected(new Set());
    setChangeRole('');
    await load();
  }

  const allSelected = items.length > 0 && selected.size === items.length;

  return (
    <div>
      <div className="v-page-header">
        <h1 className="v-page-title">{t('users', 'title', 'Users')}</h1>
        <Link href="/users/new" className="v-btn v-btn--primary">
          {t('users', 'addNew', 'Add New')}
        </Link>
      </div>

      {error ? (
        <p role="alert" className="v-alert v-alert--error">
          {error}
        </p>
      ) : null}

      <Subsubsub
        active={roleFilter}
        onChange={setRoleFilter}
        items={[
          { id: 'all', label: t('users', 'all', 'All') },
          ...roles.map((r) => ({ id: r.slug, label: r.name })),
        ]}
      />

      <div className="v-list-table-top">
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <select value={bulkAction} onChange={(e) => setBulkAction(e.target.value)}>
            <option value="">{t('common', 'bulkActions', 'Bulk actions')}</option>
            <option value="disable">{t('users', 'disable', 'Disable')}</option>
            <option value="enable">{t('users', 'enable', 'Enable')}</option>
          </select>
          <button type="button" className="v-btn" onClick={() => void applyBulk()} disabled={!bulkAction || selected.size === 0}>
            {t('common', 'apply', 'Apply')}
          </button>
          <select value={changeRole} onChange={(e) => setChangeRole(e.target.value)}>
            <option value="">{t('users', 'changeRoleTo', 'Change role to…')}</option>
            {roles.map((r) => (
              <option key={r.slug} value={r.slug}>
                {r.name}
              </option>
            ))}
          </select>
          <button type="button" className="v-btn" onClick={() => void applyChangeRole()} disabled={!changeRole || selected.size === 0}>
            {t('common', 'change', 'Change')}
          </button>
          <span className="v-muted" style={{ marginInlineStart: 'auto' }}>
            {items.length} {t('common', 'items', 'items')}
          </span>
        </div>
        <div className="v-search">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t('users', 'search', 'Search users…')}
            onKeyDown={(e) => {
              if (e.key === 'Enter') void load();
            }}
          />
          <button type="button" className="v-btn" onClick={() => void load()}>
            {t('common', 'search', 'Search')}
          </button>
          {loading ? <span className="v-muted">{t('common', 'loading', 'Loading…')}</span> : null}
        </div>
      </div>

            <div className="v-card" style={{ padding: 0, overflow: "hidden" }}>
  <table className="v-list-table">
          <thead>
            <tr>
              <th>
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelected(new Set(items.map((u) => u.id)));
                    } else {
                      setSelected(new Set());
                    }
                  }}
                />
              </th>
              <th>{t('users', 'username', 'Username')}</th>
              <th>{t('users', 'name', 'Name')}</th>
              <th>{t('users', 'email', 'Email')}</th>
              <th>{t('users', 'role', 'Role')}</th>
              <th>{t('users', 'posts', 'Posts')}</th>
            </tr>
          </thead>
          <tbody>
            {loading && items.length === 0 ? (
              <tr>
                <td colSpan={6} className="v-muted">
                  {t('common', 'loading', 'Loading…')}
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={6}>{t('users', 'noUsers', 'No users found.')}</td>
              </tr>
            ) : (
              items.map((u) => {
                const roleNames =
                  u.roles?.map((r) => r.role?.name || r.role?.slug).filter(Boolean).join(', ') ||
                  '—';
                const displayName = [u.firstName, u.lastName].filter(Boolean).join(' ') || u.name || '—';
                return (
                  <tr key={u.id}>
                    <td>
                      <input
                        type="checkbox"
                        checked={selected.has(u.id)}
                        onChange={(e) => {
                          const next = new Set(selected);
                          if (e.target.checked) next.add(u.id);
                          else next.delete(u.id);
                          setSelected(next);
                        }}
                      />
                    </td>
                    <td>
                      <strong style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        {u.image ? (
                          <img src={u.image} alt="" style={{ width: 32, height: 32, borderRadius: '50%' }} />
                        ) : (
                          <span
                            style={{
                              width: 32,
                              height: 32,
                              borderRadius: '50%',
                              background: '#0073aa',
                              color: '#fff',
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: 16,
                              fontWeight: 'bold',
                            }}
                          >
                            {(u.username || u.email || '?').charAt(0).toUpperCase()}
                          </span>
                        )}
                        <Link href={`/users/profile?id=${u.id}`} className="row-title">
                          {u.username || u.email}
                        </Link>
                      </strong>
                      <div className="row-actions">
                        <span>
                          <Link href={`/users/profile?id=${u.id}`}>{t('common', 'edit', 'Edit')}</Link>
                        </span>
                        {' | '}
                        <span>
                          <a
                            href="#"
                            className={u.disabled ? '' : 'trash'}
                            onClick={(e) => {
                              e.preventDefault();
                              void toggleDisabled(u);
                            }}
                          >
                            {u.disabled ? t('users', 'enable', 'Enable') : t('users', 'disable', 'Disable')}
                          </a>
                        </span>
                      </div>
                    </td>
                    <td>{displayName}</td>
                    <td>
                      <a href={`mailto:${u.email}`}>{u.email}</a>
                    </td>
                    <td>{roleNames}</td>
                    <td>
                      {u.postCount ? (
                        <Link href={`/content/posts?author=${u.id}`}>{u.postCount}</Link>
                      ) : (
                        '0'
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
        </div>

        {items.length > 0 ? (
          <div className="v-list-table-bottom" style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            <select value={bulkAction} onChange={(e) => setBulkAction(e.target.value)}>
              <option value="">{t('common', 'bulkActions', 'Bulk actions')}</option>
              <option value="disable">{t('users', 'disable', 'Disable')}</option>
              <option value="enable">{t('users', 'enable', 'Enable')}</option>
            </select>
            <button type="button" className="v-btn" onClick={() => void applyBulk()} disabled={!bulkAction || selected.size === 0}>
              {t('common', 'apply', 'Apply')}
            </button>
          </div>
        ) : null}
      </div>
    );
  }
