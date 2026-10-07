import { SocialSchemaSettings } from '@/components/seo/social-schema-settings';

export default function SocialSchemaPage() {
  return (
    <main>
      <div className="v-page-header">
        <h1 className="v-page-title">Social & Schema</h1>
        <p className="v-muted">Knowledge graph, default share image, Twitter card</p>
      </div>
      <SocialSchemaSettings />
    </main>
  );
}
