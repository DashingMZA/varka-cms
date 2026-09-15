import { NextResponse } from 'next/server';
import { getCache, getCacheDriver } from '@varka/cache';

export async function GET() {
  try {
    const cache = await getCache();
    const ok = cache.ping ? await cache.ping() : true;
    return NextResponse.json({
      ok: true,
      cache: getCacheDriver(),
      cachePing: ok,
      time: new Date().toISOString(),
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Error';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
