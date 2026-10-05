'use server';

import { prisma, requireServerAuth } from '@/lib/server-db';

export type ActionResult<T = unknown> =
  | { ok: true; data: T }
  | { ok: false; error: string };

function fail(e: unknown): ActionResult<never> {
  return { ok: false, error: e instanceof Error ? e.message : 'Failed' };
}

export type PackageUpdate = {
  name: string;
  current: string;
  latest: string;
  isVarka: boolean;
};

/**
 * Check npm registry for latest versions of installed packages.
 * Returns list of packages with available updates.
 */
export async function checkUpdatesAction(): Promise<
  ActionResult<{ packages: PackageUpdate[]; checkedAt: string }>
> {
  try {
    await requireServerAuth('settings.update');

    // Key packages to check (varka workspace + major deps)
    const toCheck = [
      // Varka packages
      '@varka/content',
      '@varka/media',
      '@varka/auth',
      '@varka/seo',
      '@varka/i18n',
      '@varka/permissions',
      // Major dependencies
      'next',
      'react',
      'prisma',
      '@prisma/client',
    ];

    const packages: PackageUpdate[] = [];

    for (const name of toCheck) {
      try {
        // Get installed version from package.json
        let current = 'unknown';
        try {
          // eslint-disable-next-line @typescript-eslint/no-require-imports
          const pkg = require(`${name}/package.json`);
          current = pkg.version || 'unknown';
        } catch {
          // Try reading from node_modules directly
          const { readFileSync } = await import('fs');
          const { join } = await import('path');
          try {
            const pkgPath = join(process.cwd(), 'node_modules', name, 'package.json');
            const pkgJson = JSON.parse(readFileSync(pkgPath, 'utf-8'));
            current = pkgJson.version || 'unknown';
          } catch {
            // Not installed or not found
          }
        }

        // Get latest from npm registry
        const res = await fetch(`https://registry.npmjs.org/${name}/latest`, {
          next: { revalidate: 3600 },
        });
        if (!res.ok) continue;
        const data = await res.json();
        const latest = data.version || 'unknown';

        if (current !== 'unknown' && latest !== 'unknown' && current !== latest) {
          packages.push({
            name,
            current,
            latest,
            isVarka: name.startsWith('@varka/'),
          });
        }
      } catch {
        // Skip packages that fail to check
        continue;
      }
    }

    return {
      ok: true,
      data: { packages, checkedAt: new Date().toISOString() },
    };
  } catch (e) {
    return fail(e);
  }
}

/**
 * Get current application version info.
 */
export async function getAppVersionAction(): Promise<
  ActionResult<{ version: string; commit?: string }>
> {
  try {
    await requireServerAuth('settings.read');
    let version = '1.0.0';
    let commit: string | undefined;
    try {
      const { readFileSync } = await import('fs');
      const { join } = await import('path');
      const pkgJson = JSON.parse(
        readFileSync(join(process.cwd(), 'package.json'), 'utf-8'),
      );
      version = pkgJson.version || version;
    } catch {
      // ignore
    }
    try {
      const { execSync } = await import('child_process');
      commit = execSync('git rev-parse --short HEAD', { cwd: process.cwd() })
        .toString()
        .trim();
    } catch {
      // Not a git repo or git not available
    }
    return { ok: true, data: { version, commit } };
  } catch (e) {
    return fail(e);
  }
}
