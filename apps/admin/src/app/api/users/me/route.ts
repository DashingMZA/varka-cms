import { NextResponse } from 'next/server';
import {
  changeOwnPassword,
  getOwnProfile,
  updateOwnProfile,
} from '@varka/auth';
import { getAuthContext } from '@/lib/auth-context';

async function resolveProfileUserId(ctxUserId: string): Promise<string | null> {
  if (ctxUserId && ctxUserId !== 'dev-user') {
    const u = await getOwnProfile(ctxUserId);
    if (u) return ctxUserId;
  }
  try {
    const { prisma } = await import('@varka/database');
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
  } catch {
    return null;
  }
}

export async function GET(req: Request) {
  try {
    const ctx = await getAuthContext(req);
    if (!ctx.userId && ctx.disabled) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userId = await resolveProfileUserId(ctx.userId);
    if (!userId) {
      return NextResponse.json(
        { error: 'No users in database — run pnpm db:seed' },
        { status: 404 },
      );
    }
    const user = await getOwnProfile(userId);
    if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(user);
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Error';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function PATCH(req: Request) {
  try {
    const ctx = await getAuthContext(req);
    if (!ctx.userId && ctx.disabled) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userId = await resolveProfileUserId(ctx.userId);
    if (!userId) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    const body = (await req.json()) as {
      firstName?: string;
      lastName?: string;
      nickname?: string;
      website?: string;
      bio?: string;
      email?: string;
      adminColorScheme?: string;
      name?: string;
      newPassword?: string;
      currentPassword?: string;
    };

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
      adminColorScheme: body.adminColorScheme,
      name: body.name,
    });
    return NextResponse.json(user);
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Error';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
