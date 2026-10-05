import { NextResponse } from 'next/server';
import { getAuthContext } from '@/lib/auth-context';

type Ctx = { params: Promise<{ id: string }> };

export async function GET(req: Request, ctx: Ctx) {
  try {
    await getAuthContext(req);
    const { id } = await ctx.params;
    const { prisma } = await import('@varka/database');
    const page = await prisma.page.findUnique({
      where: { id },
      include: {
        translations: true,
        author: { select: { id: true, name: true, email: true } },
      },
    });
    if (!page) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(page);
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Error';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function PATCH(req: Request, ctx: Ctx) {
  try {
    await getAuthContext(req);
    const { id } = await ctx.params;
    const body = (await req.json()) as {
      title?: string;
      slug?: string;
      contentHtml?: string;
      status?: string;
      languageId?: string;
    };
    const { prisma } = await import('@varka/database');
    const page = await prisma.page.findUnique({
      where: { id },
      include: { translations: true },
    });
    if (!page) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    if (body.status) {
      await prisma.page.update({
        where: { id },
        data: { status: body.status as never },
      });
    }

    const tr =
      page.translations.find((t: { languageId: string }) => t.languageId === body.languageId) ??
      page.translations[0];
    if (
      tr &&
      (body.title !== undefined ||
        body.slug !== undefined ||
        body.contentHtml !== undefined)
    ) {
      await prisma.pageTranslation.update({
        where: { id: tr.id },
        data: {
          ...(body.title !== undefined ? { title: body.title } : {}),
          ...(body.slug !== undefined ? { slug: body.slug } : {}),
          ...(body.contentHtml !== undefined ? { contentHtml: body.contentHtml } : {}),
        },
      });
    }

    const updated = await prisma.page.findUnique({
      where: { id },
      include: { translations: true },
    });
    return NextResponse.json(updated);
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Error';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(req: Request, ctx: Ctx) {
  try {
    await getAuthContext(req);
    const { id } = await ctx.params;
    const { prisma } = await import('@varka/database');
    await prisma.page.update({
      where: { id },
      data: { status: 'TRASHED' },
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Error';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
