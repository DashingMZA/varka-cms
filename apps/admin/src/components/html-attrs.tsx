'use client';

import { useEffect } from 'react';

/** Sync <html> lang/dir/scheme after paint — avoids inline <script> in RSC. */
export function HtmlAttrs(props: {
  locale: string;
  dir: string;
  scheme?: string;
}) {
  const { locale, dir, scheme = 'default' } = props;
  useEffect(() => {
    const el = document.documentElement;
    el.setAttribute('lang', locale);
    el.setAttribute('dir', dir);
    el.dataset.locale = locale;
    el.dataset.adminScheme = scheme;
  }, [locale, dir, scheme]);
  return null;
}
