import { NextResponse } from 'next/server';
import {
  ForbiddenError,
  UnauthorizedError,
  requirePermission,
  type Permission,
} from '@varka/permissions';
import { getAuthContext } from '@/lib/auth-context';

export async function guard(
  req: Request,
  permission: Permission,
): Promise<{ ctx: Awaited<ReturnType<typeof getAuthContext>> } | NextResponse> {
  const ctx = await getAuthContext(req);
  try {
    requirePermission(ctx, permission);
    return { ctx };
  } catch (e) {
    if (e instanceof UnauthorizedError) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (e instanceof ForbiddenError) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
}
