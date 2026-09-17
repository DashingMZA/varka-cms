export default function PagesListPage() {
  return (
    <main>
      <h1 className="v-page-title">Pages</h1>
      <p className="v-page-desc">
        Page list UI mirrors Posts. Create/edit APIs use the Page model; wire the same list table
        pattern as posts when ready.
      </p>
      <div className="v-panel">
        <div className="v-panel__b">
          <p className="v-muted" style={{ margin: 0 }}>
            No pages yet — use Posts for now, or implement listPages next.
          </p>
        </div>
      </div>
    </main>
  );
}
