import { WidgetsAdmin } from '@/components/widgets-admin';

export default function AppearanceWidgetsPage() {
  return (
    <main>
      <h1 className="v-page-title">Widgets</h1>
      <p className="v-muted" style={{ marginBottom: 16 }}>
        Assign widgets to theme areas. Order is persisted site-wide.
      </p>
      <WidgetsAdmin />
    </main>
  );
}
