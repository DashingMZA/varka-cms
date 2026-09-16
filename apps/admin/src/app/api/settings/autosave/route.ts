import { NextResponse } from 'next/server';

const KEY = 'admin.autosaveIntervalMs';
const DEFAULT_MS = 2500;
const MIN_MS = 1000;
const MAX_MS = 120_000;

async function siteId(db: {
  site: { findFirst: (a: unknown) => Promise<{ id: string } | null> };
}) {
  const site = await db.site.findFirst({ where: { slug: 'varka' } });
  if (!site) throw new Error('Site not found');
  return site.id;
}

export async function GET() {
  try {
    const { prisma } = await import('@varka/database');
    const sid = await siteId(prisma as never);
    const row = await prisma.siteSetting.findUnique({
      where: { siteId_key: { siteId: sid, key: KEY } },
    });
    const ms =
      typeof row?.value === 'number'
        ? row.value
        : typeof row?.value === 'object' &&
            row?.value &&
            'ms' in (row.value as object)
          ? Number((row.value as { ms: number }).ms)
          : DEFAULT_MS;
    return NextResponse.json({
      intervalMs: Math.min(MAX_MS, Math.max(MIN_MS, ms || DEFAULT_MS)),
      minMs: MIN_MS,
      maxMs: MAX_MS,
      defaultMs: DEFAULT_MS,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Error';
    return NextResponse.json({ error: message, intervalMs: DEFAULT_MS }, { status: 200 });
  }
}

export async function PUT(req: Request) {
  try {
    const body = (await req.json()) as { intervalMs?: number };
    let ms = Number(body.intervalMs ?? DEFAULT_MS);
    if (!Number.isFinite(ms)) ms = DEFAULT_MS;
    ms = Math.min(MAX_MS, Math.max(MIN_MS, Math.round(ms)));

    const { prisma } = await import('@varka/database');
    const sid = await siteId(prisma as never);
    await prisma.siteSetting.upsert({
      where: { siteId_key: { siteId: sid, key: KEY } },
      create: { siteId: sid, key: KEY, value: { ms } },
      update: { value: { ms } },
    });
    return NextResponse.json({ intervalMs: ms });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Error';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
