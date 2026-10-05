'use server';

import { prisma, requireServerAuth } from '@/lib/server-db';
import { revalidatePath } from 'next/cache';

export type ActionResult<T = unknown> =
  | { ok: true; data: T }
  | { ok: false; error: string };

function fail(e: unknown): ActionResult<never> {
  return { ok: false, error: e instanceof Error ? e.message : 'Failed' };
}

export type LanguageRow = {
  id: string;
  locale: string;
  name: string;
  nativeName: string | null;
  languageCode: string;
  script: string;
  direction: string;
  urlPrefix: string | null;
  enabled: boolean;
  defaultLanguage: boolean;
  displayOrder: number;
};

export async function listLanguagesAction(): Promise<ActionResult<{ items: LanguageRow[] }>> {
  try {
    const { siteId } = await requireServerAuth('languages.read');
    const items = await prisma.language.findMany({
      where: { siteId },
      orderBy: [{ displayOrder: 'asc' }, { locale: 'asc' }],
    });
    return { ok: true, data: { items: JSON.parse(JSON.stringify(items)) } };
  } catch (e) {
    return fail(e);
  }
}

export async function createLanguageAction(input: {
  name: string;
  nativeName?: string;
  locale: string;
  languageCode: string;
  script: string;
  direction?: string;
  urlPrefix?: string;
  enabled?: boolean;
  defaultLanguage?: boolean;
}): Promise<ActionResult<{ id: string }>> {
  try {
    const { siteId } = await requireServerAuth('languages.manage');
    if (!input.name || !input.locale || !input.languageCode || !input.script) {
      return { ok: false, error: 'name, locale, languageCode, script required' };
    }
    if (input.defaultLanguage) {
      await prisma.language.updateMany({
        where: { siteId },
        data: { defaultLanguage: false },
      });
    }
    const created = await prisma.language.create({
      data: {
        siteId,
        name: input.name,
        nativeName: input.nativeName ?? input.name,
        locale: input.locale,
        languageCode: input.languageCode,
        script: input.script,
        direction: input.direction ?? 'ltr',
        urlPrefix: input.urlPrefix ?? null,
        enabled: input.enabled ?? true,
        defaultLanguage: input.defaultLanguage ?? false,
        displayOrder: 0,
      },
    });
    revalidatePath('/settings/languages');
    return { ok: true, data: { id: created.id } };
  } catch (e) {
    return fail(e);
  }
}

export async function updateLanguageAction(
  id: string,
  input: { enabled?: boolean; defaultLanguage?: boolean },
): Promise<ActionResult<{ id: string }>> {
  try {
    const { siteId } = await requireServerAuth('languages.manage');
    if (input.defaultLanguage) {
      await prisma.language.updateMany({
        where: { siteId },
        data: { defaultLanguage: false },
      });
    }
    await prisma.language.update({
      where: { id },
      data: {
        ...(input.enabled !== undefined ? { enabled: input.enabled } : {}),
        ...(input.defaultLanguage !== undefined ? { defaultLanguage: input.defaultLanguage } : {}),
      },
    });
    revalidatePath('/settings/languages');
    return { ok: true, data: { id } };
  } catch (e) {
    return fail(e);
  }
}
