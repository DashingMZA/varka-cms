'use server';

import { prisma, requireServerAuth, slugifyName } from '@/lib/server-db';
import { revalidatePath } from 'next/cache';

export type ActionResult<T = unknown> =
  | { ok: true; data: T }
  | { ok: false; error: string };

function fail(e: unknown): ActionResult<never> {
  return { ok: false, error: e instanceof Error ? e.message : 'Error' };
}

export async function listCategoriesAction(): Promise<ActionResult<{ items: unknown[] }>> {
  try {
    const { siteId } = await requireServerAuth('posts.read');
    const items = await prisma.category.findMany({
      where: { siteId },
      include: {
        translations: true,
        _count: { select: { posts: true } },
      },
      orderBy: { sortOrder: 'asc' },
    });
    return { ok: true, data: { items: JSON.parse(JSON.stringify(items)) } };
  } catch (e) {
    return fail(e);
  }
}

export async function createCategoryAction(input: {
  name: string;
  slug?: string;
  description?: string;
}): Promise<ActionResult<unknown>> {
  try {
    const { siteId } = await requireServerAuth('posts.update');
    const name = input.name.trim();
    if (!name) return { ok: false, error: 'name required' };
    const lang = await prisma.language.findFirst({
      where: { siteId, defaultLanguage: true },
    });
    if (!lang) return { ok: false, error: 'No default language' };
    const slug = input.slug?.trim() ? slugifyName(input.slug) : slugifyName(name);
    const cat = await prisma.category.create({
      data: {
        siteId,
        translations: {
          create: {
            languageId: lang.id,
            name,
            slug,
            description: input.description ?? null,
          },
        },
      },
      include: { translations: true, _count: { select: { posts: true } } },
    });
    revalidatePath('/content/categories');
    return { ok: true, data: JSON.parse(JSON.stringify(cat)) };
  } catch (e) {
    return fail(e);
  }
}

export async function listTagsAction(): Promise<ActionResult<{ items: unknown[] }>> {
  try {
    const { siteId } = await requireServerAuth('posts.read');
    const items = await prisma.tag.findMany({
      where: { siteId },
      include: {
        translations: true,
        _count: { select: { posts: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    return { ok: true, data: { items: JSON.parse(JSON.stringify(items)) } };
  } catch (e) {
    return fail(e);
  }
}

export async function createTagAction(input: {
  name: string;
  slug?: string;
}): Promise<ActionResult<unknown>> {
  try {
    const { siteId } = await requireServerAuth('posts.update');
    const name = input.name.trim();
    if (!name) return { ok: false, error: 'name required' };
    const lang = await prisma.language.findFirst({
      where: { siteId, defaultLanguage: true },
    });
    if (!lang) return { ok: false, error: 'No default language' };
    const slug = input.slug?.trim() ? slugifyName(input.slug) : slugifyName(name);
    const tag = await prisma.tag.create({
      data: {
        siteId,
        translations: {
          create: {
            languageId: lang.id,
            name,
            slug,
          },
        },
      },
      include: { translations: true, _count: { select: { posts: true } } },
    });
    revalidatePath('/content/tags');
    return { ok: true, data: JSON.parse(JSON.stringify(tag)) };
  } catch (e) {
    return fail(e);
  }
}
