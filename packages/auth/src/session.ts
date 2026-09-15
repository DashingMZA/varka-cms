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

  const roles = user.roles.map((ur) => ur.role.slug);
  const permissions = [
    ...new Set(
      user.roles.flatMap((ur) => ur.role.permissions.map((rp) => rp.permission.key)),
    ),
  ];

  return {
    userId: user.id,
    roles,
    permissions,
    disabled: user.disabled,
  };
}
