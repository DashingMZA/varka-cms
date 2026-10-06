import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { cookies } from 'next/headers';
import { Noto_Nastaliq_Urdu, Noto_Naskh_Arabic } from 'next/font/google';
import { resolveLocale, isRtlLocale } from '@varka/i18n';
import { LocaleProvider } from '@/lib/locale-provider';
import './globals.css';
import './tiptap-wp.css';
import './wp-admin-extra.css';
import './wp-login-media.css';

const notoNastaliqUr = Noto_Nastaliq_Urdu({
  subsets: ['arabic'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
  preload: false,
  variable: '--font-urdu',
  adjustFontFallback: true,
});

const notoNaskhAr = Noto_Naskh_Arabic({
  subsets: ['arabic'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
  preload: false,
  variable: '--font-arabic',
  adjustFontFallback: true,
});

export const metadata: Metadata = {
  title: 'VARKA Admin',
  description: 'VARKA content management',
};

/** Read locale from cookie on the server so SSR matches the client's locale (no hydration mismatch). */
export default async function RootLayout({ children }: { children: ReactNode }) {
  const cookieStore = await cookies();
  const raw = cookieStore.get('varka_locale')?.value;
  const locale = resolveLocale(raw ?? 'en');
  const dir = isRtlLocale(locale) ? 'rtl' : 'ltr';

  return (
    <html lang={locale} dir={dir} data-locale={locale} className={`${notoNastaliqUr.variable} ${notoNaskhAr.variable}`}>
      <body>
        <LocaleProvider locale={locale}>{children}</LocaleProvider>
      </body>
    </html>
  );
}
