import { RobotsSettings } from '@/components/seo/robots-settings';

export default function RobotsPage() {
  return (
    <main>
      <div className="v-page-header">
        <h1 className="v-page-title">robots.txt</h1>
        <p className="v-muted">Served at /robots.txt</p>
      </div>
      <RobotsSettings />
    </main>
  );
}
