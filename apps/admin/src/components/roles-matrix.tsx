'use client';

import { ROLES, PERMISSIONS, type Role, type Permission } from '@varka/permissions';

const ROLE_PERMS: Record<Role, Permission[]> = {
  owner: [...PERMISSIONS],
  admin: [...PERMISSIONS].filter((p) => !p.startsWith('security.manage')),
  editor: PERMISSIONS.filter(
    (p) =>
      p.startsWith('posts.') ||
      p.startsWith('pages.') ||
      p.startsWith('media.') ||
      p.startsWith('comments.') ||
      p === 'seo.read' ||
      p === 'seo.update',
  ) as Permission[],
  author: [
    'posts.read',
    'posts.create',
    'posts.update',
    'media.read',
    'media.upload',
    'comments.read',
  ],
  contributor: ['posts.read', 'posts.create', 'media.read', 'media.upload'],
  seo_manager: ['posts.read', 'pages.read', 'seo.read', 'seo.update', 'media.read'],
  translator: ['posts.read', 'posts.update', 'pages.read', 'pages.update', 'languages.read'],
  reader: ['posts.read', 'pages.read', 'media.read'],
};

export function RolesMatrix() {
  return (
    <div className="v-table-wrap" style={{ marginTop: 12 }}>
      <p className="v-muted" style={{ fontSize: 13 }}>
        Capability matrix from <code>@varka/permissions</code>. Owner holds all capabilities.
      </p>
      <table className="v-table" style={{ fontSize: 12 }}>
        <thead>
          <tr>
            <th>Permission</th>
            {ROLES.map((r) => (
              <th key={r} style={{ textTransform: 'capitalize' }}>
                {r.replace('_', ' ')}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {PERMISSIONS.map((perm) => (
            <tr key={perm}>
              <td>
                <code>{perm}</code>
              </td>
              {ROLES.map((role) => {
                const ok = ROLE_PERMS[role]?.includes(perm);
                return (
                  <td key={role} style={{ textAlign: 'center' }}>
                    {ok ? '✓' : '—'}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
