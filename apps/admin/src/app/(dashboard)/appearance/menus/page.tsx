export default function AppearanceMenusPage() {
  return (
    <main>
      <h1 className="v-page-title">Menus</h1>
      <p className="v-muted" style={{ maxWidth: 560 }}>
        Drag-and-drop menu builder (Primary / Footer / Mobile locations) is the next
        Appearance milestone. Structure is reserved here so navigation matches WordPress
        IA; items will persist via SiteSetting / Menu models.
      </p>
      <div className="v-panel" style={{ marginTop: 16, padding: 16, maxWidth: 640 }}>
        <h2 style={{ marginTop: 0, fontSize: 14 }}>Planned capabilities</h2>
        <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13 }}>
          <li>Named menus with nested items (pages, posts, categories, custom links)</li>
          <li>Assign menu → theme location</li>
          <li>Reorder / nest via drag-and-drop</li>
        </ul>
      </div>
    </main>
  );
}
