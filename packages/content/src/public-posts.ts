import type { CacheStore } from '@varka/cache';
import { CacheKeys } from '@varka/cache';
import { postPath, type LanguageRecord } from '@varka/i18n';

export type PublicPostsDb = {
  post: {
    findMany: (args: unknown) => Promise<unknown[]>;
    findFirst: (args: unknown) => Promise<unknown>;
  };
  language: {
    findFirst: (args: unknown) => Promise<unknown>;
  };
};

export type PublicPostCard = {
  id: string;
  publishedAt: string | null;
  path: string;
  title: string;
  slug: string;
  excerpt: string | null;
  languageId: string;
  locale: string;
};

export type PublicPostDetail = PublicPostCard & {
  contentHtml: string;
  seoTitle: string | null;
  seoDescription: string | null;
};

function mapLang(lang: {
  id: string;
  locale: string;
  urlPrefix: string;
  defaultLanguage: boolean;
}): LanguageRecord {
  return {
    id: lang.id,
    locale: lang.locale,
    languageCode: lang.locale.split('-')[0] ?? lang.locale,
    script: 'Latn',
    direction: 'ltr',
    urlPrefix: lang.urlPrefix,
    defaultLanguage: lang.defaultLanguage,
    enabled: true,
  };
}

export async function listPublishedPosts(
  db: PublicPostsDb,
  opts: { siteId: string; locale?: string; limit?: number },
): Promise<PublicPostCard[]> {
  const limit = Math.min(opts.limit ?? 20, 100);
  const posts = (await db.post.findMany({
    where: {
      siteId: opts.siteId,
      status: 'PUBLISHED',
      deletedAt: null,
    },
    orderBy: { publishedAt: 'desc' },
    take: limit,
    include: {
      translations: {
        include: { language: true },
      },
    },
  })) as Array<{
    id: string;
    publishedAt: Date | string | null;
    translations: Array<{
      title: string;
      slug: string;
      excerpt: string | null;
      languageId: string;
      language: {
        id: string;
        locale: string;
        urlPrefix: string;
        defaultLanguage: boolean;
      };
    }>;
  }>;

  const cards: PublicPostCard[] = [];
  for (const p of posts) {
    let tr = p.translations[0];
    if (opts.locale) {
      const match = p.translations.find((t) => t.language.locale === opts.locale);
      if (match) tr = match;
      else continue;
    }
    if (!tr) continue;
    const lang = mapLang(tr.language);
    cards.push({
      id: p.id,
      publishedAt: p.publishedAt ? new Date(p.publishedAt).toISOString() : null,
      path: postPath(lang, tr.slug),
      title: tr.title,
      slug: tr.slug,
      excerpt: tr.excerpt,
      languageId: tr.languageId,
      locale: tr.language.locale,
    });
  }
  return cards;
}

export async function getPublishedPostBySlug(
  db: PublicPostsDb,
  opts: { siteId: string; slug: string; locale?: string },
): Promise<PublicPostDetail | null> {
  const post = (await db.post.findFirst({
    where: {
      siteId: opts.siteId,
      status: 'PUBLISHED',
      deletedAt: null,
      translations: {
        some: {
          slug: opts.slug,
          ...(opts.locale
            ? { language: { locale: opts.locale } }
            : {}),
        },
      },
    },
    include: {
      translations: { include: { language: true } },
    },
  })) as {
    id: string;
    publishedAt: Date | string | null;
    translations: Array<{
      title: string;
      slug: string;
      excerpt: string | null;
      contentHtml: string;
      seoTitle: string | null;
      seoDescription: string | null;
      languageId: string;
      language: {
        id: string;
        locale: string;
        urlPrefix: string;
        defaultLanguage: boolean;
      };
    }>;
  } | null;

  if (!post) return null;
  let tr = post.translations.find((t) => t.slug === opts.slug);
  if (opts.locale) {
    tr =
      post.translations.find(
        (t) => t.slug === opts.slug && t.language.locale === opts.locale,
      ) ?? tr;
  }
  if (!tr) return null;
  const lang = mapLang(tr.language);
  return {
    id: post.id,
    publishedAt: post.publishedAt ? new Date(post.publishedAt).toISOString() : null,
    path: postPath(lang, tr.slug),
    title: tr.title,
    slug: tr.slug,
    excerpt: tr.excerpt,
    contentHtml: tr.contentHtml,
    seoTitle: tr.seoTitle,
    seoDescription: tr.seoDescription,
    languageId: tr.languageId,
    locale: tr.language.locale,
  };
}

export async function listPublishedPostsCached(
  db: PublicPostsDb,
  cache: CacheStore,
  opts: { siteId: string; locale?: string; limit?: number },
): Promise<PublicPostCard[]> {
  const key = `varka:public:posts:${opts.siteId}:${opts.locale ?? 'all'}:${opts.limit ?? 20}`;
  const hit = await cache.get(key);
  if (hit) {
    try {
      return JSON.parse(hit) as PublicPostCard[];
    } catch {
      /* rebuild */
    }
  }
  const rows = await listPublishedPosts(db, opts);
  await cache.set(key, JSON.stringify(rows), 60);
  return rows;
}

export async function getPublishedPostBySlugCached(
  db: PublicPostsDb,
  cache: CacheStore,
  opts: { siteId: string; slug: string; locale?: string },
): Promise<PublicPostDetail | null> {
  const key = CacheKeys.postBySlug(opts.locale ?? 'default', opts.slug);
  const hit = await cache.get(key);
  if (hit) {
    if (hit === 'null') return null;
    try {
      return JSON.parse(hit) as PublicPostDetail;
    } catch {
      /* rebuild */
    }
  }
  const row = await getPublishedPostBySlug(db, opts);
  await cache.set(key, row ? JSON.stringify(row) : 'null', 120);
  return row;
}

/** Call after publish / unpublish / update of a published post */
export async function invalidatePostCache(
  cache: CacheStore,
  opts: { siteId: string; slug?: string; locale?: string },
): Promise<void> {
  if (opts.slug) {
    await cache.del(CacheKeys.postBySlug(opts.locale ?? 'default', opts.slug));
    await cache.del(CacheKeys.postBySlug('default', opts.slug));
  }
  // list keys are TTL-short; best-effort delete common variants
  for (const locale of [opts.locale ?? 'all', 'all', 'en']) {
    for (const limit of [10, 20, 50, 100]) {
      await cache.del(`varka:public:posts:${opts.siteId}:${locale}:${limit}`);
    }
  }
}
