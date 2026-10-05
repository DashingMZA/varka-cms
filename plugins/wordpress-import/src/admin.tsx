/**
 * wordpress-import plugin — admin page (React Server Component).
 *
 * Rendered by the VARKA admin at /plugins/wordpress-import when the plugin
 * is active. Uses plain HTML forms (no client JS) posting to the plugin's
 * API routes at /api/plugins/wordpress-import/*.
 */
import { readFile } from 'node:fs/promises';
import path from 'node:path';

type ImportStatus = {
  state: 'idle' | 'running' | 'done' | 'error';
  startedAt?: string;
  finishedAt?: string;
  message?: string;
  log?: string[];
};

async function readStatus(pluginDir: string): Promise<ImportStatus> {
  try {
    const raw = await readFile(path.join(pluginDir, 'import-status.json'), 'utf8');
    return JSON.parse(raw) as ImportStatus;
  } catch {
    return { state: 'idle' };
  }
}

function fmtTime(iso?: string): string {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

export default async function WordPressImportAdmin() {
  const pluginDir =
    process.env.VARKA_PLUGIN_DIR ?? path.join(process.cwd(), 'plugins', 'wordpress-import');
  const status = await readStatus(pluginDir);
  const running = status.state === 'running';

  return (
    <div style={{ maxWidth: 720 }}>
      <p style={{ color: '#555', marginBottom: 20 }}>
        Pull posts, pages, categories, tags, authors, and media from any WordPress site&apos;s
        public REST API (<code>/wp-json/wp/v2</code>) into this VARKA site. The import is
        idempotent — re-running updates existing content instead of duplicating it.
      </p>

      <section
        style={{
          border: '1px solid #ddd',
          borderRadius: 8,
          padding: 16,
          marginBottom: 20,
          background: '#fafafa',
        }}
      >
        <h2 style={{ margin: '0 0 8px', fontSize: 16 }}>Status</h2>
        <p style={{ margin: '0 0 4px' }}>
          <strong>State:</strong>{' '}
          <span
            style={{
              fontWeight: 700,
              color:
                status.state === 'done'
                  ? '#1a7f37'
                  : status.state === 'error'
                    ? '#cf222e'
                    : status.state === 'running'
                      ? '#9a6700'
                      : '#555',
            }}
          >
            {status.state.toUpperCase()}
          </span>
        </p>
        {status.startedAt && (
          <p style={{ margin: '0 0 4px', fontSize: 13, color: '#666' }}>
            Started: {fmtTime(status.startedAt)}
            {status.finishedAt ? ` · Finished: ${fmtTime(status.finishedAt)}` : ''}
          </p>
        )}
        {status.message && (
          <p style={{ margin: '8px 0 0', fontSize: 13 }}>{status.message}</p>
        )}
        {running && (
          <p style={{ margin: '8px 0 0', fontSize: 13, color: '#9a6700' }}>
            Import is running in the background. Refresh this page to check progress.
          </p>
        )}
      </section>

      <section
        style={{ border: '1px solid #ddd', borderRadius: 8, padding: 16, marginBottom: 20 }}
      >
        <h2 style={{ margin: '0 0 12px', fontSize: 16 }}>New import</h2>
        <form method="POST" action="/api/plugins/wordpress-import/start">
          <div style={{ marginBottom: 12 }}>
            <label style={{ display: 'block', fontWeight: 600, marginBottom: 4 }}>
              WordPress site URL
            </label>
            <input
              name="wpUrl"
              type="url"
              required
              placeholder="https://example.com"
              defaultValue="https://celebrtiy.com"
              style={{
                width: '100%',
                padding: 8,
                border: '1px solid #ccc',
                borderRadius: 4,
                fontSize: 14,
              }}
            />
            <p style={{ margin: '4px 0 0', fontSize: 12, color: '#666' }}>
              The site&apos;s REST API must be reachable at <code>[url]/wp-json/wp/v2</code>.
            </p>
          </div>

          <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontWeight: 600, marginBottom: 4 }}>
                Username <span style={{ fontWeight: 400, color: '#666' }}>(optional)</span>
              </label>
              <input
                name="wpUsername"
                type="text"
                autoComplete="off"
                placeholder="For drafts & private posts"
                style={{
                  width: '100%',
                  padding: 8,
                  border: '1px solid #ccc',
                  borderRadius: 4,
                  fontSize: 14,
                }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontWeight: 600, marginBottom: 4 }}>
                Application password <span style={{ fontWeight: 400, color: '#666' }}>(optional)</span>
              </label>
              <input
                name="wpAppPassword"
                type="password"
                autoComplete="new-password"
                placeholder="WP → Users → Profile"
                style={{
                  width: '100%',
                  padding: 8,
                  border: '1px solid #ccc',
                  borderRadius: 4,
                  fontSize: 14,
                }}
              />
            </div>
          </div>

          <p style={{ margin: '0 0 12px', fontSize: 12, color: '#666' }}>
            Without credentials only published content is imported. With an application
            password, drafts, pending, scheduled, and private posts are imported too.
          </p>

          <div style={{ display: 'flex', gap: 8 }}>
            <button
              type="submit"
              disabled={running}
              style={{
                padding: '10px 20px',
                background: running ? '#999' : '#0969da',
                color: '#fff',
                border: 'none',
                borderRadius: 6,
                fontSize: 14,
                fontWeight: 600,
                cursor: running ? 'not-allowed' : 'pointer',
              }}
            >
              {running ? 'Import running…' : 'Start import'}
            </button>
            <button
              type="submit"
              formAction="/api/plugins/wordpress-import/test"
              formMethod="POST"
              style={{
                padding: '10px 20px',
                background: '#fff',
                color: '#0969da',
                border: '1px solid #0969da',
                borderRadius: 6,
                fontSize: 14,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Test connection
            </button>
          </div>
        </form>
      </section>

      {status.log && status.log.length > 0 && (
        <section
          style={{ border: '1px solid #ddd', borderRadius: 8, padding: 16 }}
        >
          <h2 style={{ margin: '0 0 8px', fontSize: 16 }}>Recent log</h2>
          <pre
            style={{
              margin: 0,
              padding: 12,
              background: '#0d1117',
              color: '#c9d1d9',
              borderRadius: 6,
              fontSize: 12,
              maxHeight: 300,
              overflow: 'auto',
              whiteSpace: 'pre-wrap',
            }}
          >
            {status.log.slice(-40).join('\n')}
          </pre>
        </section>
      )}
    </div>
  );
}
