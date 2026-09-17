import { NextResponse } from 'next/server';
import { createUser, listRoles, listUsers } from '@varka/auth';
import { getAuthContext } from '@/lib/auth-context';

function statusFor(message: string): number {
  if (message.includes('Unauthorized') || message === 'Unauthorized') return 401;
  if (message.includes('Forbidden') || message.includes('permission')) return 403;
  return 400;
}

export async function GET(req: Request) {
  try {
    const ctx = await getAuthContext(req);
    const url = new URL(req.url);
    const q = url.searchParams.get('q') ?? undefined;
    const role = url.searchParams.get('role') ?? undefined;
    const limit = Number(url.searchParams.get('limit') ?? 50);
    const cursor = url.searchParams.get('cursor') ?? undefined;
    if (url.searchParams.get('roles') === '1') {
      const roles = await listRoles(ctx);
      return NextResponse.json({ roles });
    }
    const result = await listUsers(ctx, { q, role, limit, cursor });
    return NextResponse.json(result);
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Error';
    return NextResponse.json({ error: message }, { status: statusFor(message) });
  }
}

export async function POST(req: Request) {
  try {
    const ctx = await getAuthContext(req);
    const body = (await req.json()) as {
      username?: string;
      email?: string;
      password?: string;
      firstName?: string;
      lastName?: string;
      website?: string;
      roleSlug?: string;
      sendNotification?: boolean;
    };
    if (!body.username || !body.email || !body.password) {
      return NextResponse.json(
        { error: 'username, email, and password are required' },
        { status: 400 },
      );
    }
    const user = await createUser(ctx, {
      username: body.username,
      email: body.email,
      password: body.password,
      firstName: body.firstName,
      lastName: body.lastName,
      website: body.website,
      roleSlug: body.roleSlug,
      sendNotification: body.sendNotification,
    });
    return NextResponse.json(user, { status: 201 });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Error';
    return NextResponse.json({ error: message }, { status: statusFor(message) });
  }
}
