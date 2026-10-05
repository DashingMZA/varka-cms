/**
 * wordpress-import plugin — API handlers.
 *
 * Mounted by the VARKA admin at /api/plugins/wordpress-import/*.
 * Exports HTTP method handlers receiving (req, ctx).
 */
import { NextResponse } from 'next/server';
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { runWordPressImport } from '@varka/content';
import { prisma } from '@varka/database';

type Ctx = { params: { slug: string; path: string[] } };

type ImportStatus = {
  state: 'idle' | 'running' | 'done' | 'error';
  startedAt?: string;
  finishedAt?: string;
  message?: string;
  log?: string[];
};

function pluginDir(): string {
  return (
    process.env.VARKA_PLUGIN_DIR ?? path.join(process.cwd(), 'plugins', 'wordpress-import')
  );
}

function storageRoot(): string {
  const p = process.env.LOCAL_STORAGE_PATH ?? './public/uploads';
  return path.isAbsolute(p) ? p : path.join(process.cwd(), p);
}

async function readStatus(): Promise<ImportStatus> {
  try {
    return JSON.parse(
      await readFile(path.join(pluginDir(), 'import-status.json'), 'utf8'),
    ) as ImportStatus;
  } catch {
    return { state: 'idle' };
  }
}

async function writeStatus(s: ImportStatus): Promise<void> {
  await writeFile(
    path.join(pluginDir(), 'import-status.json'),
    JSON.stringify(s, null, 2),
    'utf8',
  );
}

function pushLog(s: ImportStatus, msg: string): void {
  const log = s.log ?? [];
  log.push(`[${new Date().toISOString()}] ${msg}`);
  s.log = log.slice(-200);
}

function wpBaseFromUrl(input: string): string {
  const u = new URL(input.trim());
  return `${u.origin}/wp-json/wp/v2`;
}

async function parseForm(req: Request): Promise<{ wpUrl: string; wpUsername: string; wpAppPassword: string }> {
  const ct = req.headers.get('content-type') ?? '';
  if (ct.includes('application/json')) {
    const j = (await req.json().catch(() => ({}))) as Record<string, string>;
    return {
      wpUrl: j.wpUrl ?? '',
      wpUsername: j.wpUsername ?? '',
      wpAppPassword: j.wpAppPassword ?? '',
    };
  }
  const fd = await req.formData();
  return {
    wpUrl: String(fd.get('wpUrl') ?? ''),
    wpUsername: String(fd.get('wpUsername') ?? ''),
    wpAppPassword: String(fd.get('wpAppPassword') ?? ''),
  };
}

function wantsHtml(req: Request): boolean {
  const accept = req.headers.get('accept') ?? '';
  return accept.includes('text/html');
}

export async function GET(req: Request, _ctx: Ctx) {
  const url = new URL(req.url);
  const action = url.searchParams.get('action') ?? 'status';
  if (action === 'status') {
    return NextResponse.json(await readStatus());
  }
  return NextResponse.json({ error: 'unknown action' }, { status: 400 });
}

export async function POST(req: Request, ctx: Ctx) {
  const action = ctx.params.path[0] ?? '';

  if (action === 'test') {
    const { wpUrl } = await parseForm(req);
    if (!wpUrl) {
      return NextResponse.json({ ok: false, error: 'wpUrl is required' }, { status: 400 });
    }
    let base: string;
    try {
      base = wpBaseFromUrl(wpUrl);
    } catch {
      return NextResponse.json({ ok: false, error: 'invalid URL' }, { status: 400 });
    }
    try {
      const res = await fetch(`${base}/types?per_page=1`, {
        headers: { 'User-Agent': 'VARKA-wp-import/1.0' },
        signal: AbortSignal.timeout(15_000),
      });
      if (!res.ok) {
        const msg = `WP API returned HTTP ${res.status}`;
        if (wantsHtml(req)) {
          const back = new URL('/plugins/wordpress-import', req.url);
          back.searchParams.set('testError', msg);
          return NextResponse.redirect(back, 303);
        }
        return NextResponse.json({ ok: false, error: msg }, { status: 502 });
      }
      if (wantsHtml(req)) {
        const back = new URL('/plugins/wordpress-import', req.url);
        back.searchParams.set('tested', '1');
        return NextResponse.redirect(back, 303);
      }
      return NextResponse.json({ ok: true, base });
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'connection failed';
      if (wantsHtml(req)) {
        const back = new URL('/plugins/wordpress-import', req.url);
        back.searchParams.set('testError', msg);
        return NextResponse.redirect(back, 303);
      }
      return NextResponse.json({ ok: false, error: msg }, { status: 502 });
    }
  }

  if (action === 'start') {
    const current = await readStatus();
    if (current.state === 'running') {
      return NextResponse.json({ ok: false, error: 'import already running' }, { status: 409 });
    }
    const { wpUrl, wpUsername, wpAppPassword } = await parseForm(req);
    if (!wpUrl) {
      return NextResponse.json({ ok: false, error: 'wpUrl is required' }, { status: 400 });
    }
    let base: string;
    try {
      base = wpBaseFromUrl(wpUrl);
    } catch {
      return NextResponse.json({ ok: false, error: 'invalid URL' }, { status: 400 });
    }

    const status: ImportStatus = {
      state: 'running',
      startedAt: new Date().toISOString(),
      message: `Importing from ${base}…`,
      log: current.log ?? [],
    };
    pushLog(status, `starting import from ${base}`);
    await writeStatus(status);

    // Run in the background — do not await. Progress goes to the status file.
    void (async () => {
      try {
        await runWordPressImport({
          wpBaseUrl: base,
          wpUsername: wpUsername || undefined,
          wpAppPassword: wpAppPassword || undefined,
          storageRoot: storageRoot(),
          mediaPublicBase: process.env.MEDIA_PUBLIC_URL ?? '/uploads',
          prisma,
          onProgress: (msg) => {
            void (async () => {
              const s = await readStatus();
              pushLog(s, msg);
              await writeStatus(s);
            })();
          },
        });
        const done = await readStatus();
        done.state = 'done';
        done.finishedAt = new Date().toISOString();
        done.message = 'Import completed successfully.';
        pushLog(done, 'import complete');
        await writeStatus(done);
      } catch (e) {
        const failed = await readStatus();
        failed.state = 'error';
        failed.finishedAt = new Date().toISOString();
        failed.message = e instanceof Error ? e.message : 'import failed';
        pushLog(failed, `FAILED: ${failed.message}`);
        await writeStatus(failed);
      }
    })();

    if (wantsHtml(req)) {
      return NextResponse.redirect(new URL('/plugins/wordpress-import', req.url), 303);
    }
    return NextResponse.json({ ok: true, state: 'running' });
  }

  return NextResponse.json({ error: 'unknown action' }, { status: 404 });
}
