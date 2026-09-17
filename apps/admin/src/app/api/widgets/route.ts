import { NextResponse } from 'next/server';
import { prisma } from '@varka/database';
import { guard } from '@/lib/api-guard';

const KEY = 'appearance.widgets';

export type WidgetInstance = {
  id: string;
  type: 'recent_posts' | 'categories' | 'search' | 'custom_html' | 'tag_cloud';
  title: string;
  config?: Record<string, unknown>;
};

export type WidgetZone = {
  id: string;
  name: string;
  widgets: WidgetInstance[];
};

async function siteId() {
  const site = await prisma.site.findFirst({ where: { slug: 'varka' } });
  if (!site) throw new Error('Site not found');
  return site.id;
}

const DEFAULT_ZONES: WidgetZone[] = [
  { id: 'sidebar', name: 'Sidebar', widgets: [] },
  { id: 'footer-1', name: 'Footer Column 1', widgets: [] },
  { id: 'footer-2', name: 'Footer Column 2', widgets: [] },
];

async function loadZones(sid: string): Promise<WidgetZone[]> {
  const row = await prisma.siteSetting.findUnique({
    where: { siteId_key: { siteId: sid, key: KEY } },
  });
  if (row?.value && Array.isArray(row.value)) return row.value as WidgetZone[];
  return DEFAULT_ZONES;
}

export async function GET(req: Request) {
  const g = await guard(req, 'themes.read');
  if (g instanceof NextResponse) return g;
  try {
    const zones = await loadZones(await siteId());
    return NextResponse.json({ zones });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Error' },
      { status: 400 },
    );
  }
}

export async function PUT(req: Request) {
  const g = await guard(req, 'themes.customize');
  if (g instanceof NextResponse) return g;
  try {
    const body = (await req.json()) as { zones?: WidgetZone[] };
    if (!Array.isArray(body.zones)) {
      return NextResponse.json({ error: 'zones array required' }, { status: 400 });
    }
    const sid = await siteId();
    await prisma.siteSetting.upsert({
      where: { siteId_key: { siteId: sid, key: KEY } },
      create: { siteId: sid, key: KEY, value: body.zones as object },
      update: { value: body.zones as object },
    });
    return NextResponse.json({ ok: true, zones: body.zones });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Error' },
      { status: 400 },
    );
  }
}
