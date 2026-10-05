'use server';

import {
  createUser,
  listRoles,
  listUsers,
  getOwnProfile,
  updateOwnProfile,
  changeOwnPassword,
} from '@varka/auth';
import { prisma, requireServerAuth, getServerAuth } from '@/lib/server-db';
import { revalidatePath } from 'next/cache';

import type { ActionResult } from './posts';

function fail(e: unknown): ActionResult<never> {
  return { ok: false, error: e instanceof Error ? e.message : 'Error' };
}

export async function listUsersAction(opts?: {
  q?: string;
  role?: string;
  limit?: number;
  cursor?: string;
}): Promise<ActionResult<unknown>> {
  try {
    const { ctx } = await requireServerAuth('users.read');
    const result = await listUsers(ctx, {
      q: opts?.q,
      role: opts?.role,
      limit: opts?.limit ?? 50,
      cursor: opts?.cursor,
    });
    return { ok: true, data: JSON.parse(JSON.stringify(result)) };
  } catch (e) {
    return fail(e);
  }
}

export async function listRolesAction(): Promise<ActionResult<{ roles: unknown[] }>> {
  try {
    const { ctx } = await requireServerAuth('users.read');
    const roles = await listRoles(ctx);
    return { ok: true, data: { roles: JSON.parse(JSON.stringify(roles)) } };
  } catch (e) {
    return fail(e);
  }
}

export async function createUserAction(input: {
  username: string;
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  website?: string;
  roleSlug?: string;
  sendNotification?: boolean;
}): Promise<ActionResult<unknown>> {
  try {
    const { ctx } = await requireServerAuth('users.create');
    if (!input.username || !input.email || !input.password) {
      return { ok: false, error: 'username, email, and password are required' };
    }
    const user = await createUser(ctx, input);
    revalidatePath('/users');
    return { ok: true, data: JSON.parse(JSON.stringify(user)) };
  } catch (e) {
    return fail(e);
  }
}

export async function updateUserAction(
  id: string,
  body: Record<string, unknown>,
): Promise<ActionResult<unknown>> {
  try {
    await requireServerAuth('users.manage');
    const data: Record<string, unknown> = {};
    if (typeof body.name === 'string') data.name = body.name;
    if (typeof body.email === 'string') data.email = body.email;
    if (typeof body.disabled === 'boolean') data.disabled = body.disabled;
    if (typeof body.firstName === 'string') data.firstName = body.firstName;
    if (typeof body.lastName === 'string') data.lastName = body.lastName;
    if (typeof body.nickname === 'string') data.nickname = body.nickname;

    const user = await prisma.user.update({
      where: { id },
      data: data as never,
      include: { roles: { include: { role: true } } },
    });

    if (typeof body.roleSlug === 'string' && body.roleSlug) {
      const role = await prisma.role.findFirst({ where: { slug: body.roleSlug } });
      if (role) {
        await prisma.userRole.deleteMany({ where: { userId: id } });
        await prisma.userRole.create({ data: { userId: id, roleId: role.id } });
      }
    }

    revalidatePath('/users');
    return { ok: true, data: JSON.parse(JSON.stringify(user)) };
  } catch (e) {
    return fail(e);
  }
}

async function resolveProfileUserId(ctxUserId: string): Promise<string | null> {
  if (ctxUserId && ctxUserId !== 'dev-user') {
    const u = await getOwnProfile(ctxUserId);
    if (u) return ctxUserId;
  }
  const owner = await prisma.user.findFirst({
    where: {
      roles: { some: { role: { slug: { in: ['owner', 'admin', 'administrator'] } } } },
    },
    orderBy: { createdAt: 'asc' },
    select: { id: true },
  });
  if (owner?.id) return owner.id;
  const any = await prisma.user.findFirst({
    orderBy: { createdAt: 'asc' },
    select: { id: true },
  });
  return any?.id ?? null;
}

export async function getMyProfileAction(): Promise<ActionResult<unknown>> {
  try {
    const ctx = await getServerAuth();
    const userId = await resolveProfileUserId(ctx.userId);
    if (!userId) return { ok: false, error: 'No users — run seed' };
    const user = await getOwnProfile(userId);
    if (!user) return { ok: false, error: 'Not found' };
    return { ok: true, data: JSON.parse(JSON.stringify(user)) };
  } catch (e) {
    return fail(e);
  }
}

export async function updateMyProfileAction(body: {
  firstName?: string;
  lastName?: string;
  nickname?: string;
  website?: string;
  bio?: string;
  email?: string;
  name?: string;
  newPassword?: string;
  currentPassword?: string;
}): Promise<ActionResult<unknown>> {
  try {
    const ctx = await getServerAuth();
    const userId = await resolveProfileUserId(ctx.userId);
    if (!userId) return { ok: false, error: 'Not found' };

    if (body.newPassword) {
      await changeOwnPassword(userId, body.currentPassword, body.newPassword);
    }

    const user = await updateOwnProfile(userId, {
      firstName: body.firstName,
      lastName: body.lastName,
      nickname: body.nickname,
      website: body.website,
      bio: body.bio,
      email: body.email,
      name: body.name,
    });
    revalidatePath('/users');
    return { ok: true, data: JSON.parse(JSON.stringify(user)) };
  } catch (e) {
    return fail(e);
  }
}
