'use client';

import Link from 'next/link';
import { useState } from 'react';
import {
  setStoredLocale,
  SUPPORTED_LOCALES,
  useMessages,
} from '@/lib/i18n';
import type { AppLocale } from '@varka/i18n';
import { signOutAction } from '@/actions/auth';

const LOCALE_LABELS: Record<string, string> = {
  en: 'English',
  ur: 'اردو',
  ar: 'العربية',
  'zh-CN': '中文',
  es: 'Español',
  hi: 'हिन्दी',
  'pt-BR': 'Português',
  fr: 'Français',
  de: 'Deutsch',
  ja: '日本語',
  ko: '한국어',
};

async function signOut() {
  try {
    await signOutAction();
  } catch {
    /* ignore */
  }
  document.cookie.split(';').forEach((c) => {
    const name = c.split('=')[0]?.trim();
    if (!name) return;
    if (/session|token|auth|better-auth/i.test(name)) {
      document.cookie = `${name}=;path=/;max-age=0`;
    }
  });
  window.location.href = '/login';
}

export function AdminTopbar(props: { locale?: AppLocale | string } = {}) {
  const initial = (props.locale as AppLocale) || 'en';
  const [locale, setLocale] = useState<AppLocale>(initial);
  const { t } = useMessages(locale);

  function onLocale(next: AppLocale) {
    setStoredLocale(next);
    setLocale(next);
    window.location.reload();
  }

  return (
    <header className="v-topbar">
      <button
        className="v-topbar__menu-toggle"
        aria-label="Toggle menu"
        onClick={() => document.querySelector('.v-admin')?.classList.toggle('v-sidebar-open')}
      >
        ☰
      </button>
      <Link href="/dashboard" className="v-topbar__brand">
        {t('common', 'brand')}
      </Link>
      <Link href="/content/posts" className="v-topbar__link">
        + {t('nav', 'addNew')}
      </Link>
      <Link href="/media" className="v-topbar__link v-topbar__media-link">
        {t('nav', 'media')}
      </Link>
      <span className="v-topbar__spacer" />
      <label className="v-topbar__locale" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
        <span className="v-topbar__link" style={{ opacity: 0.85 }}>
          {t('common', 'language')}
        </span>
        <select
          value={locale}
          onChange={(e) => onLocale(e.target.value as AppLocale)}
          aria-label={t('common', 'language')}
          style={{
            background: 'var(--sidebar-hover)',
            color: 'var(--sidebar-text)',
            border: '1px solid var(--sidebar-muted)',
            borderRadius: 3,
            padding: '2px 6px',
            fontSize: 12,
            maxWidth: 140,
          }}
        >
          {SUPPORTED_LOCALES.map((l) => (
            <option key={l} value={l}>
              {LOCALE_LABELS[l] ?? l}
            </option>
          ))}
        </select>
      </label>
      <a
        href={process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:4321'}
        className="v-topbar__link v-topbar__view-site"
        target="_blank"
        rel="noreferrer"
      >
        {t('common', 'viewSite')} ↗
      </a>
      <button type="button" className="v-topbar__link" onClick={() => void signOut()} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit' }}>
        {t('auth', 'logout')}
      </button>
    </header>
  );
}
