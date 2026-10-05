import { NextResponse } from 'next/server';
import { prisma, requireServerAuth } from '@/lib/server-db';

const PLUGIN_PERMISSIONS = [
  'plugins.read',
  'plugins.install',
  'plugins.activate',
  'plugins.delete',
] as const;

const PLUGIN_TABLE_SQL = `
CREATE TABLE IF NOT EXISTS "Plugin" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "slug" TEXT NOT NULL UNIQUE,
  "name" TEXT NOT NULL,
  "version" TEXT NOT NULL,
  "description" TEXT,
  "author" TEXT,
  "active" BOOLEAN NOT NULL DEFAULT false,
  "manifest" JSONB,
  "installedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS "Plugin_active_idx" ON "Plugin"("active");
`;

/**
 * One-click initializer for the plugin system — makes everything dynamic.
 * - Creates the Plugin table if missing (same SQL as the migration)
 * - Ensures plugins.* permissions exist
 * - Grants them to owner + admin roles
 *
 * Safe to run multiple times (idempotent).
 */
export async function POST() {
  try {
    await requireServerAuth('settings.update');

    // 1. Plugin table
    await prisma.$executeRawUnsafe(PLUGIN_TABLE_SQL);

    // 2. Permissions
    for (const key of PLUGIN_PERMISSIONS) {
      await prisma.permission.upsert({
        where: { key },
        create: { key, description: `Plugin system: ${key}` },
        update: {},
      });
    }

    // 3. Grant to owner + admin
    const roles = await prisma.role.findMany({
      where: { slug: { in: ['owner', 'admin'] } },
    });
    const perms = await prisma.permission.findMany({
      where: { key: { in: [...PLUGIN_PERMISSIONS] } },
    });
    let granted = 0;
    for (const role of roles) {
      for (const perm of perms) {
        const existing = await prisma.rolePermission.findUnique({
          where: { roleId_permissionId: { roleId: role.id, permissionId: perm.id } },
        });
        if (!existing) {
          await prisma.rolePermission.create({
            data: { roleId: role.id, permissionId: perm.id },
          });
          granted++;
        }
      }
    }

    return NextResponse.json({
      ok: true,
      table: 'Plugin table ready',
      permissions: `${PLUGIN_PERMISSIONS.length} permissions ensured`,
      granted: `${granted} new role grants (owner/admin)`,
    });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : 'Sync failed' },
      { status: 500 },
    );
  }
}
