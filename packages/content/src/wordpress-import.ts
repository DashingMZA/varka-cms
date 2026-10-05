/**
 * WordPress REST API → VARKA importer (importable module).
 *
 * Extracted from scripts/wp-import-celebrtiy/import.ts — same logic, but
 * parameterized via WordPressImportConfig instead of env vars, so it can be
 * used by the wordpress-import plugin (or any other caller).
 *
 * Idempotent: re-running updates instead of duplicating (upserts on unique
 * constraints, skips already-downloaded media).
 */

import path from 'node:path';
import { createHash } from 'node:crypto';
import { mkdir, writeFile, rm } from 'node:fs/promises';
import type { PrismaClient } from '@varka/database';

export type WordPressImportConfig = {
  /** WP REST base, e.g. "https://example.com/wp-json/wp/v2" */
  wpBase: string;
  wpUsername?: string;
  wpAppPassword?: string;
  wpHasAuth: boolean;
  wpAuthHeader: string | null;
  wpStatusFilter: string;
  siteSlug: string;
  storageRoot: string;
  mediaPublicBase: string;
  tmpDir: string;
  prisma: PrismaClient;
  /** progress/log sink */
  onProgress: (msg: string) => void;
};

export type WordPressImportOptions = {
  wpBaseUrl: string;
  wpUsername?: string;
  wpAppPassword?: string;
  siteSlug?: string;
  storageRoot: string;
  mediaPublicBase?: string;
  prisma: PrismaClient;
  onProgress?: (msg: string) => void;
};

const REQUEST_DELAY_MS = 250;
const REQUEST_TIMEOUT_MS = 30_000;
const MAX_RETRIES = 3;

export function buildImportConfig(opts: WordPressImportOptions): WordPressImportConfig {
  const wpBase = opts.wpBaseUrl.replace(/\/$/, '');
  const wpUsername = opts.wpUsername ?? '';
  const wpAppPassword = opts.wpAppPassword ?? '';
  const wpHasAuth = wpUsername !== '' && wpAppPassword !== '';
  return {
    wpBase,
    wpUsername,
    wpAppPassword,
    wpHasAuth,
    wpAuthHeader: wpHasAuth
      ? `Basic ${Buffer.from(`${wpUsername}:${wpAppPassword}`).toString('base64')}`
      : null,
    wpStatusFilter: wpHasAuth ? 'publish,draft,pending,future,private' : 'publish',
    siteSlug: opts.siteSlug ?? 'varka',
    storageRoot: opts.storageRoot,
    mediaPublicBase: (opts.mediaPublicBase ?? '/uploads').replace(/\/$/, ''),
    tmpDir: path.join('/tmp', `wp-import-${Date.now()}`),
    prisma: opts.prisma,
    onProgress: opts.onProgress ?? (() => {}),
  };
}

/**
 * Run the full WordPress import. Idempotent — safe to re-run.
 */
export async function runWordPressImport(opts: WordPressImportOptions): Promise<void> {
  const cfg = buildImportConfig(opts);



// ---------------------------------------------------------------------------
// Env
// ---------------------------------------------------------------------------



// asking for draft/pending/future/private without credentials returns
const REQUEST_DELAY_MS = 250;
const REQUEST_TIMEOUT_MS = 30_000;
const MAX_RETRIES = 3;




// ---------------------------------------------------------------------------
// Prisma bootstrap (mirrors packages/database/prisma/seed.ts)
// ---------------------------------------------------------------------------




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
        headers: {
          'User-Agent': 'VARKA-wp-import/1.0 (+https://celebrtiy.com)',
          ...(cfg.wpAuthHeader ? { Authorization: cfg.wpAuthHeader } : {}),
        },
      });
      if (!res.ok) {
        const body = await res.text().catch(() => '');
        throw new Error(`HTTP ${res.status} ${res.statusText} — ${body.slice(0, 200)}`);
      }
      return res;
    } catch (err) {
      if (attempt >= MAX_RETRIES) throw err;
      const backoff = 1000 * 2 ** (attempt - 1);
      cfg.onProgress(`[http] retry ${attempt}/${MAX_RETRIES} in ${backoff}ms: ${url} (${(err as Error).message})`);
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
    `${cfg.wpBase}${endpoint}?per_page=${perPage}&page=1&_fields=${fields}${extra}`,
  );
  const items = [...first.data];
  for (let page = 2; page <= first.totalPages; page += 1) {
    const { data } = await wpGetJson<T[]>(
      `${cfg.wpBase}${endpoint}?per_page=${perPage}&page=${page}&_fields=${fields}${extra}`,
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
  const base = path.basename(name.split('?')[0] ?? name);
  return (base.replace(/[^a-zA-Z0-9._-]+/g, '_').slice(0, 180) || 'file').toLowerCase();
}

// ---------------------------------------------------------------------------
// Local storage helpers (same key/URL scheme as @varka/media local adapter)
// ---------------------------------------------------------------------------

function publicUrlForKey(key: string): string {
  return `${cfg.mediaPublicBase}/${key.replace(/^\/+/, '')}`;
}

async function putLocalFile(key: string, body: Buffer): Promise<string> {
  const normalized = key.replace(/^\/+/, '').replace(/\.\./g, '');
  const full = path.resolve(cfg.storageRoot, normalized);
  if (!full.startsWith(cfg.storageRoot)) throw new Error(`Invalid key path: ${key}`);
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
  const site = await cfg.prisma.site.upsert({
    where: { slug: cfg.siteSlug },
    update: {},
    create: { name: 'Celebrtiy', slug: cfg.siteSlug },
  });
  return site as { id: string; slug: string };
}

async function ensureLanguage(siteId: string) {
  const existingDefault = await cfg.prisma.language.findFirst({ where: { siteId, defaultLanguage: true } });
  if (existingDefault) return existingDefault as { id: string; locale: string };
  const lang = await cfg.prisma.language.upsert({
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

  let user = await cfg.prisma.user.findUnique({ where: { email } });
  if (!user) {
    user = await cfg.prisma.user.create({
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
  const profile = await cfg.prisma.authorProfile.upsert({
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
  cfg.onProgress(`[categories] fetched ${terms.length}`);

  // Pass 1: create Category + translation rows
  for (const t of terms) {
    const slug = (t.slug || `category-${t.id}`).toLowerCase();
    const existingTr = await cfg.prisma.categoryTranslation.findUnique({
      where: { languageId_slug: { languageId, slug } },
      include: { category: true },
    });
    let categoryId: string;
    if (existingTr) {
      categoryId = (existingTr as any).categoryId;
      await cfg.prisma.categoryTranslation.update({
        where: { id: (existingTr as { id: string }).id },
        data: { name: decodeEntities(t.name), description: t.description ? stripTags(t.description) : null },
      });
    } else {
      const cat = await cfg.prisma.category.create({ data: { siteId } });
      categoryId = (cat as { id: string }).id;
      await cfg.prisma.categoryTranslation.create({
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
      await cfg.prisma.category.update({ where: { id: childId }, data: { parentId } });
      linked += 1;
    }
  }
  cfg.onProgress(`[categories] upserted ${terms.length}, parent links set: ${linked}`);
}

async function importTags(siteId: string, languageId: string): Promise<void> {
  const terms = await wpGetAll<WpTerm>('/tags', 'id,slug,name,description', '&orderby=id&order=asc&hide_empty=0');
  cfg.onProgress(`[tags] fetched ${terms.length}`);
  for (const t of terms) {
    const slug = (t.slug || `tag-${t.id}`).toLowerCase();
    const existingTr = await cfg.prisma.tagTranslation.findUnique({
      where: { languageId_slug: { languageId, slug } },
    });
    let tagId: string;
    if (existingTr) {
      tagId = (existingTr as any).tagId;
      await cfg.prisma.tagTranslation.update({
        where: { id: (existingTr as { id: string }).id },
        data: { name: decodeEntities(t.name) },
      });
    } else {
      const tag = await cfg.prisma.tag.create({ data: { siteId } });
      tagId = (tag as { id: string }).id;
      await cfg.prisma.tagTranslation.create({ data: { tagId, languageId, name: decodeEntities(t.name), slug } });
    }
    tagIdByWp.set(t.id, tagId);
  }
  cfg.onProgress(`[tags] upserted ${terms.length}`);
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
  cfg.onProgress(`[media] indexed ${items.length} items`);
}

function mediaKeyFor(wp: WpMedia): string {
  const d = new Date();
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const fname = safeFilename(wp.source_url || `${wp.slug || 'media'}.jpg`);
  return `wp-import/${y}/${m}/wp-${wp.id}-${fname}`;
}

async function downloadToTemp(url: string): Promise<{ file: string; bytes: Buffer; mime: string }> {
  await mkdir(cfg.tmpDir, { recursive: true });
  const res = await fetchWithRetry(url);
  const mime = ((res.headers.get('content-type') ?? '').split(';')[0] ?? '').trim().toLowerCase();
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length === 0) throw new Error('empty download');
  if (buf.length > 25 * 1024 * 1024) throw new Error('file too large (>25MB)');
  const file = path.join(cfg.tmpDir, `${createHash('sha1').update(url).digest('hex')}.bin`);
  await writeFile(file, buf);
  return { file, bytes: buf, mime };
}

/** Ensure a MediaAsset for a WP media item; downloads + stores on first run. */
async function ensureMediaAsset(siteId: string, wp: WpMedia): Promise<{ assetId: string; url: string } | null> {
  const hit = mediaAssetByWpId.get(wp.id);
  if (hit) return hit;
  const key = mediaKeyFor(wp);

  const existing = await cfg.prisma.mediaAsset.findUnique({
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
    cfg.onProgress(`[media] skip non-image ${wp.id} (${wp.mime_type})`);
    return null;
  }

  try {
    const { bytes, mime } = await downloadToTemp(normalizeUrl(wp.source_url));
    const storedKey = await putLocalFile(key, bytes);
    const url = publicUrlForKey(storedKey);
    const created = (await cfg.prisma.mediaAsset.create({
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
    cfg.onProgress(`[media] stored wp:${wp.id} → ${url}`);
    return out;
  } catch (err) {
    cfg.onProgress(`[media] failed wp:${wp.id} ${wp.source_url}: ${(err as Error).message}`);
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
        `${cfg.wpBase}/media/${wpMediaId}?_fields=id,slug,source_url,alt_text,caption,mime_type,media_details`,
      );
      wp = data;
      mediaByWpId.set(wp.id, wp);
    } catch (err) {
      cfg.onProgress(`[media] could not fetch wp media ${wpMediaId}: ${(err as Error).message}`);
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
    `&orderby=id&order=asc&status=${cfg.wpStatusFilter}&_embed=author`,
  );
  cfg.onProgress(`[posts] fetched ${posts.length}`);

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

    const existingTr = await cfg.prisma.postTranslation.findUnique({
      where: { languageId_slug: { languageId, slug } },
    });
    let postId: string;
    if (existingTr) {
      postId = (existingTr as any).postId;
      await cfg.prisma.post.update({ where: { id: postId }, data: postData });
      await cfg.prisma.postTranslation.update({
        where: { id: (existingTr as { id: string }).id },
        data: { title, slug, excerpt: excerpt || null, contentHtml, status },
      });
      updated += 1;
    } else {
      const post = (await cfg.prisma.post.create({ data: postData })) as { id: string };
      postId = post.id;
      await cfg.prisma.postTranslation.create({
        data: { postId, languageId, title, slug, excerpt: excerpt || null, contentHtml, status },
      });
      created += 1;
    }

    // Relations (rebuild — idempotent)
    const categoryIds = (p.categories ?? []).map((id) => catIdByWp.get(id)).filter((x): x is string => !!x);
    const tagIds = (p.tags ?? []).map((id) => tagIdByWp.get(id)).filter((x): x is string => !!x);
    await cfg.prisma.postCategory.deleteMany({ where: { postId } });
    if (categoryIds.length) {
      await cfg.prisma.postCategory.createMany({
        data: categoryIds.map((categoryId) => ({ postId, categoryId })),
        skipDuplicates: true,
      });
    }
    await cfg.prisma.postTag.deleteMany({ where: { postId } });
    if (tagIds.length) {
      await cfg.prisma.postTag.createMany({
        data: tagIds.map((tagId) => ({ postId, tagId })),
        skipDuplicates: true,
      });
    }

    if ((created + updated) % 25 === 0) cfg.onProgress(`[posts] progress ${created + updated}/${posts.length}`);
  }
  cfg.onProgress(`[posts] done — created ${created}, updated ${updated}`);
}

// ---------------------------------------------------------------------------
// Pages
// ---------------------------------------------------------------------------

async function importPages(siteId: string, languageId: string): Promise<void> {
  const pages = await wpGetAll<WpPost>(
    '/pages',
    'id,slug,status,date,modified,title,content,excerpt,featured_media,parent,author,comment_status,_embedded',
    `&orderby=id&order=asc&status=${cfg.wpStatusFilter}&_embed=author`,
  );
  cfg.onProgress(`[pages] fetched ${pages.length}: ${pages.map((p) => p.slug).join(', ')}`);

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

    const existingTr = await cfg.prisma.pageTranslation.findUnique({
      where: { languageId_slug: { languageId, slug } },
    });
    let pageId: string;
    if (existingTr) {
      pageId = (existingTr as any).pageId;
      await cfg.prisma.page.update({ where: { id: pageId }, data: pageData });
      await cfg.prisma.pageTranslation.update({
        where: { id: (existingTr as { id: string }).id },
        data: { title, slug, contentHtml, status },
      });
    } else {
      const page = (await cfg.prisma.page.create({ data: pageData })) as { id: string };
      pageId = page.id;
      await cfg.prisma.pageTranslation.create({
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
      await cfg.prisma.page.update({ where: { id: childId }, data: { parentId } });
      linked += 1;
    }
  }
  cfg.onProgress(`[pages] upserted ${pages.length}, parent links set: ${linked}`);
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
    await cfg.prisma.siteSetting.upsert({
      where: { siteId_key: { siteId, key } },
      update: { value },
      create: { siteId, key, value },
    });
  }
  cfg.onProgress('[settings] upserted theme.active, site.tagline, site.footer_text, site.more_info*');
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

  await main();

  async function main(): Promise<void> {
  cfg.onProgress(`[import] source: ${cfg.wpBase}`);
  cfg.onProgress(
    `[import] wp auth: ${cfg.wpHasAuth ? `enabled — importing statuses: ${cfg.wpStatusFilter}` : 'not set — importing published content only'}`,
  );
  cfg.onProgress(`[import] storage root: ${cfg.storageRoot}`);
  cfg.onProgress(`[import] media public base: ${cfg.mediaPublicBase}`);

  await cfg.prisma.$queryRaw`select 1 as ok`;
  cfg.onProgress('[import] database connection OK');

  const site = await ensureSite();
  cfg.onProgress(`[import] site: ${site.slug} (${site.id})`);
  const language = await ensureLanguage(site.id);
  cfg.onProgress(`[import] language: ${language.locale} (${language.id})`);

  await importCategories(site.id, language.id);
  await importTags(site.id, language.id);
  await importMediaIndex();
  await importPosts(site.id, language.id);
  await importPages(site.id, language.id);
  await upsertSiteSettings(site.id);

  await rm(cfg.tmpDir, { recursive: true, force: true });
  cfg.onProgress('[import] complete');
  }
}
