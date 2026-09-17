import { NextResponse } from 'next/server';
import { prisma } from '@varka/database';

const GROUPS = new Set([
  'general',
  'writing',
  'reading',
  'discussion',
  'media',
  'permalinks',
]);

async function getSiteId() {
  const site = await prisma.site.findFirst({ where: { slug: 'varka' } });
  if (!site) throw new Error('Site not found — run seed');
  return site.id;
}

function settingKey(group: string) {
  return `settings.${group}`;
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const group = url.searchParams.get('group') ?? '';
    if (!GROUPS.has(group)) {
      return NextResponse.json({ error: 'Invalid group' }, { status: 400 });
    }
    const siteId = await getSiteId();
    const row = await prisma.siteSetting.findUnique({
      where: { siteId_key: { siteId, key: settingKey(group) } },
    });
    const settings =
      row?.value && typeof row.value === 'object' && !Array.isArray(row.value)
        ? (row.value as Record<string, unknown>)
        : {};
    return NextResponse.json({ group, settings });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Error';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function PUT(req: Request) {
  try {
    const url = new URL(req.url);
    const group = url.searchParams.get('group') ?? '';
    if (!GROUPS.has(group)) {
      return NextResponse.json({ error: 'Invalid group' }, { status: 400 });
    }
    const body = (await req.json()) as { settings?: Record<string, unknown> };
    if (!body.settings || typeof body.settings !== 'object') {
      return NextResponse.json({ error: 'settings object required' }, { status: 400 });
    }
    const siteId = await getSiteId();
    const key = settingKey(group);
    const value = body.settings as object;
    await prisma.siteSetting.upsert({
      where: { siteId_key: { siteId, key } },
      create: { siteId, key, value },
      update: { value },
    });
    return NextResponse.json({ ok: true, group, settings: body.settings });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Error';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
