import { LOCALE_REGISTRY, SUPPORTED_LOCALES } from './locale-registry';
import type { MessageTree } from './messages-types';

export type { MessageTree } from './messages-types';
export { SUPPORTED_LOCALES } from './locale-registry';

export type AppLocale = (typeof SUPPORTED_LOCALES)[number];

/** All message namespaces used by admin + public */
export const MESSAGE_NAMESPACES = [
  'common',
  'auth',
  'dashboard',
  'settings',
  'nav',
  'navigation',
  'blogs',
  'pages',
  'posts',
  'users',
  'profile',
  'media',
  'comments',
  'categories',
  'tags',
  'appearance',
  'seo',
  'tables',
  'actions',
  'forms',
  'errors',
  'confirmations',
  'pagination',
  'validation',
  'language',
  'themes',
  'security',
  'notifications',
  'email',
  'storage',
  'admins',
  'brands',
  'emptyStates',
  'plugins',
  'editor',
] as const;

export type MessageNamespace = (typeof MESSAGE_NAMESPACES)[number];

const cache = new Map<string, MessageTree>();

export function isAppLocale(value: string): value is AppLocale {
  return (SUPPORTED_LOCALES as readonly string[]).includes(value);
}

export function resolveLocale(input?: string | null): AppLocale {
  if (input && isAppLocale(input)) return input;
  if (input) {
    const base = input.split('-')[0]?.toLowerCase();
    if (base && isAppLocale(base)) return base as AppLocale;
    if (base === 'zh' && isAppLocale('zh-CN')) return 'zh-CN';
    if (base === 'pt' && isAppLocale('pt-BR')) return 'pt-BR';
  }
  return 'en';
}

export function loadNamespace(locale: string, ns: MessageNamespace): MessageTree {
  const loc = resolveLocale(locale);
  const key = `${loc}:${ns}`;
  if (cache.has(key)) return cache.get(key)!;
  const tree =
    (LOCALE_REGISTRY[loc]?.[ns] as MessageTree | undefined) ??
    (LOCALE_REGISTRY.en?.[ns] as MessageTree | undefined) ??
    {};
  cache.set(key, tree);
  return tree;
}

export function loadAllMessages(locale?: string | null): Record<MessageNamespace, MessageTree> {
  const loc = resolveLocale(locale);
  const out = {} as Record<MessageNamespace, MessageTree>;
  for (const ns of MESSAGE_NAMESPACES) {
    out[ns] = loadNamespace(loc, ns);
  }
  return out;
}

export function t(tree: MessageTree, path: string, fallback?: string): string {
  const parts = path.split('.');
  let cur: string | MessageTree | undefined = tree;
  for (const p of parts) {
    if (cur == null || typeof cur === 'string') return fallback ?? path;
    cur = (cur as MessageTree)[p];
  }
  return typeof cur === 'string' ? cur : (fallback ?? path);
}

/** RTL: Arabic + Urdu */
export function isRtlLocale(locale: string): boolean {
  const loc = resolveLocale(locale);
  return loc === 'ar' || loc === 'ur';
}
