export default function ContentPagesPage() {
  return (
    <main>
      <h1 style={{ marginTop: 0 }}>Pages</h1>
      <p style={{ color: 'var(--muted)' }}>
        Static pages CMS shell. Posts are fully wired under{' '}
        <a href="/content/posts">Content → Posts</a>. Page create/edit APIs can extend the same
        content package patterns.
      </p>
      <p style={{ fontSize: 13, color: 'var(--muted)' }}>
        Schema already includes <code>Page</code> / translations; admin UI for pages is next iteration.
      </p>
    </main>
  );
}
