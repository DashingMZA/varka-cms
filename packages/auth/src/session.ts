import { prisma } from '@varka/database';
import type { AuthContext } from '@varka/permissions';

/**
 * Load user permission context from DB for server-side AuthZ.
 */
export async function loadAuthContext(userId: string): Promise<AuthContext | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      roles: {
        include: {
          role: {
            include: {
              permissions: { include: { permission: true } },
            },
          },
        },
      },
    },
  });
  if (!user) return null;

  const roleRows = user.roles as Array<{
    role: {
      slug: string;
      permissions: Array<{ permission: { key: string } }>;
    };
  }>;

  const roles: string[] = roleRows.map((ur) => ur.role.slug);

  const permissionKeys: string[] = [];
  for (const ur of roleRows) {
    for (const rp of ur.role.permissions) {
      permissionKeys.push(rp.permission.key);
    }
  }
  const permissions: string[] = [...new Set(permissionKeys)];

  return {
    userId: user.id as string,
    roles,
    permissions,
    disabled: Boolean(user.disabled),
  };
}
