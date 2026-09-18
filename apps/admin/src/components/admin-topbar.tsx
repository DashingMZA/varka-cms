'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import {
  getStoredLocale,
  setStoredLocale,
  SUPPORTED_LOCALES,
  useMessages,
} from '@/lib/i18n';
import type { AppLocale } from '@varka/i18n';

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

export function AdminTopbar() {
  const [locale, setLocale] = useState<AppLocale>('en');
  const { t } = useMessages(locale);

  useEffect(() => {
    setLocale(getStoredLocale());
  }, []);

  function onLocale(next: AppLocale) {
    setStoredLocale(next);
    setLocale(next);
    window.location.reload();
  }

  async function signOut() {
    try {
      await fetch('/api/auth/sign-out', { method: 'POST', credentials: 'include' });
    } catch {
      /* ignore */
    }
    try {
      document.cookie.split(';').forEach((c) => {
        const name = c.split('=')[0]?.trim();
        if (name && /session|token|auth|better-auth/i.test(name)) {
          document.cookie = `${name}=;path=/;max-age=0`;
        }
      });
    } catch {
      /* ignore */
    }
    window.location.href = '/login';
  }

  return (
    <header className="v-topbar">
      <Link href="/dashboard" className="v-topbar__brand">
        VARKA
      </Link>
      <Link href="/content/posts" className="v-topbar__link">
        + {t('nav', 'addNew')}
      </Link>
      <Link href="/media" className="v-topbar__link">
        {t('nav', 'media')}
      </Link>
      <span className="v-topbar__spacer" />
      <label
        className="v-topbar__locale"
        style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}
      >
        <span className="v-topbar__link" style={{ opacity: 0.85 }}>
          {t('common', 'language')}
        </span>
        <select
          value={locale}
          onChange={(e) => onLocale(e.target.value as AppLocale)}
          aria-label={t('common', 'language')}
          style={{
            background: '#2c3338',
            color: '#f0f0f1',
            border: '1px solid #3c434a',
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
        className="v-topbar__link"
        target="_blank"
        rel="noreferrer"
      >
        View Site ↗
      </a>
      <button
        type="button"
        className="v-topbar__link"
        onClick={() => void signOut()}
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          color: 'inherit',
        }}
      >
        {t('auth', 'logout')}
      </button>
    </header>
  );
}
