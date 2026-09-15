import { prisma } from '@varka/database';
import { requirePermission, type AuthContext } from '@varka/permissions';

export async function listUsers(ctx: AuthContext, opts: { cursor?: string; limit?: number } = {}) {
  requirePermission(ctx, 'users.read');
  const limit = Math.min(opts.limit ?? 20, 100);
  const users = await prisma.user.findMany({
    take: limit + 1,
    ...(opts.cursor ? { cursor: { id: opts.cursor }, skip: 1 } : {}),
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      name: true,
      email: true,
      disabled: true,
      emailVerified: true,
      createdAt: true,
      roles: { include: { role: { select: { slug: true, name: true } } } },
    },
  });
  const hasMore = users.length > limit;
  const items = hasMore ? users.slice(0, limit) : users;
  return {
    items,
    nextCursor: hasMore ? items[items.length - 1]?.id ?? null : null,
    hasMore,
  };
}

/** Create user row + optional role. Password via Better Auth sign-up / reset. */
export async function createUser(
  ctx: AuthContext,
  input: { email: string; name?: string; roleSlug?: string },
) {
  requirePermission(ctx, 'users.create');
  const email = input.email.trim().toLowerCase();
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) throw new Error('User already exists');

  const name = (input.name?.trim() || email.split('@')[0] || 'User').slice(0, 120);

  const user = await prisma.user.create({
    data: {
      email,
      name,
      emailVerified: false,
    },
  });

  if (input.roleSlug) {
    const role = await prisma.role.findUnique({ where: { slug: input.roleSlug } });
    if (role) {
      await prisma.userRole.create({
        data: { userId: user.id, roleId: role.id },
      });
    }
  }

  return user;
}

export async function setUserDisabled(ctx: AuthContext, userId: string, disabled: boolean) {
  requirePermission(ctx, 'users.disable');
  if (ctx.userId === userId) {
    throw new Error('Cannot disable yourself');
  }
  return prisma.user.update({
    where: { id: userId },
    data: { disabled },
  });
}

export async function revokeAllSessions(ctx: AuthContext, userId: string) {
  requirePermission(ctx, 'users.update');
  return prisma.session.deleteMany({ where: { userId } });
}
