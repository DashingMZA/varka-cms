import { WebmasterToolsSettings } from '@/components/seo/webmaster-tools-settings';

export default function WebmasterToolsPage() {
  return (
    <main>
      <div className="v-page-header">
        <h1 className="v-page-title">Webmaster Tools</h1>
        <p className="v-muted">Verify the site with Google, Bing, Yandex and Pinterest</p>
      </div>
      <WebmasterToolsSettings />
    </main>
  );
}
