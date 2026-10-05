'use server';

import { prisma, requireServerAuth } from '@/lib/server-db';
import { listNotFoundLogs, clearNotFoundLogs } from '@varka/seo';
import type { ActionResult } from '@/actions/tools';

function fail(e: unknown): ActionResult<never> {
  return { ok: false, error: e instanceof Error ? e.message : 'Failed' };
}

export async function listNotFoundLogsAction(): Promise<
  ActionResult<Array<{ id: string; path: string; hits: number; lastSeen: string; referrer: string | null }>>
> {
  try {
    const { siteId } = await requireServerAuth('seo.read');
    const logs = await listNotFoundLogs(prisma as never, siteId);
    return { ok: true, data: JSON.parse(JSON.stringify(logs)) };
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
