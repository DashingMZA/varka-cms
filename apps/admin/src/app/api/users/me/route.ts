import { NextResponse } from 'next/server';
import {
  changeOwnPassword,
  getOwnProfile,
  updateOwnProfile,
} from '@varka/auth';
import { getAuthContext } from '@/lib/auth-context';

export async function GET(req: Request) {
  try {
    const ctx = await getAuthContext(req);
    if (!ctx.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const user = await getOwnProfile(ctx.userId);
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
    if (!ctx.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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
      await changeOwnPassword(ctx.userId, body.currentPassword, body.newPassword);
    }

    const user = await updateOwnProfile(ctx.userId, {
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
