#!/usr/bin/env tsx
/**
 * celebrtiy.com → VARKA WordPress REST importer.
 *
 * Pulls the PUBLIC read-only WordPress REST API of https://celebrtiy.com/wp-json/wp/v2/
 * (categories, tags, posts, pages, media) into the VARKA PostgreSQL database via
 * Prisma 7 (driver adapter, same bootstrap pattern as packages/database/prisma/seed.ts).
 *
 * What it does
 *  - Upserts Site (slug "varka") and the default English Language row.
 *  - Imports WP categories (with parent hierarchy) → Category + CategoryTranslation.
 *  - Imports WP tags → Tag + TagTranslation.
 *  - Imports WP posts/pages → Post + PostTranslation / Page + PageTranslation,
 *    with WP status mapping (publish→PUBLISHED, draft→DRAFT, pending→PENDING_REVIEW,
 *    future→SCHEDULED, private→DRAFT) and publishedAt from the WP date.
 *  - Creates minimal User + AuthorProfile rows for WP authors (from _embedded.author)
 *    and links Post.authorProfileId.
 *  - Downloads featured images + every celebrtiy.com image referenced inside content
 *    HTML into local storage (same key/URL scheme as the @varka/media local adapter:
 *    files under LOCAL_STORAGE_PATH, served as <MEDIA_PUBLIC_URL>/<key>, default
 *    "/api/media/file" which apps/admin serves at /api/media/file/[...key]).
 *    MediaAsset rows are created with storage='local'. NO hotlinking: celebrtiy.com
 *    image URLs in contentHtml are rewritten to the local public URLs.
 *  - Upserts SiteSetting rows: theme.active='theme-11',
 *    site.tagline='The Private Lives Of Public Figures', site.footer_text (© <year> …),
 *    site.more_info_title + site.more_info (homepage MORE INFO block).
 *
 * Idempotency
 *  - Posts/pages/categories/tags upsert on the schema unique (languageId, slug).
 *  - MediaAsset skips download when (siteId, key) already exists; the storage key is
 *    derived deterministically from the WP media id (wp-import/YYYY/MM/wp-<id>-<file>).
 *  - Post↔category / post↔tag links are rebuilt per post (deleteMany + createMany
 *    skipDuplicates). Re-running the script updates rows instead of duplicating.
 *
 * Polite fetching: ~250ms between HTTP requests, 3 retries with backoff, 30s timeout.
 *
 * Usage (repo root):
 *   pnpm db:import:celebrtiy
 *
 * Env (repo-root .env):
 *   DATABASE_URL            required; must point at a LOCAL/DEV database unless
 *                           IMPORT_ALLOW_REMOTE_DB=1 is set (the script refuses
 *                           non-localhost hosts otherwise).
 *   LOCAL_STORAGE_PATH      where downloaded media files are written (default
 *                           ".storage" under the repo root). Should match the
 *                           value used by apps/admin.
 *   MEDIA_PUBLIC_URL        public URL prefix for stored media (default
 *                           "/api/media/file"). Should match apps/admin.
 *   WP_BASE_URL             override the WP REST base (default
 *                           https://celebrtiy.com/wp-json/wp/v2).
 *   IMPORT_SITE_SLUG        target site slug (default "varka").
 *
 * Requires: pnpm install completed (pg, @prisma/client, @prisma/adapter-pg come
 * from packages/database), Node >= 22.
 */

import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { mkdir, writeFile, rm } from 'node:fs/promises';
import { existsSync } from 'node:fs';

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(SCRIPT_DIR, '..', '..');
// Anchor module resolution at packages/database so pg/@prisma/* resolve from the
// workspace package no matter where this script file lives.
const DB_PKG_JSON = path.resolve(REPO_ROOT, 'packages', 'database', 'package.json');
const requireDb = createRequire(DB_PKG_JSON);

// ---------------------------------------------------------------------------
// Env
// ---------------------------------------------------------------------------

function loadRootEnv(): void {
  const candidates = [
    path.resolve(REPO_ROOT, '.env'),
    path.resolve(process.cwd(), '.env'),
    path.resolve(process.cwd(), '../../.env'),
  ];
  for (const file of candidates) {
    if (existsSync(file)) {
      process.loadEnvFile(file);
      console.log(`[env] loaded ${file}`);
      return;
    }
  }
  console.log('[env] no .env found; using process environment');
}
loadRootEnv();

const WP_BASE = (process.env.WP_BASE_URL ?? 'https://celebrtiy.com/wp-json/wp/v2').replace(/\/$/, '');
const SITE_SLUG = process.env.IMPORT_SITE_SLUG ?? 'varka';
const REQUEST_DELAY_MS = 250;
const REQUEST_TIMEOUT_MS = 30_000;
const MAX_RETRIES = 3;

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('ERROR: DATABASE_URL is not set. Put it in the repository root .env file.');
  process.exit(1);
}

// Safety: refuse to write to a non-local database unless explicitly allowed.
{
  let host = '';
  try {
    host = new URL(DATABASE_URL).hostname.toLowerCase();
  } catch {
    /* ignore */
  }
  const isLocal = host === '' || host === 'localhost' || host === '127.0.0.1' || host === '::1';
  if (!isLocal && process.env.IMPORT_ALLOW_REMOTE_DB !== '1') {
    console.error(
      `ERROR: DATABASE_URL host "${host}" does not look like a local/dev database.\n` +
        'Refusing to import. If this is intentional, set IMPORT_ALLOW_REMOTE_DB=1.',
    );
    process.exit(1);
  }
}

const STORAGE_ROOT = path.resolve(REPO_ROOT, process.env.LOCAL_STORAGE_PATH ?? '.storage');
const MEDIA_PUBLIC_BASE = (process.env.MEDIA_PUBLIC_URL ?? '/api/media/file').replace(/\/$/, '');
const TMP_DIR = path.join('/tmp', `wp-import-celebrtiy-${process.pid}`);

// ---------------------------------------------------------------------------
// Prisma bootstrap (mirrors packages/database/prisma/seed.ts)
// ---------------------------------------------------------------------------

const { PrismaClient } = requireDb('@prisma/client') as { PrismaClient: new (args?: unknown) => any };
const { Pool } = requireDb('pg') as { Pool: new (cfg: unknown) => any };
const { PrismaPg } = requireDb('@prisma/adapter-pg') as { PrismaPg: new (pool: unknown) => unknown };

function createPool(url: string): any {
  const needsSsl =
    url.includes('sslmode=') ||
    url.includes('db.prisma.io') ||
    url.includes('amazonaws.com') ||
    url.includes('neon.tech') ||
    url.includes('supabase');
  return new Pool({
    connectionString: url,
    connectionTimeoutMillis: 15_000,
    idleTimeoutMillis: 10_000,
    max: 4,
    ...(needsSsl ? { ssl: { rejectUnauthorized: false } } : {}),
  });
}

const pool = createPool(DATABASE_URL);
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

// ---------------------------------------------------------------------------
// HTTP helpers (polite: delay + retries + timeout)
// ---------------------------------------------------------------------------

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));
let lastRequestAt = 0;

async function politeDelay(): Promise<void> {
  const elapsed = Date.now() - lastRequestAt;
  if (elapsed < REQUEST_DELAY_MS) await sleep(REQUEST_DELAY_MS - elapsed);
  lastRequestAt = Date.now();
}

async function fetchWithRetry(url: string): Promise<Response> {
  let attempt = 0;
  for (;;) {
    attempt += 1;
    await politeDelay();
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), REQUEST_TIMEOUT_MS);
    try {
      const res = await fetch(url, {
        signal: ctrl.signal,
        headers: { 'User-Agent': 'VARKA-wp-import/1.0 (+https://celebrtiy.com)' },
      });
      if (!res.ok) {
        const body = await res.text().catch(() => '');
        throw new Error(`HTTP ${res.status} ${res.statusText} — ${body.slice(0, 200)}`);
      }
      return res;
    } catch (err) {
      if (attempt >= MAX_RETRIES) throw err;
      const backoff = 1000 * 2 ** (attempt - 1);
      console.warn(`[http] retry ${attempt}/${MAX_RETRIES} in ${backoff}ms: ${url} (${(err as Error).message})`);
      await sleep(backoff);
    } finally {
      clearTimeout(timer);
    }
  }
}

async function wpGetJson<T>(url: string): Promise<{ data: T; totalPages: number; total: number }> {
  const res = await fetchWithRetry(url);
  const data = (await res.json()) as T;
  return {
    data,
    totalPages: Number(res.headers.get('x-wp-totalpages') ?? 1),
    total: Number(res.headers.get('x-wp-total') ?? (Array.isArray(data) ? data.length : 0)),
  };
}

async function wpGetAll<T>(endpoint: string, fields: string, extra = ''): Promise<T[]> {
  const perPage = 100;
  const first = await wpGetJson<T[]>(
    `${WP_BASE}${endpoint}?per_page=${perPage}&page=1&_fields=${fields}${extra}`,
  );
  const items = [...first.data];
  for (let page = 2; page <= first.totalPages; page += 1) {
    const { data } = await wpGetJson<T[]>(
      `${WP_BASE}${endpoint}?per_page=${perPage}&page=${page}&_fields=${fields}${extra}`,
    );
    items.push(...data);
  }
  return items;
}

// ---------------------------------------------------------------------------
// Small text utils
// ---------------------------------------------------------------------------

const ENTITY_MAP: Record<string, string> = {
  '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&#039;': "'",
  '&#39;': "'", '&nbsp;': ' ', '&hellip;': '…', '&#8230;': '…',
  '&#8217;': '’', '&#8216;': '‘', '&#8220;': '“', '&#8221;': '”',
  '&#8211;': '–', '&#8212;': '—',
};

function decodeEntities(s: string): string {
  return s
    .replace(/&(?:amp|lt|gt|quot|nbsp|hellip);|&#0?39;|&#8\d{3};/g, (m) => ENTITY_MAP[m] ?? m)
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)));
}

function stripTags(html: string): string {
  return decodeEntities(html.replace(/<[^>]*>/g, ' '))
    .replace(/\s+/g, ' ')
    .trim();
}

function cleanExcerpt(rendered: string): string {
  let t = stripTags(rendered);
  t = t.replace(/\s*\[…\]$/, '').replace(/\s*…$/, '').trim();
  return t;
}

function safeFilename(name: string): string {
  const base = path.basename(name.split('?')[0]);
  return (base.replace(/[^a-zA-Z0-9._-]+/g, '_').slice(0, 180) || 'file').toLowerCase();
}

// ---------------------------------------------------------------------------
// Local storage helpers (same key/URL scheme as @varka/media local adapter)
// ---------------------------------------------------------------------------

function publicUrlForKey(key: string): string {
  return `${MEDIA_PUBLIC_BASE}/${key.replace(/^\/+/, '')}`;
}

async function putLocalFile(key: string, body: Buffer): Promise<string> {
  const normalized = key.replace(/^\/+/, '').replace(/\.\./g, '');
  const full = path.resolve(STORAGE_ROOT, normalized);
  if (!full.startsWith(STORAGE_ROOT)) throw new Error(`Invalid key path: ${key}`);
  await mkdir(path.dirname(full), { recursive: true });
  await writeFile(full, body);
  return normalized;
}

// ---------------------------------------------------------------------------
// WP payload types
// ---------------------------------------------------------------------------

type WpRendered = { rendered: string };
type WpTerm = { id: number; slug: string; name: string; description?: string; parent?: number };
type WpAuthor = { id: number; name: string; slug: string; description?: string };
type WpMediaSize = { source_url: string; width: number; height: number; mime_type: string };
type WpMedia = {
  id: number;
  slug: string;
  source_url: string;
  alt_text?: string;
  caption?: WpRendered;
  mime_type: string;
  media_details?: { width?: number; height?: number; sizes?: Record<string, WpMediaSize> };
};
type WpPost = {
  id: number;
  slug: string;
  status: string;
  date: string;
  modified: string;
  title: WpRendered;
  content: WpRendered;
  excerpt: WpRendered;
  featured_media: number;
  categories: number[];
  tags: number[];
  author: number;
  comment_status?: string;
  parent?: number;
  _embedded?: { author?: WpAuthor[] };
};

// ---------------------------------------------------------------------------
// In-memory WP-id → VARKA-id maps (per run; DB uniques make re-runs safe)
// ---------------------------------------------------------------------------

const catIdByWp = new Map<number, string>();
const tagIdByWp = new Map<number, string>();
const authorProfileIdByWp = new Map<number, string>();
const mediaByWpId = new Map<number, WpMedia>();
/** normalized source_url (https) → local public URL */
const localUrlBySource = new Map<string, string>();
/** wp media id → { assetId, url } */
const mediaAssetByWpId = new Map<number, { assetId: string; url: string }>();

function normalizeUrl(u: string): string {
  // WP sometimes emits double slashes in paths (https://host//wp-content//uploads//…)
  return u
    .trim()
    .replace(/^http:\/\//i, 'https://')
    .replace(/([^:])\/{2,}/g, '$1/');
}

// ---------------------------------------------------------------------------
// Site / language
// ---------------------------------------------------------------------------

async function ensureSite() {
  const site = await prisma.site.upsert({
    where: { slug: SITE_SLUG },
    update: {},
    create: { name: 'Celebrtiy', slug: SITE_SLUG },
  });
  return site as { id: string; slug: string };
}

async function ensureLanguage(siteId: string) {
  const existingDefault = await prisma.language.findFirst({ where: { siteId, defaultLanguage: true } });
  if (existingDefault) return existingDefault as { id: string; locale: string };
  const lang = await prisma.language.upsert({
    where: { siteId_locale: { siteId, locale: 'en' } },
    update: { defaultLanguage: true, enabled: true },
    create: {
      siteId,
      name: 'English',
      nativeName: 'English',
      locale: 'en',
      languageCode: 'en',
      script: 'Latn',
      direction: 'ltr',
      enabled: true,
      defaultLanguage: true,
      urlPrefix: '',
      displayOrder: 0,
    },
  });
  return lang as { id: string; locale: string };
}

// ---------------------------------------------------------------------------
// Authors → User + AuthorProfile
// ---------------------------------------------------------------------------

async function ensureAuthorProfile(siteId: string, wp: WpAuthor): Promise<string> {
  const hit = authorProfileIdByWp.get(wp.id);
  if (hit) return hit;
  const slug = (wp.slug || `author-${wp.id}`).toLowerCase();
  const email = `wp-author-${wp.id}@celebrtiy.local`;

  let user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    user = await prisma.user.create({
      data: {
        email,
        name: wp.name || slug,
        emailVerified: false,
        siteId,
        bio: wp.description ? stripTags(wp.description).slice(0, 2000) : null,
        disabled: true, // imported author stub — cannot log in
      },
    });
  }
  const profile = await prisma.authorProfile.upsert({
    where: { siteId_slug: { siteId, slug } },
    update: { displayName: wp.name || slug, bio: user.bio },
    create: {
      siteId,
      userId: (user as { id: string }).id,
      slug,
      displayName: wp.name || slug,
      bio: (user as { bio: string | null }).bio,
    },
  });
  const id = (profile as { id: string }).id;
  authorProfileIdByWp.set(wp.id, id);
  return id;
}

// ---------------------------------------------------------------------------
// Categories / tags
// ---------------------------------------------------------------------------

async function importCategories(siteId: string, languageId: string): Promise<void> {
  const terms = await wpGetAll<WpTerm>('/categories', 'id,slug,name,description,parent', '&orderby=id&order=asc&hide_empty=0');
  console.log(`[categories] fetched ${terms.length}`);

  // Pass 1: create Category + translation rows
  for (const t of terms) {
    const slug = (t.slug || `category-${t.id}`).toLowerCase();
    const existingTr = await prisma.categoryTranslation.findUnique({
      where: { languageId_slug: { languageId, slug } },
      include: { category: true },
    });
    let categoryId: string;
    if (existingTr) {
      categoryId = (existingTr as any).categoryId;
      await prisma.categoryTranslation.update({
        where: { id: (existingTr as { id: string }).id },
        data: { name: decodeEntities(t.name), description: t.description ? stripTags(t.description) : null },
      });
    } else {
      const cat = await prisma.category.create({ data: { siteId } });
      categoryId = (cat as { id: string }).id;
      await prisma.categoryTranslation.create({
        data: {
          categoryId,
          languageId,
          name: decodeEntities(t.name),
          slug,
          description: t.description ? stripTags(t.description) : null,
        },
      });
    }
    catIdByWp.set(t.id, categoryId);
  }

  // Pass 2: parent hierarchy
  let linked = 0;
  for (const t of terms) {
    if (!t.parent) continue;
    const childId = catIdByWp.get(t.id);
    const parentId = catIdByWp.get(t.parent);
    if (childId && parentId && childId !== parentId) {
      await prisma.category.update({ where: { id: childId }, data: { parentId } });
      linked += 1;
    }
  }
  console.log(`[categories] upserted ${terms.length}, parent links set: ${linked}`);
}

async function importTags(siteId: string, languageId: string): Promise<void> {
  const terms = await wpGetAll<WpTerm>('/tags', 'id,slug,name,description', '&orderby=id&order=asc&hide_empty=0');
  console.log(`[tags] fetched ${terms.length}`);
  for (const t of terms) {
    const slug = (t.slug || `tag-${t.id}`).toLowerCase();
    const existingTr = await prisma.tagTranslation.findUnique({
      where: { languageId_slug: { languageId, slug } },
    });
    let tagId: string;
    if (existingTr) {
      tagId = (existingTr as any).tagId;
      await prisma.tagTranslation.update({
        where: { id: (existingTr as { id: string }).id },
        data: { name: decodeEntities(t.name) },
      });
    } else {
      const tag = await prisma.tag.create({ data: { siteId } });
      tagId = (tag as { id: string }).id;
      await prisma.tagTranslation.create({ data: { tagId, languageId, name: decodeEntities(t.name), slug } });
    }
    tagIdByWp.set(t.id, tagId);
  }
  console.log(`[tags] upserted ${terms.length}`);
}

// ---------------------------------------------------------------------------
// Media: index, download, store, MediaAsset rows
// ---------------------------------------------------------------------------

async function importMediaIndex(): Promise<void> {
  const items = await wpGetAll<WpMedia>(
    '/media',
    'id,slug,source_url,alt_text,caption,mime_type,media_details',
    '&orderby=id&order=asc',
  );
  for (const m of items) mediaByWpId.set(m.id, m);
  console.log(`[media] indexed ${items.length} items`);
}

function mediaKeyFor(wp: WpMedia): string {
  const d = new Date();
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const fname = safeFilename(wp.source_url || `${wp.slug || 'media'}.jpg`);
  return `wp-import/${y}/${m}/wp-${wp.id}-${fname}`;
}

async function downloadToTemp(url: string): Promise<{ file: string; bytes: Buffer; mime: string }> {
  await mkdir(TMP_DIR, { recursive: true });
  const res = await fetchWithRetry(url);
  const mime = (res.headers.get('content-type') ?? '').split(';')[0].trim().toLowerCase();
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length === 0) throw new Error('empty download');
  if (buf.length > 25 * 1024 * 1024) throw new Error('file too large (>25MB)');
  const file = path.join(TMP_DIR, `${createHash('sha1').update(url).digest('hex')}.bin`);
  await writeFile(file, buf);
  return { file, bytes: buf, mime };
}

/** Ensure a MediaAsset for a WP media item; downloads + stores on first run. */
async function ensureMediaAsset(siteId: string, wp: WpMedia): Promise<{ assetId: string; url: string } | null> {
  const hit = mediaAssetByWpId.get(wp.id);
  if (hit) return hit;
  const key = mediaKeyFor(wp);

  const existing = await prisma.mediaAsset.findUnique({
    where: { siteId_key: { siteId, key } },
  });
  if (existing) {
    const row = existing as { id: string };
    const out = { assetId: row.id, url: publicUrlForKey(key) };
    mediaAssetByWpId.set(wp.id, out);
    registerSourceUrls(wp, out.url);
    return out;
  }

  if (!wp.mime_type.startsWith('image/')) {
    console.log(`[media] skip non-image ${wp.id} (${wp.mime_type})`);
    return null;
  }

  try {
    const { bytes, mime } = await downloadToTemp(normalizeUrl(wp.source_url));
    const storedKey = await putLocalFile(key, bytes);
    const url = publicUrlForKey(storedKey);
    const created = (await prisma.mediaAsset.create({
      data: {
        siteId,
        storage: 'local',
        key: storedKey,
        filename: safeFilename(wp.source_url),
        mimeType: wp.mime_type || mime || 'application/octet-stream',
        sizeBytes: bytes.length,
        width: wp.media_details?.width ?? null,
        height: wp.media_details?.height ?? null,
        alt: wp.alt_text ? decodeEntities(wp.alt_text).slice(0, 500) : null,
        title: decodeEntities(wp.slug || `wp-${wp.id}`).slice(0, 300),
        caption: wp.caption?.rendered ? stripTags(wp.caption.rendered).slice(0, 2000) : null,
        folder: '/wp-import',
        checksum: createHash('sha256').update(bytes).digest('hex'),
      },
    })) as { id: string };
    const out = { assetId: created.id, url };
    mediaAssetByWpId.set(wp.id, out);
    registerSourceUrls(wp, url);
    console.log(`[media] stored wp:${wp.id} → ${url}`);
    return out;
  } catch (err) {
    console.warn(`[media] failed wp:${wp.id} ${wp.source_url}: ${(err as Error).message}`);
    return null;
  }
}

function registerSourceUrls(wp: WpMedia, localUrl: string): void {
  localUrlBySource.set(normalizeUrl(wp.source_url), localUrl);
  const sizes = wp.media_details?.sizes;
  if (sizes) {
    for (const s of Object.values(sizes)) {
      if (s?.source_url) localUrlBySource.set(normalizeUrl(s.source_url), localUrl);
    }
  }
}

async function ensureMediaAssetById(siteId: string, wpMediaId: number): Promise<{ assetId: string; url: string } | null> {
  if (!wpMediaId) return null;
  let wp = mediaByWpId.get(wpMediaId);
  if (!wp) {
    // Not in the index (e.g. trashed) — fetch directly.
    try {
      const { data } = await wpGetJson<WpMedia>(
        `${WP_BASE}/media/${wpMediaId}?_fields=id,slug,source_url,alt_text,caption,mime_type,media_details`,
      );
      wp = data;
      mediaByWpId.set(wp.id, wp);
    } catch (err) {
      console.warn(`[media] could not fetch wp media ${wpMediaId}: ${(err as Error).message}`);
      return null;
    }
  }
  return ensureMediaAsset(siteId, wp);
}

// ---------------------------------------------------------------------------
// Content HTML URL rewriting (no hotlinking)
// ---------------------------------------------------------------------------

const CELEBRTIY_URL_RE = /https?:\/\/celebrtiy\.com[^\s"'()<>\\]+/gi;

async function rewriteContentUrls(siteId: string, html: string): Promise<{ html: string; replaced: number; missing: number }> {
  let replaced = 0;
  let missing = 0;
  const urls = new Set<string>();
  for (const m of html.matchAll(CELEBRTIY_URL_RE)) {
    const u = m[0].replace(/[.,;:!?]+$/, ''); // trailing punctuation from prose
    if (/\.(jpe?g|png|webp|gif|avif|svg)(\?.*)?$/i.test(u) || /wp-content\/+uploads/.test(u)) urls.add(u);
  }
  for (const raw of urls) {
    const norm = normalizeUrl(raw);
    let local = localUrlBySource.get(norm);
    if (!local) {
      // Find the WP media item by source_url (or a resized variant) and download it now.
      const wp = [...mediaByWpId.values()].find(
        (c) =>
          normalizeUrl(c.source_url) === norm ||
          Object.values(c.media_details?.sizes ?? {}).some((s) => s?.source_url && normalizeUrl(s.source_url) === norm),
      );
      if (wp) {
        const ensured = await ensureMediaAsset(siteId, wp);
        local = ensured?.url ?? undefined;
      }
    }
    if (local) {
      html = html.split(raw).join(local);
      replaced += 1;
    } else {
      missing += 1;
    }
  }
  return { html, replaced, missing };
}

// ---------------------------------------------------------------------------
// Status mapping
// ---------------------------------------------------------------------------

function mapStatus(wpStatus: string): 'DRAFT' | 'PENDING_REVIEW' | 'SCHEDULED' | 'PUBLISHED' {
  switch (wpStatus) {
    case 'publish':
      return 'PUBLISHED';
    case 'pending':
      return 'PENDING_REVIEW';
    case 'future':
      return 'SCHEDULED';
    default:
      return 'DRAFT'; // draft, private, trash, …
  }
}

// ---------------------------------------------------------------------------
// Posts
// ---------------------------------------------------------------------------

async function importPosts(siteId: string, languageId: string): Promise<void> {
  const posts = await wpGetAll<WpPost>(
    '/posts',
    'id,slug,status,date,modified,title,content,excerpt,featured_media,categories,tags,author,comment_status,_embedded',
    '&orderby=id&order=asc&status=publish,draft,pending,future,private&_embed=author',
  );
  console.log(`[posts] fetched ${posts.length}`);

  let created = 0;
  let updated = 0;
  for (const p of posts) {
    const slug = (p.slug || `post-${p.id}`).toLowerCase();
    const status = mapStatus(p.status);
    const title = decodeEntities(stripTags(p.title?.rendered ?? `Post ${p.id}`)) || `Post ${p.id}`;
    const excerpt = cleanExcerpt(p.excerpt?.rendered ?? '');
    const { html: contentHtml } = await rewriteContentUrls(siteId, p.content?.rendered ?? '');

    const wpAuthor = p._embedded?.author?.[0];
    const authorProfileId = wpAuthor ? await ensureAuthorProfile(siteId, wpAuthor) : null;
    const featured = p.featured_media ? await ensureMediaAssetById(siteId, p.featured_media) : null;

    const postData = {
      siteId,
      authorProfileId,
      featuredImageId: featured?.assetId ?? null,
      status,
      publishedAt: p.status === 'publish' && p.date ? new Date(p.date) : null,
      commentsEnabled: p.comment_status !== 'closed',
    };

    const existingTr = await prisma.postTranslation.findUnique({
      where: { languageId_slug: { languageId, slug } },
    });
    let postId: string;
    if (existingTr) {
      postId = (existingTr as any).postId;
      await prisma.post.update({ where: { id: postId }, data: postData });
      await prisma.postTranslation.update({
        where: { id: (existingTr as { id: string }).id },
        data: { title, slug, excerpt: excerpt || null, contentHtml, status },
      });
      updated += 1;
    } else {
      const post = (await prisma.post.create({ data: postData })) as { id: string };
      postId = post.id;
      await prisma.postTranslation.create({
        data: { postId, languageId, title, slug, excerpt: excerpt || null, contentHtml, status },
      });
      created += 1;
    }

    // Relations (rebuild — idempotent)
    const categoryIds = (p.categories ?? []).map((id) => catIdByWp.get(id)).filter((x): x is string => !!x);
    const tagIds = (p.tags ?? []).map((id) => tagIdByWp.get(id)).filter((x): x is string => !!x);
    await prisma.postCategory.deleteMany({ where: { postId } });
    if (categoryIds.length) {
      await prisma.postCategory.createMany({
        data: categoryIds.map((categoryId) => ({ postId, categoryId })),
        skipDuplicates: true,
      });
    }
    await prisma.postTag.deleteMany({ where: { postId } });
    if (tagIds.length) {
      await prisma.postTag.createMany({
        data: tagIds.map((tagId) => ({ postId, tagId })),
        skipDuplicates: true,
      });
    }

    if ((created + updated) % 25 === 0) console.log(`[posts] progress ${created + updated}/${posts.length}`);
  }
  console.log(`[posts] done — created ${created}, updated ${updated}`);
}

// ---------------------------------------------------------------------------
// Pages
// ---------------------------------------------------------------------------

async function importPages(siteId: string, languageId: string): Promise<void> {
  const pages = await wpGetAll<WpPost>(
    '/pages',
    'id,slug,status,date,modified,title,content,excerpt,featured_media,parent,author,comment_status,_embedded',
    '&orderby=id&order=asc&status=publish,draft,pending,future,private&_embed=author',
  );
  console.log(`[pages] fetched ${pages.length}: ${pages.map((p) => p.slug).join(', ')}`);

  const pageIdByWp = new Map<number, string>();

  // Pass 1: upsert pages + translations
  for (const p of pages) {
    const slug = (p.slug || `page-${p.id}`).toLowerCase();
    const status = mapStatus(p.status);
    const title = decodeEntities(stripTags(p.title?.rendered ?? `Page ${p.id}`)) || `Page ${p.id}`;
    const { html: contentHtml } = await rewriteContentUrls(siteId, p.content?.rendered ?? '');
    const wpAuthor = p._embedded?.author?.[0];
    const authorProfileId = wpAuthor ? await ensureAuthorProfile(siteId, wpAuthor) : null;

    const pageData = {
      siteId,
      status,
      publishedAt: p.status === 'publish' && p.date ? new Date(p.date) : null,
    };

    const existingTr = await prisma.pageTranslation.findUnique({
      where: { languageId_slug: { languageId, slug } },
    });
    let pageId: string;
    if (existingTr) {
      pageId = (existingTr as any).pageId;
      await prisma.page.update({ where: { id: pageId }, data: pageData });
      await prisma.pageTranslation.update({
        where: { id: (existingTr as { id: string }).id },
        data: { title, slug, contentHtml, status },
      });
    } else {
      const page = (await prisma.page.create({ data: pageData })) as { id: string };
      pageId = page.id;
      await prisma.pageTranslation.create({
        data: { pageId, languageId, title, slug, contentHtml, status },
      });
    }
    // Note: Page has no authorProfile relation in the schema; keep author info on pages
    // via the shared ensureAuthorProfile map only where linked (posts).
    void authorProfileId;
    pageIdByWp.set(p.id, pageId);
  }

  // Pass 2: parent hierarchy
  let linked = 0;
  for (const p of pages) {
    if (!p.parent) continue;
    const childId = pageIdByWp.get(p.id);
    const parentId = pageIdByWp.get(p.parent);
    if (childId && parentId && childId !== parentId) {
      await prisma.page.update({ where: { id: childId }, data: { parentId } });
      linked += 1;
    }
  }
  console.log(`[pages] upserted ${pages.length}, parent links set: ${linked}`);
}

// ---------------------------------------------------------------------------
// Site settings
// ---------------------------------------------------------------------------

async function upsertSiteSettings(siteId: string): Promise<void> {
  const year = new Date().getFullYear();
  const rows: Array<[string, unknown]> = [
    ['theme.active', 'theme-11'],
    ['site.tagline', 'The Private Lives Of Public Figures'],
    ['site.footer_text', `© ${year} Celebrtiy | The Private Lives Of Public Figures - All Rights Reserved.`],
    ['site.more_info_title', 'MORE INFO'],
    [
      'site.more_info',
      'Our writers research trending celebrities to cover them on our website. If you want to know about your ideal celebrity and we do not cover them yet, you can contact us by email at celebrtiy@gmail.com. We will consider your feedback and respond within a few hours. You can also share your feedback by commenting below on our articles.',
    ],
  ];
  for (const [key, value] of rows) {
    await prisma.siteSetting.upsert({
      where: { siteId_key: { siteId, key } },
      update: { value },
      create: { siteId, key, value },
    });
  }
  console.log('[settings] upserted theme.active, site.tagline, site.footer_text, site.more_info*');
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  console.log(`[import] source: ${WP_BASE}`);
  console.log(`[import] storage root: ${STORAGE_ROOT}`);
  console.log(`[import] media public base: ${MEDIA_PUBLIC_BASE}`);

  await pool.query('select 1 as ok');
  console.log('[import] database connection OK');

  const site = await ensureSite();
  console.log(`[import] site: ${site.slug} (${site.id})`);
  const language = await ensureLanguage(site.id);
  console.log(`[import] language: ${language.locale} (${language.id})`);

  await importCategories(site.id, language.id);
  await importTags(site.id, language.id);
  await importMediaIndex();
  await importPosts(site.id, language.id);
  await importPages(site.id, language.id);
  await upsertSiteSettings(site.id);

  await rm(TMP_DIR, { recursive: true, force: true });
  console.log('[import] complete');
}

main()
  .catch((err) => {
    console.error('[import] FAILED:', err);
    process.exit(1);
  })
  .finally(async () => {
    try {
      await prisma.$disconnect();
    } catch {
      /* ignore */
    }
    try {
      await pool.end();
    } catch {
      /* ignore */
    }
  });
