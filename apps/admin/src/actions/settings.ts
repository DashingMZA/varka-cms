'use server';

import { prisma, requireServerAuth } from '@/lib/server-db';
import { revalidatePath } from 'next/cache';

import type { ActionResult } from './posts';

function fail(e: unknown): ActionResult<never> {
  return { ok: false, error: e instanceof Error ? e.message : 'Error' };
}

const SETTINGS_GROUPS = new Set([
  'general',
  'writing',
  'reading',
  'discussion',
  'media',
  'permalinks',
  'privacy',
]);

export async function getSettingsAction(
  group: string,
): Promise<ActionResult<{ settings: Record<string, unknown> }>> {
  try {
    const { siteId } = await requireServerAuth('settings.read');
    if (!SETTINGS_GROUPS.has(group)) return { ok: false, error: 'Invalid group' };
    const rows = await prisma.siteSetting.findMany({
      where: { siteId, key: { startsWith: `${group}.` } },
    });
    const settings: Record<string, unknown> = {};
    for (const r of rows) {
      const k = r.key.slice(group.length + 1);
      settings[k] = r.value;
    }
    return { ok: true, data: { settings } };
  } catch (e) {
    return fail(e);
  }
}

export async function saveSettingsAction(
  group: string,
  settings: Record<string, unknown>,
): Promise<ActionResult<{ ok: true }>> {
  try {
    const { siteId } = await requireServerAuth('settings.update');
    if (!SETTINGS_GROUPS.has(group)) return { ok: false, error: 'Invalid group' };
    for (const [k, v] of Object.entries(settings)) {
      const key = `${group}.${k}`;
      await prisma.siteSetting.upsert({
        where: { siteId_key: { siteId, key } },
        create: { siteId, key, value: v as object },
        update: { value: v as object },
      });
    }
    revalidatePath('/settings');
    return { ok: true, data: { ok: true } };
  } catch (e) {
    return fail(e);
  }
}

const SEO_KEY = 'seo.global';

export async function getSeoAction(): Promise<ActionResult<unknown>> {
  try {
    const { siteId } = await requireServerAuth('seo.read');
    const row = await prisma.siteSetting.findUnique({
      where: { siteId_key: { siteId, key: SEO_KEY } },
    });
    return { ok: true, data: row?.value ?? {} };
  } catch (e) {
    return fail(e);
  }
}

export async function saveSeoAction(
  value: Record<string, unknown>,
): Promise<ActionResult<{ ok: true }>> {
  try {
    const { siteId } = await requireServerAuth('seo.update');
    await prisma.siteSetting.upsert({
      where: { siteId_key: { siteId, key: SEO_KEY } },
      create: { siteId, key: SEO_KEY, value: value as object },
      update: { value: value as object },
    });
    revalidatePath('/seo');
    return { ok: true, data: { ok: true } };
  } catch (e) {
    return fail(e);
  }
}

export async function listThemesAction(): Promise<ActionResult<unknown>> {
  try {
    const { siteId } = await requireServerAuth('appearance.read');
    const themes = await prisma.theme.findMany({ where: { siteId } });
    return { ok: true, data: JSON.parse(JSON.stringify(themes)) };
  } catch (e) {
    return fail(e);
  }
}

export async function activateThemeAction(slug: string): Promise<ActionResult<{ ok: true }>> {
  try {
    const { siteId } = await requireServerAuth('appearance.update');
    await prisma.theme.updateMany({ where: { siteId }, data: { active: false } });
    await prisma.theme.updateMany({ where: { siteId, slug }, data: { active: true } });
    revalidatePath('/appearance');
    return { ok: true, data: { ok: true } };
  } catch (e) {
    return fail(e);
  }
}

export async function getMenusAction(): Promise<ActionResult<{ menus: unknown[] }>> {
  try {
    const { siteId } = await requireServerAuth('appearance.read');
    const menus = await prisma.menu.findMany({
      where: { siteId },
      include: { items: { orderBy: { sortOrder: 'asc' } } },
    });
    return { ok: true, data: { menus: JSON.parse(JSON.stringify(menus)) } };
  } catch (e) {
    return fail(e);
  }
}

export async function saveMenusAction(menus: unknown[]): Promise<ActionResult<{ ok: true }>> {
  try {
    const { siteId } = await requireServerAuth('appearance.update');
    // Store as JSON setting for flexibility
    await prisma.siteSetting.upsert({
      where: { siteId_key: { siteId, key: 'appearance.menus' } },
      create: { siteId, key: 'appearance.menus', value: menus as object },
      update: { value: menus as object },
    });
    revalidatePath('/appearance/menus');
    return { ok: true, data: { ok: true } };
  } catch (e) {
    return fail(e);
  }
}

export async function getWidgetsAction(): Promise<ActionResult<unknown>> {
  try {
    const { siteId } = await requireServerAuth('appearance.read');
    const row = await prisma.siteSetting.findUnique({
      where: { siteId_key: { siteId, key: 'appearance.widgets' } },
    });
    return { ok: true, data: row?.value ?? [] };
  } catch (e) {
    return fail(e);
  }
}

export async function saveWidgetsAction(value: unknown): Promise<ActionResult<{ ok: true }>> {
  try {
    const { siteId } = await requireServerAuth('appearance.update');
    await prisma.siteSetting.upsert({
      where: { siteId_key: { siteId, key: 'appearance.widgets' } },
      create: { siteId, key: 'appearance.widgets', value: value as object },
      update: { value: value as object },
    });
    revalidatePath('/appearance/widgets');
    return { ok: true, data: { ok: true } };
  } catch (e) {
    return fail(e);
  }
}

export async function getRolesMatrixAction(): Promise<ActionResult<unknown>> {
  try {
    await requireServerAuth('users.manage');
    const roles = await prisma.role.findMany({
      include: { permissions: { include: { permission: true } } },
    });
    const permissions = await prisma.permission.findMany();
    return {
      ok: true,
      data: JSON.parse(JSON.stringify({ roles, permissions })),
    };
  } catch (e) {
    return fail(e);
  }
}

export async function setRolePermissionAction(input: {
  roleSlug: string;
  permissionKey: string;
  enabled: boolean;
}): Promise<ActionResult<{ ok: true }>> {
  try {
    await requireServerAuth('users.manage');
    const role = await prisma.role.findFirst({ where: { slug: input.roleSlug } });
    const perm = await prisma.permission.findFirst({ where: { key: input.permissionKey } });
    if (!role || !perm) return { ok: false, error: 'Role or permission not found' };
    if (input.enabled) {
      await prisma.rolePermission.upsert({
        where: { roleId_permissionId: { roleId: role.id, permissionId: perm.id } },
        create: { roleId: role.id, permissionId: perm.id },
        update: {},
      });
    } else {
      await prisma.rolePermission.deleteMany({
        where: { roleId: role.id, permissionId: perm.id },
      });
    }
    revalidatePath('/users');
    return { ok: true, data: { ok: true } };
  } catch (e) {
    return fail(e);
  }
}

export async function listAuditAction(limit = 50): Promise<ActionResult<{ items: unknown[] }>> {
  try {
    await requireServerAuth('audit.read');
    const items = await prisma.auditLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: Math.min(limit, 200),
    });
    return { ok: true, data: { items: JSON.parse(JSON.stringify(items)) } };
  } catch (e) {
    return fail(e);
  }
}
