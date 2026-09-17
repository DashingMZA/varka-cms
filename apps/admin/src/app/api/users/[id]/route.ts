import { NextResponse } from 'next/server';
import { getUserById, setUserDisabled, setUserRole } from '@varka/auth';
import { getAuthContext } from '@/lib/auth-context';

function statusFor(message: string): number {
  if (message.includes('Unauthorized')) return 401;
  if (message.includes('Forbidden') || message.includes('permission')) return 403;
  return 400;
}

type Ctx = { params: Promise<{ id: string }> };

export async function GET(req: Request, context: Ctx) {
  try {
    const { id } = await context.params;
    const auth = await getAuthContext(req);
    const user = await getUserById(auth, id);
    if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(user);
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Error';
    return NextResponse.json({ error: message }, { status: statusFor(message) });
  }
}

export async function PATCH(req: Request, context: Ctx) {
  try {
    const { id } = await context.params;
    const auth = await getAuthContext(req);
    const body = (await req.json()) as {
      disabled?: boolean;
      roleSlug?: string;
    };
    if (typeof body.disabled === 'boolean') {
      await setUserDisabled(auth, id, body.disabled);
    }
    if (body.roleSlug) {
      await setUserRole(auth, id, body.roleSlug);
    }
    const user = await getUserById(auth, id);
    return NextResponse.json(user);
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Error';
    return NextResponse.json({ error: message }, { status: statusFor(message) });
  }
}
