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
  nickname?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  disabled?: boolean;
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
      setError(t('errors', 'networkError'));
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

  return (
    <div>
      <div className="v-page-header">
        <h1 className="v-page-title">{t('users', 'title') || 'Users'}</h1>
        <Link href="/users/new" className="v-btn v-btn--primary">
          {t('users', 'addNew') || 'Add New'}
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
          { id: 'all', label: t('users', 'all') || 'All' },
          ...roles.map((r) => ({ id: r.slug, label: r.name })),
        ]}
      />

      <div className="v-list-table-top">
        <div className="v-search">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t('users', 'search') || 'Search users…'}
            onKeyDown={(e) => {
              if (e.key === 'Enter') void load();
            }}
          />
          <button type="button" className="v-btn" onClick={() => void load()}>
            {t('common', 'search') || 'Search'}
          </button>
          {loading ? <span className="v-muted">{t('common', 'loading')}</span> : null}
        </div>
      </div>

      <table className="v-list-table">
        <thead>
          <tr>
            <th>{t('users', 'name') || 'Name'}</th>
            <th>{t('users', 'email') || 'Email'}</th>
            <th>{t('users', 'role') || 'Role'}</th>
            <th>{t('users', 'status') || 'Status'}</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {loading && items.length === 0 ? (
            <tr>
              <td colSpan={5} className="v-muted">
                {t('common', 'loading')}
              </td>
            </tr>
          ) : items.length === 0 ? (
            <tr>
              <td colSpan={5}>{t('users', 'noUsers') || 'No users found.'}</td>
            </tr>
          ) : (
            items.map((u) => {
              const roleNames =
                u.roles?.map((r) => r.role?.name || r.role?.slug).filter(Boolean).join(', ') ||
                '—';
              return (
                <tr key={u.id}>
                  <td>
                    <strong>{u.name || u.nickname || u.email}</strong>
                    <div className="row-actions">
                      <Link href={`/users/profile?id=${u.id}`}>{t('common', 'edit') || 'Edit'}</Link>
                    </div>
                  </td>
                  <td>{u.email}</td>
                  <td>{roleNames}</td>
                  <td>{u.disabled ? (t('users', 'disabled') || 'Disabled') : (t('users', 'active') || 'Active')}</td>
                  <td>
                    <button type="button" className="v-btn" onClick={() => void toggleDisabled(u)}>
                      {u.disabled
                        ? t('users', 'enable') || 'Enable'
                        : t('users', 'disable') || 'Disable'}
                    </button>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
