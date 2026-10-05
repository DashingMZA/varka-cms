import { TitlesMetaSettings } from '@/components/seo/titles-meta-settings';

export default function TitlesMetaPage() {
  return (
    <main>
      <div className="v-page-header">
        <h1 className="v-page-title">Titles & Meta</h1>
      </div>
      <TitlesMetaSettings />
    </main>
  );
}
