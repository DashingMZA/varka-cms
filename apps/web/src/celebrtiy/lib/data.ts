/**
 * Celebrtiy (theme-11) data layer — direct PostgreSQL via Prisma (no HTTP to admin).
 * Mirrors apps/web/src/lib/content-api.ts: site resolved by slug 'varka',
 * every helper returns [] / null on error so templates never blow up.
 */
import { prisma } from '@varka/database';
import { postPath } from '@varka/i18n';
import { resolveActiveThemeId } from '../../lib/theme';

export type CelebrtiyPostCard = {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  path: string;
  publishedAt: string | null;
  authorName: string | null;
  imageUrl: string | null;
  categories: string[];
  categorySlugs: string[];
};

export type CelebrtiyPostDetail = CelebrtiyPostCard & {
  contentHtml: string;
  seoTitle: string | null;
  seoDescription: string | null;
  tags: string[];
  related: CelebrtiyPostCard[];
};

export type CelebrtiyNavCategory = {
  name: string;
  slug: string;
  path: string;
  count: number;
};

export type CelebrtiyFooterPage = {
  title: string;
  slug: string;
  path: string;
};

export type CelebrtiySiteInfo = {
  name: string;
  tagline: string;
  footerText: string;
  moreInfoTitle: string;
  moreInfoHtml: string;
};

/** True when the admin's active theme is the Celebrtiy theme (theme-11). */
export async function isCelebrtiyTheme(): Promise<boolean> {
  try {
    return (await resolveActiveThemeId()) === 'theme-11';
  } catch {
    return false;
  }
}

async function siteId(): Promise<string | null> {
  try {
    const site = await prisma.site.findFirst({ where: { slug: 'varka' } });
    return site?.id ?? null;
  } catch {
    return null;
  }
}

/* ------------------------------------------------------------------ */
/* Media → public image URL                                            */
/*                                                                     */
/* Convention (see apps/admin/public/uploads and packages/media/src/   */
/* driver.ts): local assets are saved to ./public/uploads and served   */
/* statically by the admin app at /uploads/<key>; MEDIA_PUBLIC_URL     */
/* overrides the base; S3/R2 keys that are already absolute URLs are  */
/* used as-is. The Astro web app is a separate origin from the admin   */
/* app, so local keys resolve to an absolute URL on the admin          */
/* (PUBLIC_API_URL).                                                   */
/* ------------------------------------------------------------------ */
function mediaPublicUrl(
  asset: { storage: string; key: string } | null | undefined,
): string | null {
  if (!asset?.key) return null;
  const key = asset.key.replace(/^\/+/, '');
  if (/^https?:\/\//i.test(key)) return key;
  const override = (process.env.MEDIA_PUBLIC_URL ?? '').replace(/\/+$/, '');
  if (override) return `${override}/${key}`;
  const adminBase = (
    (import.meta.env.PUBLIC_API_URL as string | undefined) ??
    'http://localhost:3000'
  ).replace(/\/+$/, '');
  return `${adminBase}/uploads/${key}`;
}

/* ------------------------------------------------------------------ */
/* Row shapes (structural, like packages/content PublicPostsDb)        */
/* ------------------------------------------------------------------ */
type LangRow = { defaultLanguage: boolean; locale: string; urlPrefix: string };
type PostTrRow = {
  title: string;
  slug: string;
  excerpt: string | null;
  contentHtml: string;
  seoTitle: string | null;
  seoDescription: string | null;
  language: LangRow;
};
type CatTrRow = {
  name: string;
  slug: string;
  description: string | null;
  language: LangRow;
};
type CardRowShape = {
  id: string;
  publishedAt: Date | string | null;
  translations: PostTrRow[];
  featuredImage: { storage: string; key: string } | null;
  categories: Array<{ category: { translations: CatTrRow[] } }>;
  tags: Array<{ tag: { translations: Array<{ name: string; language: LangRow }> } }>;
  authorProfile: { displayName: string } | null;
  author: { name: string } | null;
};

const cardInclude = {
  translations: { include: { language: true } },
  featuredImage: { select: { storage: true, key: true } },
  categories: {
    include: { category: { include: { translations: { include: { language: true } } } } },
  },
  tags: {
    include: { tag: { include: { translations: { include: { language: true } } } } },
  },
  authorProfile: { select: { displayName: true } },
  author: { select: { name: true } },
};

function pickDefault<T extends { language: LangRow }>(trs: T[]): T | undefined {
  return trs.find((t) => t.language.defaultLanguage) ?? trs[0];
}

function langRecord(language: LangRow) {
  return {
    defaultLanguage: language.defaultLanguage,
    locale: language.locale,
    urlPrefix: language.urlPrefix,
  };
}

function toCard(row: CardRowShape): CelebrtiyPostCard | null {
  const tr = pickDefault(row.translations);
  if (!tr) return null;
  const cats = row.categories
    .map((pc) => pickDefault(pc.category.translations))
    .filter((c): c is CatTrRow => Boolean(c));
  return {
    id: row.id,
    slug: tr.slug,
    title: tr.title,
    excerpt: tr.excerpt ?? null,
    path: postPath(langRecord(tr.language), tr.slug),
    publishedAt: row.publishedAt ? new Date(row.publishedAt).toISOString() : null,
    authorName: row.authorProfile?.displayName ?? row.author?.name ?? null,
    imageUrl: mediaPublicUrl(row.featuredImage),
    categories: cats.map((c) => c.name),
    categorySlugs: cats.map((c) => c.slug),
  };
}

function publishedWhere(id: string) {
  return { siteId: id, status: 'PUBLISHED', deletedAt: null };
}

function categoryPath(slug: string) {
  return `/category/${slug}`;
}
function tagPath(slug: string) {
  return `/tag/${slug}`;
}
function authorPath(slug: string) {
  return `/author/${slug}`;
}
function pagePathOf(slug: string) {
  return `/page/${slug}`;
}

/* ------------------------------------------------------------------ */
/* Site info                                                           */
/* ------------------------------------------------------------------ */
function settingToString(value: unknown): string {
  if (typeof value === 'string') return value;
  if (value && typeof value === 'object') {
    const v = value as Record<string, unknown>;
    for (const k of ['text', 'value', 'html']) {
      if (typeof v[k] === 'string') return v[k] as string;
    }
  }
  return '';
}

export async function getSiteInfo(): Promise<CelebrtiySiteInfo> {
  const fallback: CelebrtiySiteInfo = {
    name: 'VARKA',
    tagline: '',
    footerText: '',
    moreInfoTitle: '',
    moreInfoHtml: '',
  };
  try {
    const site = await prisma.site.findFirst({ where: { slug: 'varka' } });
    if (!site) return fallback;
    const rows = (await prisma.siteSetting.findMany({
      where: {
        siteId: site.id,
        key: {
          in: ['site.tagline', 'site.footer_text', 'site.more_info_title', 'site.more_info'],
        },
      },
      select: { key: true, value: true },
    })) as Array<{ key: string; value: unknown }>;
    const byKey = new Map(rows.map((r) => [r.key, settingToString(r.value)]));
    const name = site.name || fallback.name;
    const footerText =
      byKey.get('site.footer_text') ||
      `© ${new Date().getFullYear()} ${name}. All rights reserved.`;
    return {
      name,
      tagline: byKey.get('site.tagline') ?? '',
      footerText,
      moreInfoTitle: byKey.get('site.more_info_title') ?? '',
      moreInfoHtml: byKey.get('site.more_info') ?? '',
    };
  } catch {
    return fallback;
  }
}

/* ------------------------------------------------------------------ */
/* Navigation / footer                                                 */
/* ------------------------------------------------------------------ */
export async function getNavCategories(): Promise<CelebrtiyNavCategory[]> {
  try {
    const id = await siteId();
    if (!id) return [];
    const rows = (await prisma.category.findMany({
      where: {
        siteId: id,
        posts: { some: { post: publishedWhere(id) } },
      },
      orderBy: { sortOrder: 'asc' },
      include: {
        translations: { include: { language: true } },
        _count: { select: { posts: { where: { post: publishedWhere(id) } } } },
      },
    } as never)) as Array<{
      translations: CatTrRow[];
      _count: { posts: number };
    }>;
    return rows
      .map((c) => {
        const tr = pickDefault(c.translations);
        if (!tr) return null;
        return {
          name: tr.name,
          slug: tr.slug,
          path: categoryPath(tr.slug),
          count: c._count.posts,
        };
      })
      .filter((c): c is CelebrtiyNavCategory => Boolean(c));
  } catch {
    return [];
  }
}

export async function getFooterPages(): Promise<CelebrtiyFooterPage[]> {
  try {
    const id = await siteId();
    if (!id) return [];
    const rows = (await prisma.page.findMany({
      where: { siteId: id, status: 'PUBLISHED', deletedAt: null },
      orderBy: { sortOrder: 'asc' },
      include: { translations: { include: { language: true } } },
    } as never)) as Array<{
      translations: Array<{ title: string; slug: string; language: LangRow }>;
    }>;
    return rows
      .map((p) => {
        const tr = pickDefault(p.translations);
        if (!tr) return null;
        return { title: tr.title, slug: tr.slug, path: pagePathOf(tr.slug) };
      })
      .filter((p): p is CelebrtiyFooterPage => Boolean(p));
  } catch {
    return [];
  }
}

/* ------------------------------------------------------------------ */
/* Post listings                                                       */
/* ------------------------------------------------------------------ */
async function queryCards(args: {
  where: Record<string, unknown>;
  orderBy?: Record<string, unknown>;
  take?: number;
  skip?: number;
}): Promise<CelebrtiyPostCard[]> {
  const rows = (await prisma.post.findMany({
    where: args.where,
    orderBy: args.orderBy ?? { publishedAt: 'desc' },
    take: args.take,
    skip: args.skip,
    include: cardInclude,
  } as never)) as unknown as CardRowShape[];
  return rows
    .map(toCard)
    .filter((c): c is CelebrtiyPostCard => Boolean(c));
}

/** Latest N published posts that have a featured image. */
export async function getFeaturedPosts(n = 5): Promise<CelebrtiyPostCard[]> {
  try {
    const id = await siteId();
    if (!id) return [];
    const cards = await queryCards({
      where: { ...publishedWhere(id), featuredImageId: { not: null } },
      take: Math.max(n * 3, n),
    });
    return cards.filter((c) => c.imageUrl).slice(0, n);
  } catch {
    return [];
  }
}

export async function getLatestPosts(n = 8): Promise<CelebrtiyPostCard[]> {
  try {
    const id = await siteId();
    if (!id) return [];
    return await queryCards({ where: publishedWhere(id), take: n });
  } catch {
    return [];
  }
}

/** "Top Picks For You" sidebar — latest posts with images. */
export async function getSidebarPicks(n = 5): Promise<CelebrtiyPostCard[]> {
  return getFeaturedPosts(n);
}

export async function getSimilarPosts(
  postId: string,
  categorySlugs: string[],
  n = 8,
): Promise<CelebrtiyPostCard[]> {
  try {
    const id = await siteId();
    if (!id) return [];
    const picked: CelebrtiyPostCard[] = [];
    const seen = new Set<string>([postId]);
    if (categorySlugs.length > 0) {
      const cats = (await prisma.category.findMany({
        where: {
          siteId: id,
          translations: { some: { slug: { in: categorySlugs } } },
        },
        select: { id: true },
      })) as Array<{ id: string }>;
      const catIds = cats.map((c) => c.id);
      if (catIds.length > 0) {
        const same = await queryCards({
          where: {
            ...publishedWhere(id),
            id: { not: postId },
            categories: { some: { categoryId: { in: catIds } } },
          },
          take: n,
        });
        for (const c of same) {
          if (picked.length >= n) break;
          picked.push(c);
          seen.add(c.id);
        }
      }
    }
    if (picked.length < n) {
      const filler = await queryCards({
        where: { ...publishedWhere(id), id: { notIn: [...seen] } },
        take: n - picked.length,
      });
      picked.push(...filler);
    }
    return picked;
  } catch {
    return [];
  }
}

/* ------------------------------------------------------------------ */
/* Single post                                                         */
/* ------------------------------------------------------------------ */
export async function getPostDetail(slug: string): Promise<CelebrtiyPostDetail | null> {
  try {
    const id = await siteId();
    if (!id) return null;
    const row = (await prisma.post.findFirst({
      where: {
        ...publishedWhere(id),
        translations: { some: { slug } },
      },
      include: cardInclude,
    } as never)) as unknown as CardRowShape | null;
    if (!row) return null;
    const card = toCard(row);
    if (!card) return null;
    const tr = row.translations.find((t) => t.slug === slug) ?? pickDefault(row.translations);
    if (!tr) return null;
    const tags = row.tags
      .map((pt) => pickDefault(pt.tag.translations)?.name)
      .filter((t): t is string => Boolean(t));
    const related = await getSimilarPosts(card.id, card.categorySlugs, 8);
    return {
      ...card,
      contentHtml: tr.contentHtml ?? '',
      seoTitle: tr.seoTitle ?? null,
      seoDescription: tr.seoDescription ?? null,
      tags,
      related,
    };
  } catch {
    return null;
  }
}

/* ------------------------------------------------------------------ */
/* Categories                                                          */
/* ------------------------------------------------------------------ */
export type CelebrtiyCategory = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  path: string;
  postCount: number;
};

export async function getCategoryBySlug(slug: string): Promise<CelebrtiyCategory | null> {
  try {
    const id = await siteId();
    if (!id) return null;
    const row = (await prisma.category.findFirst({
      where: { siteId: id, translations: { some: { slug } } },
      include: {
        translations: { include: { language: true } },
        _count: { select: { posts: { where: { post: publishedWhere(id) } } } },
      },
    } as never)) as {
      id: string;
      translations: CatTrRow[];
      _count: { posts: number };
    } | null;
    if (!row) return null;
    const tr = row.translations.find((t) => t.slug === slug) ?? pickDefault(row.translations);
    if (!tr) return null;
    return {
      id: row.id,
      name: tr.name,
      slug: tr.slug,
      description: tr.description ?? null,
      path: categoryPath(tr.slug),
      postCount: row._count.posts,
    };
  } catch {
    return null;
  }
}

export async function listCategories(): Promise<CelebrtiyCategory[]> {
  try {
    const id = await siteId();
    if (!id) return [];
    const rows = (await prisma.category.findMany({
      where: { siteId: id },
      orderBy: { sortOrder: 'asc' },
      include: {
        translations: { include: { language: true } },
        _count: { select: { posts: { where: { post: publishedWhere(id) } } } },
      },
    } as never)) as Array<{
      id: string;
      translations: CatTrRow[];
      _count: { posts: number };
    }>;
    return rows
      .map((c) => {
        const tr = pickDefault(c.translations);
        if (!tr || c._count.posts === 0) return null;
        return {
          id: c.id,
          name: tr.name,
          slug: tr.slug,
          description: tr.description ?? null,
          path: categoryPath(tr.slug),
          postCount: c._count.posts,
        };
      })
      .filter((c): c is CelebrtiyCategory => Boolean(c));
  } catch {
    return [];
  }
}

export async function getPostsByCategory(
  slug: string,
  take = 12,
  skip = 0,
): Promise<{ posts: CelebrtiyPostCard[]; total: number }> {
  const empty = { posts: [], total: 0 };
  try {
    const id = await siteId();
    if (!id) return empty;
    const cat = (await prisma.category.findFirst({
      where: { siteId: id, translations: { some: { slug } } },
      select: { id: true },
    })) as { id: string } | null;
    if (!cat) return empty;
    const where = {
      ...publishedWhere(id),
      categories: { some: { categoryId: cat.id } },
    };
    const [total, posts] = await Promise.all([
      prisma.post.count({ where } as never) as Promise<number>,
      queryCards({ where, take, skip }),
    ]);
    return { posts, total };
  } catch {
    return empty;
  }
}

/* ------------------------------------------------------------------ */
/* Tags                                                                */
/* ------------------------------------------------------------------ */
export type CelebrtiyTag = {
  id: string;
  name: string;
  slug: string;
  path: string;
  postCount: number;
};

export async function getTagBySlug(slug: string): Promise<CelebrtiyTag | null> {
  try {
    const id = await siteId();
    if (!id) return null;
    const row = (await prisma.tag.findFirst({
      where: { siteId: id, translations: { some: { slug } } },
      include: {
        translations: { include: { language: true } },
        _count: { select: { posts: { where: { post: publishedWhere(id) } } } },
      },
    } as never)) as {
      id: string;
      translations: Array<{ name: string; slug: string; language: LangRow }>;
      _count: { posts: number };
    } | null;
    if (!row) return null;
    const tr =
      row.translations.find((t) => t.slug === slug) ?? pickDefault(row.translations);
    if (!tr) return null;
    return {
      id: row.id,
      name: tr.name,
      slug: tr.slug,
      path: tagPath(tr.slug),
      postCount: row._count.posts,
    };
  } catch {
    return null;
  }
}

export async function getPostsByTag(
  slug: string,
  take = 12,
  skip = 0,
): Promise<{ posts: CelebrtiyPostCard[]; total: number }> {
  const empty = { posts: [], total: 0 };
  try {
    const id = await siteId();
    if (!id) return empty;
    const tag = (await prisma.tag.findFirst({
      where: { siteId: id, translations: { some: { slug } } },
      select: { id: true },
    })) as { id: string } | null;
    if (!tag) return empty;
    const where = {
      ...publishedWhere(id),
      tags: { some: { tagId: tag.id } },
    };
    const [total, posts] = await Promise.all([
      prisma.post.count({ where } as never) as Promise<number>,
      queryCards({ where, take, skip }),
    ]);
    return { posts, total };
  } catch {
    return empty;
  }
}

/* ------------------------------------------------------------------ */
/* Authors                                                             */
/* ------------------------------------------------------------------ */
export type CelebrtiyAuthor = {
  id: string;
  slug: string;
  displayName: string;
  bio: string | null;
  avatarUrl: string | null;
  path: string;
};

export async function getAuthorBySlug(
  slug: string,
  take = 12,
  skip = 0,
): Promise<{ author: CelebrtiyAuthor; posts: CelebrtiyPostCard[]; total: number } | null> {
  try {
    const id = await siteId();
    if (!id) return null;
    const profile = (await prisma.authorProfile.findFirst({
      where: { siteId: id, slug },
      select: { id: true, slug: true, displayName: true, bio: true, avatarUrl: true },
    })) as {
      id: string;
      slug: string;
      displayName: string;
      bio: string | null;
      avatarUrl: string | null;
    } | null;
    if (!profile) return null;
    const where = { ...publishedWhere(id), authorProfileId: profile.id };
    const [total, posts] = await Promise.all([
      prisma.post.count({ where } as never) as Promise<number>,
      queryCards({ where, take, skip }),
    ]);
    return {
      author: { ...profile, path: authorPath(profile.slug) },
      posts,
      total,
    };
  } catch {
    return null;
  }
}

/* ------------------------------------------------------------------ */
/* Pages                                                               */
/* ------------------------------------------------------------------ */
export type CelebrtiyPage = {
  title: string;
  slug: string;
  contentHtml: string;
  seoTitle: string | null;
  seoDescription: string | null;
  path: string;
};

export async function getPageBySlug(slug: string): Promise<CelebrtiyPage | null> {
  try {
    const id = await siteId();
    if (!id) return null;
    const row = (await prisma.page.findFirst({
      where: {
        siteId: id,
        status: 'PUBLISHED',
        deletedAt: null,
        translations: { some: { slug } },
      },
      include: { translations: { include: { language: true } } },
    } as never)) as {
      translations: Array<{
        title: string;
        slug: string;
        contentHtml: string;
        seoTitle: string | null;
        seoDescription: string | null;
        language: LangRow;
      }>;
    } | null;
    if (!row) return null;
    const tr =
      row.translations.find((t) => t.slug === slug) ?? pickDefault(row.translations);
    if (!tr) return null;
    return {
      title: tr.title,
      slug: tr.slug,
      contentHtml: tr.contentHtml ?? '',
      seoTitle: tr.seoTitle ?? null,
      seoDescription: tr.seoDescription ?? null,
      path: pagePathOf(tr.slug),
    };
  } catch {
    return null;
  }
}

/* ------------------------------------------------------------------ */
/* Search                                                              */
/* ------------------------------------------------------------------ */
export async function searchPosts(q: string): Promise<CelebrtiyPostCard[]> {
  const needle = q.trim().slice(0, 120);
  if (!needle) return [];
  try {
    const id = await siteId();
    if (!id) return [];
    return await queryCards({
      where: {
        ...publishedWhere(id),
        translations: {
          some: {
            OR: [
              { title: { contains: needle, mode: 'insensitive' } },
              { excerpt: { contains: needle, mode: 'insensitive' } },
            ],
          },
        },
      },
      take: 20,
    });
  } catch {
    return [];
  }
}
