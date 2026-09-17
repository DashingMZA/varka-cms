import Link from 'next/link';

export default function AppearancePage() {
  return (
    <main>
      <h1 className="v-page-title">Appearance</h1>
      <p className="v-muted">Manage themes, menus, and widget areas for the public site.</p>
      <ul style={{ listStyle: 'none', padding: 0, marginTop: 16, display: 'grid', gap: 8, maxWidth: 360 }}>
        <li>
          <Link className="v-btn" href="/appearance/themes">
            Themes
          </Link>
        </li>
        <li>
          <Link className="v-btn" href="/appearance/menus">
            Menus
          </Link>
        </li>
        <li>
          <Link className="v-btn" href="/appearance/widgets">
            Widgets
          </Link>
        </li>
      </ul>
    </main>
  );
}
