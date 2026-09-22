import { WidgetsAdmin } from '@/components/widgets-admin';

export default function AppearanceWidgetsPage() {
  return (
    <main>
      <h1 className="v-page-title">Widgets</h1>
      <p className="v-muted" style={{ marginBottom: 16 }}>
        Drag widgets into theme zones. Changes save to site settings.
      </p>
      <WidgetsAdmin />
    </main>
  );
}
