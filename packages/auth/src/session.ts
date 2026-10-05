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
  if (user.disabled) return null;

  // prisma client is loosely typed (`any`); annotate shapes explicitly.
  type RoleWithPermissions = {
    role: {
      slug: string;
      permissions: { permission: { key: string } }[];
    };
  };
  const roles = user.roles.map((ur: RoleWithPermissions) => ur.role.slug);
  const permissionKeys: string[] = user.roles.flatMap((ur: RoleWithPermissions) =>
    ur.role.permissions.map((rp: { permission: { key: string } }) => rp.permission.key),
  );
  const permissions: string[] = [...new Set(permissionKeys)];

  return {
    userId: user.id,
    roles,
    permissions,
    disabled: user.disabled,
  };
}
