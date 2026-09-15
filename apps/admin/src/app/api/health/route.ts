import { NextResponse } from 'next/server';
import { getCache, getCacheDriver } from '@varka/cache';
import { getQueue } from '@varka/queue';

export const dynamic = 'force-dynamic';

export async function GET() {
  const checks: Record<string, unknown> = {
    ok: true,
    time: new Date().toISOString(),
  };

  try {
    const cache = await getCache();
    const cachePing = cache.ping ? await cache.ping() : true;
    checks.cache = getCacheDriver();
    checks.cachePing = cachePing;
  } catch (e) {
    checks.cache = 'error';
    checks.cacheError = e instanceof Error ? e.message : 'cache error';
    checks.ok = false;
  }

  try {
    const { prisma } = await import('@varka/database');
    await prisma.$queryRaw`SELECT 1`;
    checks.database = 'up';
  } catch (e) {
    checks.database = 'down';
    checks.databaseError = e instanceof Error ? e.message : 'db error';
    checks.ok = false;
  }

  try {
    const q = getQueue();
    checks.queue = 'memory';
    checks.queueDepth = q.size();
  } catch {
    checks.queue = 'unavailable';
  }

  const status = checks.ok ? 200 : 503;
  return NextResponse.json(checks, { status });
}
