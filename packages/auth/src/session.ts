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

  const roles: string[] = user.roles.map(
    (ur: { role: { slug: string } }) => ur.role.slug,
  );
  const permissions: string[] = [
    ...new Set(
      user.roles.flatMap((ur: { role: { permissions: { permission: { key: string } }[] } }) =>
        ur.role.permissions.map((rp: { permission: { key: string } }) => rp.permission.key),
      ),
    ),
  ];

  return {
    userId: user.id,
    roles,
    permissions,
    disabled: user.disabled,
  };
}
