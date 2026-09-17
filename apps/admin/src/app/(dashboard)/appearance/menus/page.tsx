import { MenuBuilder } from '@/components/menu-builder';

export default function AppearanceMenusPage() {
  return (
    <main>
      <h1 className="v-page-title">Menus</h1>
      <p className="v-muted" style={{ marginBottom: 16 }}>
        Build navigation menus and assign them to theme locations. Changes persist to site settings.
      </p>
      <MenuBuilder />
    </main>
  );
}
