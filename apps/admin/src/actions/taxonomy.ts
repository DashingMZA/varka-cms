'use server';

import { prisma, requireServerAuth } from '@/lib/server-db';
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
      include: { translations: true },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });
    return { ok: true, data: { items: JSON.parse(JSON.stringify(items)) } };
  } catch (e) {
    return fail(e);
  }
}

export async function listTagsAction(): Promise<ActionResult<{ items: unknown[] }>> {
  try {
    const { siteId } = await requireServerAuth('posts.read');
    const items = await prisma.tag.findMany({
      where: { siteId },
      include: { translations: true },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });
    return { ok: true, data: { items: JSON.parse(JSON.stringify(items)) } };
  } catch (e) {
    return fail(e);
  }
}

export async function createCategoryAction(input: {
  name: string;
  slug?: string;
}): Promise<ActionResult<{ id: string }>> {
  try {
    const { siteId } = await requireServerAuth('posts.write');
    const cat = await prisma.category.create({
      data: {
        siteId,
        translations: {
          create: {
            name: input.name,
            slug: input.slug || input.name.toLowerCase().replace(/\s+/g, '-'),
            languageId: 'en',
          },
        },
      },
    });
    revalidatePath('/content/categories');
    return { ok: true, data: { id: cat.id } };
  } catch (e) {
    return fail(e);
  }
}

export async function createTagAction(input: {
  name: string;
  slug?: string;
}): Promise<ActionResult<{ id: string }>> {
  try {
    const { siteId } = await requireServerAuth('posts.write');
    const tag = await prisma.tag.create({
      data: {
        siteId,
        translations: {
          create: {
            name: input.name,
            slug: input.slug || input.name.toLowerCase().replace(/\s+/g, '-'),
            languageId: 'en',
          },
        },
      },
    });
    revalidatePath('/content/tags');
    return { ok: true, data: { id: tag.id } };
  } catch (e) {
    return fail(e);
  }
}
