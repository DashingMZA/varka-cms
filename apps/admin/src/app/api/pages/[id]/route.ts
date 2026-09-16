import { NextResponse } from 'next/server';
import { getPage, updatePage, trashPage } from '@varka/content';

async function getCtx() {
  return {
    userId: 'dev-user',
    roles: ['owner'],
    permissions: ['pages.read', 'pages.update', 'pages.delete'],
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
    const page = await getPage(prisma as never, auth, id);
    return NextResponse.json(page);
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Error';
    return NextResponse.json({ error: message }, { status: 404 });
  }
}

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await ctx.params;
    const { prisma } = await import('@varka/database');
    const auth = await getCtx();
    const body = await req.json();
    const page = await updatePage(prisma as never, auth, id, body);
    return NextResponse.json(page);
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Error';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await ctx.params;
    const { prisma } = await import('@varka/database');
    const auth = await getCtx();
    const page = await trashPage(prisma as never, auth, id);
    return NextResponse.json(page);
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Error';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
