import { NextResponse } from 'next/server';
import { listTags, createTag } from '@varka/content';
import { getAuthContext } from '@/lib/auth-context';

export async function GET(req: Request) {
  try {
    const ctx = await getAuthContext(req);
    const { prisma } = await import('@varka/database');
    const site = await prisma.site.findFirst({ where: { slug: 'varka' } });
    if (!site) return NextResponse.json({ error: 'Site not found' }, { status: 404 });
    const result = await listTags(prisma as never, ctx, site.id);
    return NextResponse.json(result);
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Error';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function POST(req: Request) {
  try {
    const ctx = await getAuthContext(req);
    const body = (await req.json()) as { name?: string };
    if (!body.name) return NextResponse.json({ error: 'name required' }, { status: 400 });
    const { prisma } = await import('@varka/database');
    const site = await prisma.site.findFirst({ where: { slug: 'varka' } });
    if (!site) return NextResponse.json({ error: 'Site not found' }, { status: 404 });
    const tag = await createTag(prisma as never, ctx, { siteId: site.id, name: body.name });
    return NextResponse.json(tag, { status: 201 });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Error';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
