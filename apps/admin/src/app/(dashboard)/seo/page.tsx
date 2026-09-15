import { SeoSettings } from '@/components/seo-settings';

export default function SeoPage() {
  return (
    <main>
      <h1 style={{ marginTop: 0 }}>SEO</h1>
      <p style={{ color: 'var(--muted)' }}>
        Site-wide defaults. Per-post SEO fields live on translations (seoTitle, seoDescription).
      </p>
      <SeoSettings />
    </main>
  );
}
