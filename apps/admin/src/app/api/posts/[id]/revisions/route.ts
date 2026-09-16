import { NextResponse } from 'next/server';
import { listPostRevisions, restorePostRevision } from '@varka/content';

async function getCtx() {
  return {
    userId: 'dev-user',
    roles: ['owner'],
    permissions: ['posts.read', 'posts.update'],
  };
}

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await ctx.params;
    const { prisma } = await import('@varka/database');
    const auth = await getCtx();
    const result = await listPostRevisions(prisma as never, auth, id, 40);
    return NextResponse.json(result);
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Error';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function POST(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await ctx.params;
    const body = (await req.json()) as { revisionId?: string };
    if (!body.revisionId) {
      return NextResponse.json({ error: 'revisionId required' }, { status: 400 });
    }
    const { prisma } = await import('@varka/database');
    const auth = await getCtx();
    const post = await restorePostRevision(prisma as never, auth, id, body.revisionId);
    return NextResponse.json(post);
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Error';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
