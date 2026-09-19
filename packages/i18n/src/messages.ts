export const SUPPORTED_LOCALES = ['en', 'ur', 'ar'] as const;
export type AppLocale = (typeof SUPPORTED_LOCALES)[number];
export const MESSAGE_NAMESPACES = ['common', 'auth', 'dashboard', 'settings', 'nav'] as const;
export type MessageNamespace = (typeof MESSAGE_NAMESPACES)[number];
export type MessageTree = Record<string, string | MessageTree>;

const cache = new Map<string, MessageTree>();

import enCommon from '../locales/en/common.json';
import enAuth from '../locales/en/auth.json';
import enDashboard from '../locales/en/dashboard.json';
import enSettings from '../locales/en/settings.json';
import enNav from '../locales/en/nav.json';
import urCommon from '../locales/ur/common.json';
import urAuth from '../locales/ur/auth.json';
import urDashboard from '../locales/ur/dashboard.json';
import urSettings from '../locales/ur/settings.json';
import urNav from '../locales/ur/nav.json';
import arCommon from '../locales/ar/common.json';
import arAuth from '../locales/ar/auth.json';
import arDashboard from '../locales/ar/dashboard.json';
import arSettings from '../locales/ar/settings.json';
import arNav from '../locales/ar/nav.json';

const BUNDLED: Record<AppLocale, Record<MessageNamespace, MessageTree>> = {
  en: {
    common: enCommon as MessageTree,
    auth: enAuth as MessageTree,
    dashboard: enDashboard as MessageTree,
    settings: enSettings as MessageTree,
    nav: enNav as MessageTree,
  },
  ur: {
    common: urCommon as MessageTree,
    auth: urAuth as MessageTree,
    dashboard: urDashboard as MessageTree,
    settings: urSettings as MessageTree,
    nav: urNav as MessageTree,
  },
  ar: {
    common: arCommon as MessageTree,
    auth: arAuth as MessageTree,
    dashboard: arDashboard as MessageTree,
    settings: arSettings as MessageTree,
    nav: arNav as MessageTree,
  },
};

export function isAppLocale(value: string): value is AppLocale {
  return (SUPPORTED_LOCALES as readonly string[]).includes(value);
}

export function resolveLocale(input?: string | null): AppLocale {
  if (input && isAppLocale(input)) return input;
  if (input) {
    const base = input.split('-')[0]?.toLowerCase();
    if (base && isAppLocale(base)) return base as AppLocale;
  }
  return 'en';
}

export function loadNamespace(locale: string, ns: MessageNamespace): MessageTree {
  const loc = resolveLocale(locale);
  const key = `${loc}:${ns}`;
  if (cache.has(key)) return cache.get(key)!;
  const tree = BUNDLED[loc]?.[ns] ?? BUNDLED.en[ns] ?? {};
  cache.set(key, tree);
  return tree;
}

export function loadAllMessages(locale?: string | null): Record<MessageNamespace, MessageTree> {
  const loc = resolveLocale(locale);
  return {
    common: loadNamespace(loc, 'common'),
    auth: loadNamespace(loc, 'auth'),
    dashboard: loadNamespace(loc, 'dashboard'),
    settings: loadNamespace(loc, 'settings'),
    nav: loadNamespace(loc, 'nav'),
  };
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

export function isRtlLocale(locale: string): boolean {
  const loc = resolveLocale(locale);
  return loc === 'ar' || loc === 'ur';
}
