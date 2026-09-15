import { NextResponse } from 'next/server';
import { setUserDisabled, revokeAllSessions } from '@varka/auth';
import { getAuthContext } from '@/lib/auth-context';

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = (await req.json()) as {
      disabled?: boolean;
      revokeSessions?: boolean;
    };
    const ctx = await getAuthContext(req);

    if (body.revokeSessions) {
      await revokeAllSessions(ctx, id);
      return NextResponse.json({ ok: true, revoked: true });
    }

    if (typeof body.disabled === 'boolean') {
      const user = await setUserDisabled(ctx, id, body.disabled);
      return NextResponse.json({ ok: true, user });
    }

    return NextResponse.json({ error: 'No action' }, { status: 400 });
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
