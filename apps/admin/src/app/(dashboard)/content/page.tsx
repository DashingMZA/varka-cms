export default function ContentIndexPage() {
  return (
    <main>
      <h1 style={{ marginTop: 0 }}>Content</h1>
      <ul style={{ lineHeight: 1.8 }}>
        <li>
          <a href="/content/posts">Posts</a> — create, edit, publish
        </li>
        <li>
          <a href="/content/pages">Pages</a> — shell (schema ready)
        </li>
      </ul>
    </main>
  );
}
