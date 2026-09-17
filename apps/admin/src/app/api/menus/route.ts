import { NextResponse } from 'next/server';
import { prisma } from '@varka/database';
import { guard } from '@/lib/api-guard';

const KEY = 'appearance.menus';

export type MenuItem = {
  id: string;
  label: string;
  url: string;
  children?: MenuItem[];
};

export type MenuRecord = {
  id: string;
  name: string;
  location: 'primary' | 'footer' | 'mobile' | 'none';
  items: MenuItem[];
};

async function siteId() {
  const site = await prisma.site.findFirst({ where: { slug: 'varka' } });
  if (!site) throw new Error('Site not found');
  return site.id;
}

async function loadMenus(sid: string): Promise<MenuRecord[]> {
  const row = await prisma.siteSetting.findUnique({
    where: { siteId_key: { siteId: sid, key: KEY } },
  });
  if (row?.value && Array.isArray(row.value)) return row.value as MenuRecord[];
  return [
    { id: 'main', name: 'Main Menu', location: 'primary', items: [] },
    { id: 'footer', name: 'Footer Menu', location: 'footer', items: [] },
  ];
}

async function saveMenus(sid: string, menus: MenuRecord[]) {
  await prisma.siteSetting.upsert({
    where: { siteId_key: { siteId: sid, key: KEY } },
    create: { siteId: sid, key: KEY, value: menus as object },
    update: { value: menus as object },
  });
}

export async function GET(req: Request) {
  const g = await guard(req, 'themes.read');
  if (g instanceof NextResponse) return g;
  try {
    const sid = await siteId();
    const menus = await loadMenus(sid);
    return NextResponse.json({ menus });
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
    const body = (await req.json()) as { menus?: MenuRecord[] };
    if (!Array.isArray(body.menus)) {
      return NextResponse.json({ error: 'menus array required' }, { status: 400 });
    }
    const sid = await siteId();
    await saveMenus(sid, body.menus);
    return NextResponse.json({ ok: true, menus: body.menus });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Error' },
      { status: 400 },
    );
  }
}
