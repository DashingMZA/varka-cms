import { LocalSeoSettings } from '@/components/seo/local-seo-settings';

export default function LocalSeoPage() {
  return (
    <main>
      <div className="v-page-header">
        <h1 className="v-page-title">Local SEO</h1>
        <p className="v-muted">Address, hours and phone for a business with a place</p>
      </div>
      <LocalSeoSettings />
    </main>
  );
}
