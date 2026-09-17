import { NextResponse } from 'next/server';

const SIZES_KEY = 'media.imageSizes';
const YM_KEY = 'media.organizeByYm';

const DEFAULTS = {
  thumbnail: 150,
  medium: 300,
  large: 1024,
  organizeByYm: true,
};

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
    const [sizesRow, ymRow] = await Promise.all([
      prisma.siteSetting.findUnique({ where: { siteId_key: { siteId: sid, key: SIZES_KEY } } }),
      prisma.siteSetting.findUnique({ where: { siteId_key: { siteId: sid, key: YM_KEY } } }),
    ]);
    const s = (sizesRow?.value ?? {}) as Partial<typeof DEFAULTS>;
    const ym = ymRow?.value as { enabled?: boolean } | boolean | null;
    const organizeByYm =
      typeof ym === 'boolean' ? ym : ym && typeof ym === 'object' ? Boolean(ym.enabled) : true;

    return NextResponse.json({
      thumbnail: Number(s.thumbnail) > 0 ? Number(s.thumbnail) : DEFAULTS.thumbnail,
      medium: Number(s.medium) > 0 ? Number(s.medium) : DEFAULTS.medium,
      large: Number(s.large) > 0 ? Number(s.large) : DEFAULTS.large,
      organizeByYm,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Error';
    return NextResponse.json({ error: message, ...DEFAULTS }, { status: 200 });
  }
}

export async function PUT(req: Request) {
  try {
    const body = (await req.json()) as {
      thumbnail?: number;
      medium?: number;
      large?: number;
      organizeByYm?: boolean;
    };
    const thumbnail = Math.min(2000, Math.max(50, Math.round(Number(body.thumbnail) || 150)));
    const medium = Math.min(4000, Math.max(100, Math.round(Number(body.medium) || 300)));
    const large = Math.min(8000, Math.max(200, Math.round(Number(body.large) || 1024)));
    const organizeByYm = body.organizeByYm !== false;

    const { prisma } = await import('@varka/database');
    const sid = await siteId(prisma as never);

    await Promise.all([
      prisma.siteSetting.upsert({
        where: { siteId_key: { siteId: sid, key: SIZES_KEY } },
        create: { siteId: sid, key: SIZES_KEY, value: { thumbnail, medium, large } },
        update: { value: { thumbnail, medium, large } },
      }),
      prisma.siteSetting.upsert({
        where: { siteId_key: { siteId: sid, key: YM_KEY } },
        create: { siteId: sid, key: YM_KEY, value: { enabled: organizeByYm } },
        update: { value: { enabled: organizeByYm } },
      }),
    ]);

    return NextResponse.json({ thumbnail, medium, large, organizeByYm });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Error';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
