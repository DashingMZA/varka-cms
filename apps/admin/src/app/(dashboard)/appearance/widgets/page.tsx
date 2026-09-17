export default function AppearanceWidgetsPage() {
  return (
    <main>
      <h1 className="v-page-title">Widgets</h1>
      <p className="v-muted" style={{ maxWidth: 560 }}>
        Widget areas (Sidebar, Footer columns) will hold ordered blocks: Recent Posts,
        Categories, Search, Custom HTML, Recent Comments, Tag Cloud.
      </p>
      <div className="v-panel" style={{ marginTop: 16, padding: 16, maxWidth: 640 }}>
        <h2 style={{ marginTop: 0, fontSize: 14 }}>Reserved zones</h2>
        <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13 }}>
          <li>Sidebar</li>
          <li>Footer Column 1</li>
          <li>Footer Column 2</li>
        </ul>
      </div>
    </main>
  );
}
