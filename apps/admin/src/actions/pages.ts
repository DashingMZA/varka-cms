'use server';

import { prisma, requireServerAuth, slugifyName } from '@/lib/server-db';
import { revalidatePath } from 'next/cache';

export type ActionResult<T = unknown> =
  | { ok: true; data: T }
  | { ok: false; error: string };

function fail(e: unknown): ActionResult<never> {
  return { ok: false, error: e instanceof Error ? e.message : 'Error' };
}

export async function listPagesAction(opts?: {
  q?: string;
  limit?: number;
}): Promise<ActionResult<{ items: unknown[] }>> {
  try {
    const { siteId } = await requireServerAuth('pages.read');
    const q = opts?.q?.trim();
    const items = await prisma.page.findMany({
      where: {
        siteId,
        ...(q
          ? {
              translations: {
                some: {
                  OR: [
                    { title: { contains: q, mode: 'insensitive' } },
                    { slug: { contains: q, mode: 'insensitive' } },
                  ],
                },
              },
            }
          : {}),
      },
      take: Math.min(opts?.limit ?? 100, 200),
      orderBy: { updatedAt: 'desc' },
      include: {
        translations: true,
        author: { select: { id: true, name: true, email: true } },
      },
    });
    return { ok: true, data: { items: JSON.parse(JSON.stringify(items)) } };
  } catch (e) {
    return fail(e);
  }
}

export async function getPageAction(pageId: string): Promise<ActionResult<unknown>> {
  try {
    await requireServerAuth('pages.read');
    const page = await prisma.page.findUnique({
      where: { id: pageId },
      include: { translations: true },
    });
    if (!page) return { ok: false, error: 'Not found' };
    return { ok: true, data: JSON.parse(JSON.stringify(page)) };
  } catch (e) {
    return fail(e);
  }
}

export async function createPageAction(title = 'Untitled'): Promise<ActionResult<{ id: string }>> {
  try {
    const { ctx, siteId } = await requireServerAuth('pages.create');
    const lang = await prisma.language.findFirst({
      where: { siteId, defaultLanguage: true },
    });
    if (!lang) return { ok: false, error: 'No default language' };

    let slug = slugifyName(title);
    for (let i = 0; i < 30; i++) {
      const exists = await prisma.pageTranslation.findFirst({
        where: { languageId: lang.id, slug },
      });
      if (!exists) break;
      slug = `${slugifyName(title)}-${i + 2}`;
    }

    const authorId =
      ctx.userId && ctx.userId !== 'dev-user' ? ctx.userId : undefined;

    const page = await prisma.page.create({
      data: {
        siteId,
        ...(authorId ? { authorId } : {}),
        status: 'DRAFT',
        translations: {
          create: {
            languageId: lang.id,
            title,
            slug,
            contentHtml: '',
            status: 'DRAFT',
          },
        },
      },
    });
    revalidatePath('/content/pages');
    return { ok: true, data: { id: page.id } };
  } catch (e) {
    return fail(e);
  }
}

export async function updatePageAction(
  pageId: string,
  body: {
    title?: string;
    slug?: string;
    contentHtml?: string;
    excerpt?: string | null;
    status?: string;
    languageId: string;
  },
): Promise<ActionResult<unknown>> {
  try {
    await requireServerAuth('pages.update');
    const page = await prisma.page.findUnique({
      where: { id: pageId },
      include: { translations: true },
    });
    if (!page) return { ok: false, error: 'Not found' };
    const tr = page.translations.find((t) => t.languageId === body.languageId);
    if (!tr) return { ok: false, error: 'Translation not found' };

    await prisma.$transaction([
      prisma.pageTranslation.update({
        where: { id: tr.id },
        data: {
          ...(body.title !== undefined ? { title: body.title } : {}),
          ...(body.slug !== undefined ? { slug: body.slug } : {}),
          ...(body.contentHtml !== undefined ? { contentHtml: body.contentHtml } : {}),
          ...(body.excerpt !== undefined ? { excerpt: body.excerpt } : {}),
          ...(body.status !== undefined ? { status: body.status as never } : {}),
        },
      }),
      prisma.page.update({
        where: { id: pageId },
        data: {
          ...(body.status ? { status: body.status as never } : {}),
          version: { increment: 1 },
        },
      }),
    ]);

    const updated = await prisma.page.findUnique({
      where: { id: pageId },
      include: { translations: true },
    });
    revalidatePath('/content/pages');
    revalidatePath(`/content/pages/${pageId}`);
    return { ok: true, data: JSON.parse(JSON.stringify(updated)) };
  } catch (e) {
    return fail(e);
  }
}

export async function trashPageAction(pageId: string): Promise<ActionResult<{ id: string }>> {
  try {
    await requireServerAuth('pages.update');
    await prisma.page.update({
      where: { id: pageId },
      data: { status: 'TRASHED' },
    });
    revalidatePath('/content/pages');
    return { ok: true, data: { id: pageId } };
  } catch (e) {
    return fail(e);
  }
}
