'use server';

import { prisma, requireServerAuth, slugifyName } from '@/lib/server-db';
import { revalidatePath } from 'next/cache';

import type { ActionResult } from './posts';

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
  parentId?: string;
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
        parentId: input.parentId || null,
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

export async function updateCategoryAction(
  id: string,
  input: { name?: string; slug?: string; description?: string; parentId?: string | null }
): Promise<ActionResult<unknown>> {
  try {
    const { siteId } = await requireServerAuth('posts.update');
    const lang = await prisma.language.findFirst({
      where: { siteId, defaultLanguage: true },
    });
    if (!lang) return { ok: false, error: 'No default language' };

    const data: Record<string, unknown> = {};
    if (input.parentId !== undefined) data.parentId = input.parentId;

    const trData: Record<string, unknown> = {};
    if (input.name !== undefined) trData.name = input.name.trim();
    if (input.slug !== undefined) trData.slug = slugifyName(input.slug);
    if (input.description !== undefined) trData.description = input.description;

    await prisma.$transaction(async (tx: typeof prisma) => {
      if (Object.keys(data).length > 0) {
        await tx.category.update({ where: { id }, data: data as never });
      }
      if (Object.keys(trData).length > 0) {
        const tr = await tx.categoryTranslation.findFirst({
          where: { categoryId: id, languageId: lang.id },
        });
        if (tr) {
          await tx.categoryTranslation.update({ where: { id: tr.id }, data: trData as never });
        }
      }
    });

    revalidatePath('/content/categories');
    return { ok: true, data: { id } };
  } catch (e) {
    return fail(e);
  }
}

export async function deleteCategoryAction(id: string): Promise<ActionResult<{ id: string }>> {
  try {
    const { siteId } = await requireServerAuth('posts.update');
    // Move children to no parent
    await prisma.category.updateMany({
      where: { parentId: id, siteId },
      data: { parentId: null },
    });
    await prisma.category.deleteMany({ where: { id, siteId } });
    revalidatePath('/content/categories');
    return { ok: true, data: { id } };
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
    const tag = await prisma.tag.create({
      data: {
        siteId,
        translations: {
          create: {
            languageId: lang.id,
            name,
            slug,
            description: input.description?.trim() || null,
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

export async function updateTagAction(
  id: string,
  input: { name?: string; slug?: string; description?: string },
): Promise<ActionResult<{ id: string }>> {
  try {
    const { siteId } = await requireServerAuth('posts.update');
    const tag = await prisma.tag.findFirst({ where: { id, siteId } });
    if (!tag) return { ok: false, error: 'Tag not found' };
    const lang = await prisma.language.findFirst({
      where: { siteId, defaultLanguage: true },
    });
    if (!lang) return { ok: false, error: 'No default language' };

    const data: { name?: string; slug?: string; description?: string | null } = {};
    if (input.name !== undefined) {
      const name = input.name.trim();
      if (!name) return { ok: false, error: 'Name required' };
      data.name = name;
    }
    if (input.slug !== undefined) {
      data.slug = input.slug.trim() ? slugifyName(input.slug) : slugifyName(data.name || 'tag');
    }
    if (input.description !== undefined) {
      data.description = input.description.trim() || null;
    }

    await prisma.tagTranslation.upsert({
      where: { tagId_languageId: { tagId: id, languageId: lang.id } },
      create: {
        tagId: id,
        languageId: lang.id,
        name: data.name || 'Untitled',
        slug: data.slug || 'untitled',
        description: data.description ?? null,
      },
      update: data,
    });
    revalidatePath('/content/tags');
    return { ok: true, data: { id } };
  } catch (e) {
    return fail(e);
  }
}

export async function deleteTagAction(id: string): Promise<ActionResult<{ id: string }>> {
  try {
    const { siteId } = await requireServerAuth('posts.update');
    const tag = await prisma.tag.findFirst({ where: { id, siteId } });
    if (!tag) return { ok: false, error: 'Tag not found' };
    await prisma.tag.delete({ where: { id } });
    revalidatePath('/content/tags');
    return { ok: true, data: { id } };
  } catch (e) {
    return fail(e);
  }
}
