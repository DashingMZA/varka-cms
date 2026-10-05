import { prisma } from '@varka/database';
import { requirePermission, type AuthContext } from '@varka/permissions';
import { assertPasswordPolicy, hashPassword } from './password';

const ADMIN_SCHEMES = new Set([
  'default',
  'light',
  'blue',
  'coffee',
  'ectoplasm',
  'midnight',
  'ocean',
  'sunrise',
]);

export const WP_ROLE_SLUGS = [
  'owner',
  'admin',
  'editor',
  'author',
  'contributor',
  'reader',
] as const;

export type ListUsersOpts = {
  cursor?: string;
  limit?: number;
  q?: string;
  role?: string;
};

export async function listUsers(ctx: AuthContext, opts: ListUsersOpts = {}) {
  requirePermission(ctx, 'users.read');
  const limit = Math.min(opts.limit ?? 50, 100);
  const where: Record<string, unknown> = {};
  if (opts.q?.trim()) {
    const q = opts.q.trim();
    where.OR = [
      { email: { contains: q, mode: 'insensitive' } },
      { name: { contains: q, mode: 'insensitive' } },
      { nickname: { contains: q, mode: 'insensitive' } },
    ];
  }
  if (opts.role) {
    where.roles = { some: { role: { slug: opts.role } } };
  }

  const users = await prisma.user.findMany({
    where,
    take: limit + 1,
    ...(opts.cursor ? { cursor: { id: opts.cursor }, skip: 1 } : {}),
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      name: true,
      email: true,
      nickname: true,
      firstName: true,
      lastName: true,
      image: true,
      disabled: true,
      emailVerified: true,
      adminColorScheme: true,
      createdAt: true,
      roles: { include: { role: { select: { slug: true, name: true } } } },
      _count: { select: { posts: true } },
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

export async function listRoles(ctx: AuthContext) {
  requirePermission(ctx, 'users.read');
  return prisma.role.findMany({
    orderBy: { name: 'asc' },
    select: { id: true, slug: true, name: true, description: true },
  });
}

export type CreateUserInput = {
  username: string;
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  website?: string;
  roleSlug?: string;
  sendNotification?: boolean;
};

export async function createUser(ctx: AuthContext, input: CreateUserInput) {
  requirePermission(ctx, 'users.create');
  const email = input.email.trim().toLowerCase();
  const username = input.username.trim();
  if (!username || username.length < 2) throw new Error('Username required');
  if (!email.includes('@')) throw new Error('Valid email required');
  assertPasswordPolicy(input.password);

  const existing = await prisma.user.findFirst({
    where: { OR: [{ email }, { nickname: username }, { name: username }] },
  });
  if (existing) throw new Error('User with this email or username already exists');

  const roleSlug = input.roleSlug || 'reader';
  const role = await prisma.role.findUnique({ where: { slug: roleSlug } });
  if (!role) throw new Error(`Role not found: ${roleSlug}`);

  const passwordHash = await hashPassword(input.password);
  const displayName =
    [input.firstName, input.lastName].filter(Boolean).join(' ').trim() || username;

  const user = await prisma.user.create({
    data: {
      name: displayName,
      email,
      nickname: username,
      firstName: input.firstName?.trim() || null,
      lastName: input.lastName?.trim() || null,
      website: input.website?.trim() || null,
      emailVerified: false,
      adminColorScheme: 'default',
      roles: { create: { roleId: role.id } },
      accounts: {
        create: {
          accountId: email,
          providerId: 'credential',
          password: passwordHash,
        },
      },
    },
    select: {
      id: true,
      name: true,
      email: true,
      nickname: true,
      roles: { include: { role: { select: { slug: true, name: true } } } },
    },
  });

  void input.sendNotification;
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

export async function setUserRole(ctx: AuthContext, userId: string, roleSlug: string) {
  requirePermission(ctx, 'users.update');
  const role = await prisma.role.findUnique({ where: { slug: roleSlug } });
  if (!role) throw new Error('Role not found');
  await prisma.userRole.deleteMany({ where: { userId } });
  await prisma.userRole.create({ data: { userId, roleId: role.id } });
  return prisma.user.findUniqueOrThrow({
    where: { id: userId },
    select: {
      id: true,
      roles: { include: { role: { select: { slug: true, name: true } } } },
    },
  });
}

export async function revokeAllSessions(ctx: AuthContext, userId: string) {
  requirePermission(ctx, 'users.update');
  return prisma.session.deleteMany({ where: { userId } });
}

export type ProfileUpdate = {
  firstName?: string;
  lastName?: string;
  nickname?: string;
  website?: string;
  bio?: string;
  email?: string;
  adminColorScheme?: string;
  name?: string;
};

export async function updateOwnProfile(userId: string, data: ProfileUpdate) {
  const patch: Record<string, unknown> = {};
  if (data.firstName !== undefined) patch.firstName = data.firstName.trim() || null;
  if (data.lastName !== undefined) patch.lastName = data.lastName.trim() || null;
  if (data.nickname !== undefined) {
    const n = data.nickname.trim();
    if (!n) throw new Error('Nickname required');
    patch.nickname = n;
  }
  if (data.website !== undefined) patch.website = data.website.trim() || null;
  if (data.bio !== undefined) patch.bio = data.bio.trim() || null;
  if (data.name !== undefined) patch.name = data.name.trim() || undefined;
  if (data.email !== undefined) {
    const email = data.email.trim().toLowerCase();
    if (!email.includes('@')) throw new Error('Valid email required');
    patch.email = email;
  }
  if (data.adminColorScheme !== undefined) {
    if (!ADMIN_SCHEMES.has(data.adminColorScheme)) {
      throw new Error('Invalid admin color scheme');
    }
    patch.adminColorScheme = data.adminColorScheme;
  }

  if (data.firstName !== undefined || data.lastName !== undefined) {
    const current = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
    const fn = (data.firstName !== undefined ? data.firstName : current.firstName) || '';
    const ln = (data.lastName !== undefined ? data.lastName : current.lastName) || '';
    const combined = `${fn} ${ln}`.trim();
    if (combined) patch.name = combined;
  }

  return prisma.user.update({
    where: { id: userId },
    data: patch,
    select: {
      id: true,
      name: true,
      email: true,
      firstName: true,
      lastName: true,
      nickname: true,
      website: true,
      bio: true,
      adminColorScheme: true,
      image: true,
      roles: { include: { role: { select: { slug: true, name: true } } } },
    },
  });
}

export async function getUserById(ctx: AuthContext, userId: string) {
  requirePermission(ctx, 'users.read');
  return prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      firstName: true,
      lastName: true,
      nickname: true,
      website: true,
      bio: true,
      image: true,
      disabled: true,
      adminColorScheme: true,
      createdAt: true,
      roles: { include: { role: { select: { slug: true, name: true } } } },
      _count: { select: { posts: true } },
    },
  });
}

export async function getOwnProfile(userId: string) {
  return prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      firstName: true,
      lastName: true,
      nickname: true,
      website: true,
      bio: true,
      image: true,
      adminColorScheme: true,
      roles: { include: { role: { select: { slug: true, name: true } } } },
    },
  });
}

export async function changeOwnPassword(
  userId: string,
  currentPassword: string | undefined,
  newPassword: string,
) {
  assertPasswordPolicy(newPassword);
  const account = await prisma.account.findFirst({
    where: { userId, providerId: 'credential' },
  });
  if (account?.password && currentPassword) {
    const { verifyPassword } = await import('./password');
    const ok = await verifyPassword({ password: currentPassword, hash: account.password });
    if (!ok) throw new Error('Current password is incorrect');
  }
  const passwordHash = await hashPassword(newPassword);
  if (account) {
    await prisma.account.update({
      where: { id: account.id },
      data: { password: passwordHash },
    });
  } else {
    const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
    await prisma.account.create({
      data: {
        userId,
        accountId: user.email,
        providerId: 'credential',
        password: passwordHash,
      },
    });
  }
  return { ok: true };
}
