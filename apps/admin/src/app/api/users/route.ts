import { NextResponse } from 'next/server';
import { listUsers, createUser } from '@varka/auth';
import { getAuthContext } from '@/lib/auth-context';

export async function GET(req: Request) {
  try {
    const ctx = await getAuthContext(req);
    const url = new URL(req.url);
    const cursor = url.searchParams.get('cursor') ?? undefined;
    const limit = Number(url.searchParams.get('limit') ?? '20');
    const result = await listUsers(ctx, { cursor, limit });
    return NextResponse.json(result);
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Error';
    const status =
      message === 'Unauthorized' || message.includes('Unauthorized')
        ? 401
        : message.includes('Forbidden') || message.includes('permission')
          ? 403
          : 400;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function POST(req: Request) {
  try {
    const ctx = await getAuthContext(req);
    const body = (await req.json()) as {
      email?: string;
      name?: string;
      roleSlug?: string;
    };
    if (!body.email) {
      return NextResponse.json({ error: 'email required' }, { status: 400 });
    }
    const user = await createUser(ctx, {
      email: body.email,
      name: body.name,
      roleSlug: body.roleSlug,
    });
    return NextResponse.json({ user }, { status: 201 });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Error';
    const status =
      message === 'Unauthorized' || message.includes('Unauthorized')
        ? 401
        : message.includes('Forbidden') || message.includes('permission')
          ? 403
          : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
