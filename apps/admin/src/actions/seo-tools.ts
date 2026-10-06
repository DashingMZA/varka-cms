'use server';

import { prisma, requireServerAuth } from '@/lib/server-db';
import { listNotFoundLogs, clearNotFoundLogs } from '@varka/seo';
import type { ActionResult } from '@/actions/tools';

function fail(e: unknown): ActionResult<never> {
  return { ok: false, error: e instanceof Error ? e.message : 'Failed' };
}

export async function listNotFoundLogsAction(): Promise<
  ActionResult<Array<{ id: string; path: string; hits: number; firstSeen: string; lastSeen: string; referrer: string | null }>>
> {
  try {
    const { siteId } = await requireServerAuth('seo.read');
    const [logs, excludeRow] = await Promise.all([
      listNotFoundLogs(prisma as never, siteId),
      prisma.siteSetting.findUnique({
        where: { siteId_key: { siteId, key: 'seo.notFoundExclude' } },
      }),
    ]);
    let exclude: string[] = [];
    if (excludeRow?.value) {
      try {
        const parsed: unknown = JSON.parse(excludeRow.value);
        if (typeof parsed === 'string') {
          exclude = parsed.split('\n').map((s) => s.trim()).filter(Boolean);
        }
      } catch {
        /* ignore */
      }
    }
    const filtered = exclude.length
      ? logs.filter((l) => !exclude.some((p) => l.path.includes(p)))
      : logs;
    return { ok: true, data: JSON.parse(JSON.stringify(filtered)) };
  } catch (e) {
    return fail(e);
  }
}

export async function clearNotFoundLogsAction(): Promise<ActionResult<{ count: number }>> {
  try {
    const { siteId } = await requireServerAuth('seo.update');
    const result = await clearNotFoundLogs(prisma as never, siteId);
    return { ok: true, data: result };
  } catch (e) {
    return fail(e);
  }
}

export async function deleteNotFoundLogAction(id: string): Promise<ActionResult<{ id: string }>> {
  try {
    await requireServerAuth('seo.update');
    await prisma.notFoundLog.delete({ where: { id } });
    return { ok: true, data: { id } };
  } catch (e) {
    return fail(e);
  }
}

/** Get SEO settings (titles, sitemap, etc.) */
export async function getSeoSettingsAction(): Promise<ActionResult<Record<string, unknown>>> {
  try {
    const { siteId } = await requireServerAuth('seo.read');
    const settings = await prisma.siteSetting.findMany({
      where: { siteId, key: { startsWith: 'seo.' } },
    });
    const data: Record<string, unknown> = {};
    for (const s of settings) {
      const key = s.key.replace(/^seo\./, '');
      try {
        data[key] = JSON.parse(s.value);
      } catch {
        data[key] = s.value;
      }
    }
    return { ok: true, data };
  } catch (e) {
    return fail(e);
  }
}

/** Save SEO settings */
export async function saveSeoSettingsAction(
  settings: Record<string, unknown>
): Promise<ActionResult<{ saved: number }>> {
  try {
    const { siteId } = await requireServerAuth('seo.update');
    let saved = 0;
    for (const [key, value] of Object.entries(settings)) {
      const fullKey = `seo.${key}`;
      const strValue = typeof value === 'string' ? value : JSON.stringify(value);
      await prisma.siteSetting.upsert({
        where: { siteId_key: { siteId, key: fullKey } },
        update: { value: strValue },
        create: { siteId, key: fullKey, value: strValue },
      });
      saved++;
    }
    return { ok: true, data: { saved } };
  } catch (e) {
    return fail(e);
  }
}

/** List redirections */
export async function listRedirectionsAction(): Promise<ActionResult<unknown[]>> {
  try {
    const { siteId } = await requireServerAuth('seo.read');
    const items = await prisma.redirection.findMany({
      where: { siteId },
      orderBy: { createdAt: 'desc' },
    });
    return { ok: true, data: JSON.parse(JSON.stringify(items)) };
  } catch (e) {
    return fail(e);
  }
}

/** Create redirection */
export async function createRedirectionAction(input: {
  source: string;
  target: string;
  code: number;
}): Promise<ActionResult<unknown>> {
  try {
    const { siteId } = await requireServerAuth('seo.update');
    const item = await prisma.redirection.create({
      data: {
        siteId,
        source: input.source,
        target: input.target,
        code: input.code,
      },
    });
    return { ok: true, data: JSON.parse(JSON.stringify(item)) };
  } catch (e) {
    return fail(e);
  }
}

/** Delete redirection */
export async function deleteRedirectionAction(id: string): Promise<ActionResult<{ id: string }>> {
  try {
    const { siteId } = await requireServerAuth('seo.update');
    await prisma.redirection.deleteMany({ where: { id, siteId } });
    return { ok: true, data: { id } };
  } catch (e) {
    return fail(e);
  }
}

/** Update redirection */
export async function updateRedirectionAction(
  id: string,
  input: { source: string; target: string; code: number }
): Promise<ActionResult<unknown>> {
  try {
    const { siteId } = await requireServerAuth('seo.update');
    const item = await prisma.redirection.updateMany({
      where: { id, siteId },
      data: { source: input.source, target: input.target, code: input.code },
    });
    return { ok: true, data: { id, count: item.count } };
  } catch (e) {
    return fail(e);
  }
}

/** Bulk delete redirections */
export async function bulkDeleteRedirectionsAction(
  ids: string[]
): Promise<ActionResult<{ count: number }>> {
  try {
    const { siteId } = await requireServerAuth('seo.update');
    const result = await prisma.redirection.deleteMany({
      where: { id: { in: ids }, siteId },
    });
    return { ok: true, data: { count: result.count } };
  } catch (e) {
    return fail(e);
  }
}

/** Bulk delete 404 log entries */
export async function bulkDeleteNotFoundLogsAction(
  ids: string[]
): Promise<ActionResult<{ count: number }>> {
  try {
    const { siteId } = await requireServerAuth('seo.update');
    const result = await prisma.notFoundLog.deleteMany({
      where: { id: { in: ids }, siteId },
    });
    return { ok: true, data: { count: result.count } };
  } catch (e) {
    return fail(e);
  }
}

/** Toggle redirection active state */
export async function toggleRedirectionAction(
  id: string,
  active: boolean
): Promise<ActionResult<{ id: string }>> {
  try {
    const { siteId } = await requireServerAuth('seo.update');
    await prisma.redirection.updateMany({
      where: { id, siteId },
      data: { active },
    });
    return { ok: true, data: { id } };
  } catch (e) {
    return fail(e);
  }
}
