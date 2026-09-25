import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { Noto_Nastaliq_Urdu, Noto_Naskh_Arabic } from 'next/font/google';
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

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${notoNastaliqUr.variable} ${notoNaskhAr.variable}`}>
      <body>{children}</body>
    </html>
  );
}
