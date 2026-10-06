/**
 * SEO title/description template engine.
 *
 * Ported from BMS-CMS (src/lib/seo.ts). Titles are built from templates with
 * %variables%, the way Rank Math and Yoast do it, so a site can change every
 * post title at once instead of editing each one. A post's own SEO title
 * always wins over the template.
 */

/** Variables a template may use, with a short description for the admin UI. */
export const SEO_VARIABLES: { token: string; label: string; scope: string }[] = [
  { token: '%title%', label: 'Post or page title', scope: 'post, page' },
  { token: '%sitename%', label: 'Site name', scope: 'everywhere' },
  { token: '%sitedesc%', label: 'Site tagline', scope: 'everywhere' },
  { token: '%sep%', label: 'The separator below', scope: 'everywhere' },
  { token: '%excerpt%', label: 'Excerpt, else first text', scope: 'post, page' },
  { token: '%category%', label: 'Primary category name', scope: 'post' },
  { token: '%term%', label: 'Category / archive name', scope: 'category' },
  { token: '%term_description%', label: 'Category description', scope: 'category' },
  { token: '%search%', label: 'The search query', scope: 'search' },
  { token: '%date%', label: 'Published date', scope: 'post' },
  { token: '%currentyear%', label: 'The current year', scope: 'everywhere' },
];

export type SeoVars = Partial<{
  title: string;
  sitename: string;
  sitedesc: string;
  excerpt: string;
  category: string;
  term: string;
  term_description: string;
  search: string;
  date: string;
}>;

/**
 * Fills %variables% in a template.
 *
 * Unknown tokens are stripped rather than left visible, and the result is
 * collapsed so a missing value doesn't leave a stray separator like "Title - ".
 */
export function renderTemplate(template: string, vars: SeoVars, separator = '-'): string {
  if (!template) return '';

  const table: Record<string, string> = {
    '%title%': vars.title ?? '',
    '%sitename%': vars.sitename ?? '',
    '%sitedesc%': vars.sitedesc ?? '',
    '%sep%': separator,
    '%excerpt%': vars.excerpt ?? '',
    '%category%': vars.category ?? '',
    '%term%': vars.term ?? '',
    '%term_description%': vars.term_description ?? '',
    '%search%': vars.search ?? '',
    '%date%': vars.date ?? '',
    '%currentyear%': String(new Date().getFullYear()),
  };

  let out = template.replace(/%[a-z_]+%/gi, (m) => table[m.toLowerCase()] ?? '');

  // Tidy up what empty values left behind: a dangling separator, doubled
  // separators, or runs of whitespace.
  const sep = separator.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  out = out
    .replace(new RegExp(`(\\s*${sep}\\s*){2,}`, 'g'), ` ${separator} `)
    .replace(new RegExp(`^\\s*${sep}\\s*`), '')
    .replace(new RegExp(`\\s*${sep}\\s*$`), '')
    .replace(/\s{2,}/g, ' ')
    .trim();

  return out;
}

/**
 * JSON-LD as a string that is safe to place inside a `<script>` element.
 *
 * An HTML parser ends a `<script>` at the first `</script` in its text, no
 * matter what JavaScript or JSON context it appears in — so a post titled
 * `</script><script>…</script>` closes the schema block early and everything
 * after it runs as script. Escaping `<` sidesteps that entirely and still
 * parses back to the original string, because `\u003c` is just how JSON
 * spells `<`.
 */
export function jsonLd(data: object): string {
  return JSON.stringify(data).replace(/</g, '\\u003c');
}

/**
 * A handle as `twitter:creator` wants it: "@name". Accepts "@name", "name" or
 * a profile URL, since the profile field has taken all three.
 */
export function twitterHandle(raw: string | null | undefined): string | undefined {
  const v = (raw ?? '').trim();
  if (!v) return undefined;
  const fromUrl = v.match(/(?:twitter|x)\.com\/@?([A-Za-z0-9_]{1,15})/i);
  const name = fromUrl?.[1] ?? v.replace(/^@/, '');
  return /^[A-Za-z0-9_]{1,15}$/.test(name) ? `@${name}` : undefined;
}

/**
 * `og:locale` wants `language_TERRITORY`, not a bare language code.
 *
 * A code that already names a region converts directly (`en-GB` -> `en_GB`).
 * The rest get the territory most commonly paired with them; that is a
 * convention, not a fact, which is why it is a table rather than a rule. A
 * language not in the table falls back to its bare code — wrong-ish but
 * harmless, and better than inventing a territory.
 */
const OG_TERRITORY: Record<string, string> = {
  en: 'en_US', ur: 'ur_PK', ar: 'ar_AR', fa: 'fa_IR', ps: 'ps_AF', he: 'he_IL',
  hi: 'hi_IN', bn: 'bn_BD', pa: 'pa_IN', ta: 'ta_IN', te: 'te_IN', mr: 'mr_IN',
  gu: 'gu_IN', kn: 'kn_IN', ml: 'ml_IN', ne: 'ne_NP', si: 'si_LK',
  'zh-Hans': 'zh_CN', 'zh-Hant': 'zh_TW', ja: 'ja_JP', ko: 'ko_KR', th: 'th_TH',
  vi: 'vi_VN', id: 'id_ID', ms: 'ms_MY', fil: 'tl_PH', sw: 'sw_KE',
  es: 'es_ES', pt: 'pt_PT', fr: 'fr_FR', de: 'de_DE', it: 'it_IT', nl: 'nl_NL',
  pl: 'pl_PL', ru: 'ru_RU', uk: 'uk_UA', tr: 'tr_TR', el: 'el_GR', cs: 'cs_CZ',
  ro: 'ro_RO', hu: 'hu_HU', sv: 'sv_SE', da: 'da_DK', nb: 'nb_NO', fi: 'fi_FI',
};

export function ogLocale(code: string): string {
  if (OG_TERRITORY[code]) return OG_TERRITORY[code];
  return code.includes('-') ? code.replace('-', '_') : code;
}

// `/search` is `noindex` and rendered on every request, so a crawler
// following the search form's URLs burns crawl budget on pages it is told
// to forget; the `/*/search` lines are the same page under a language prefix.
export const ROBOTS_SEARCH_RULES = [
  'Disallow: /search$',
  'Disallow: /search?',
  'Disallow: /search/',
  'Disallow: /*/search$',
  'Disallow: /*/search?',
  'Disallow: /*/search/',
];

export const DEFAULT_ROBOTS_TXT = `User-agent: *
Allow: /
Disallow: /admin$
Disallow: /admin/
Disallow: /api/
${ROBOTS_SEARCH_RULES.join('\n')}`;

/** The prefix rules older versions wrote, and their exact replacements. */
const LEGACY_ROBOTS_RULES: Record<string, string[]> = {
  '/admin': ['Disallow: /admin$', 'Disallow: /admin/'],
  '/api': ['Disallow: /api/'],
  '/search': ROBOTS_SEARCH_RULES.slice(0, 3),
  '/*/search': ROBOTS_SEARCH_RULES.slice(3),
};

/**
 * The robots.txt to serve, given what is saved.
 *
 * Two repairs, both invisible to someone who wrote their own rules:
 *   • The four prefix lines this CMS used to ship (and which most sites still
 *     have saved, since the default was written into the setting) become the
 *     exact forms above. Nothing else a person wrote is changed.
 *   • The search rules every site needs are added *inside* the
 *     `User-agent: *` group. Appending them at the end attached them to
 *     whichever group came last — `User-agent: GPTBot`, say — and every other
 *     crawler never saw them. With no `*` group, one is added.
 */
export function servedRobotsTxt(saved: string): string {
  const lines = saved.replace(/\r\n?/g, '\n').split('\n').flatMap((line) => {
    const m = line.match(/^\s*disallow:\s*(\S+)\s*$/i);
    const key = m?.[1];
    return m && key && LEGACY_ROBOTS_RULES[key] ? LEGACY_ROBOTS_RULES[key]! : [line];
  });
  const has = (rule: string) => lines.some((l) => l.trim().toLowerCase() === rule.toLowerCase());
  const missing = ROBOTS_SEARCH_RULES.filter((r) => !has(r));
  if (missing.length === 0) return lines.join('\n');

  const star = lines.findIndex((l) => /^\s*user-agent:\s*\*\s*$/i.test(l));
  if (star === -1) return [...lines, '', 'User-agent: *', ...missing].join('\n');
  // After the run of User-agent lines the group starts with: a rule placed
  // between two of them would end the group early.
  let at = star + 1;
  while (at < lines.length && /^\s*user-agent:/i.test(lines[at]!)) at++;
  lines.splice(at, 0, ...missing);
  return lines.join('\n');
}
