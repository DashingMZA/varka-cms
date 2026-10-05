import { NextResponse } from 'next/server';
import { prisma } from '@/lib/server-db';
import { pluginPath } from '@varka/plugins';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

type PluginModule = {
  GET?: (req: Request, ctx: { params: { slug: string; path: string[] } }) => Promise<Response>;
  POST?: (req: Request, ctx: { params: { slug: string; path: string[] } }) => Promise<Response>;
  PUT?: (req: Request, ctx: { params: { slug: string; path: string[] } }) => Promise<Response>;
  DELETE?: (req: Request, ctx: { params: { slug: string; path: string[] } }) => Promise<Response>;
};

async function loadPluginModule(slug: string): Promise<PluginModule | null> {
  if (!/^[a-z0-9-]{2,64}$/.test(slug)) return null;
  const row = await prisma.plugin.findUnique({ where: { slug } }).catch(() => null);
  if (!row?.active) return null;
  const dir = pluginPath(slug);
  let manifest: { slug: string; admin: { entry: string } };
  try {
    manifest = JSON.parse(await readFile(path.join(dir, 'plugin.json'), 'utf8'));
  } catch {
    return null;
  }
  if (manifest.slug !== slug) return null;
  try {
    const entryAbs = path.join(dir, manifest.admin.entry);
    // webpackIgnore: runtime plugin path — must not be bundled at build time.
    return (await import(/* webpackIgnore: true */ entryAbs)) as PluginModule;
  } catch {
    return null;
  }
}

async function dispatch(
  req: Request,
  ctx: { params: Promise<{ slug: string; path: string[] }> },
  method: 'GET' | 'POST' | 'PUT' | 'DELETE',
) {
  const { slug, path: subPath } = await ctx.params;
  const mod = await loadPluginModule(slug);
  const handler = mod?.[method];
  if (!handler) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
  try {
    return await handler(req, { params: { slug, path: subPath } });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Plugin error' },
      { status: 500 },
    );
  }
}

export const GET = (req: Request, ctx: { params: Promise<{ slug: string; path: string[] }> }) =>
  dispatch(req, ctx, 'GET');
export const POST = (req: Request, ctx: { params: Promise<{ slug: string; path: string[] }> }) =>
  dispatch(req, ctx, 'POST');
export const PUT = (req: Request, ctx: { params: Promise<{ slug: string; path: string[] }> }) =>
  dispatch(req, ctx, 'PUT');
export const DELETE = (req: Request, ctx: { params: Promise<{ slug: string; path: string[] }> }) =>
  dispatch(req, ctx, 'DELETE');
