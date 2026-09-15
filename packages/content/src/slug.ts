/** Lowercase kebab slug from a title */
export function slugify(input: string): string {
  return input
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 200);
}

export const RESERVED_PATHS = new Set([
  'admin',
  'api',
  'post',
  'category',
  'tag',
  'author',
  'search',
  'login',
  'rss',
  'sitemap',
  'robots',
]);

export function assertSlugAllowed(slug: string): void {
  if (!slug || slug.length < 1) throw new Error('Slug required');
  if (RESERVED_PATHS.has(slug)) throw new Error(`Slug reserved: ${slug}`);
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    throw new Error('Slug must be lowercase kebab-case');
  }
}
