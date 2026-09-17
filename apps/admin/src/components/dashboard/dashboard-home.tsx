'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ScreenMeta } from '@/components/screen-meta/screen-meta';

type Glance = {
  posts: number;
  postsPublished: number;
  postsDraft: number;
  pages: number;
  media: number;
  comments: number;
  commentsPending: number;
  users: number;
};

type Activity = {
  posts: { id: string; title: string; status: string; updatedAt: string }[];
  comments: {
    id: string;
    authorName: string;
    body: string;
    status: string;
    createdAt: string;
  }[];
  audit: {
    id: string;
    action: string;
    entityType: string | null;
    createdAt: string;
    actorEmail: string | null;
  }[];
};

export function DashboardHome() {
  const [glance, setGlance] = useState<Glance | null>(null);
  const [activity, setActivity] = useState<Activity | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showWidgets, setShowWidgets] = useState({
    glance: true,
    activity: true,
    quick: true,
  });

  useEffect(() => {
    try {
      const raw = localStorage.getItem('varka.screen.dashboard');
      if (raw) setShowWidgets((s) => ({ ...s, ...JSON.parse(raw) }));
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    void (async () => {
      const res = await fetch('/api/dashboard', { credentials: 'include' });
      if (!res.ok) {
        setError(`Failed to load (${res.status})`);
        return;
      }
      const data = (await res.json()) as { glance: Glance; activity: Activity };
      setGlance(data.glance);
      setActivity(data.activity);
    })();
  }, []);

  function toggleWidget(key: keyof typeof showWidgets) {
    setShowWidgets((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      try {
        localStorage.setItem('varka.screen.dashboard', JSON.stringify(next));
      } catch {
        /* ignore */
      }
      return next;
    });
  }

  return (
    <main>
      <ScreenMeta
        title="Dashboard"
        help={[
          {
            id: 'overview',
            title: 'Overview',
            body: 'At a Glance shows live counts from the database. Activity lists recent posts, comments, and audit events.',
          },
          {
            id: 'navigation',
            title: 'Navigation',
            body: 'Use the left menu to manage content, media, users, and settings. Collapse the menu with the button at the bottom of the sidebar.',
          },
        ]}
        options={[
          {
            id: 'glance',
            label: 'At a Glance',
            checked: showWidgets.glance,
            onChange: () => toggleWidget('glance'),
          },
          {
            id: 'activity',
            label: 'Activity',
            checked: showWidgets.activity,
            onChange: () => toggleWidget('activity'),
          },
          {
            id: 'quick',
            label: 'Quick Draft',
            checked: showWidgets.quick,
            onChange: () => toggleWidget('quick'),
          },
        ]}
      />

      <h1 className="v-page-title">Dashboard</h1>
      {error ? <p className="v-alert v-alert--error">{error}</p> : null}

      <div className="v-dash-grid">
        {showWidgets.glance ? (
          <section className="v-panel">
            <h2 className="v-panel__h">At a Glance</h2>
            <div className="v-panel__b">
              {!glance ? (
                <p className="v-muted">Loading…</p>
              ) : (
                <ul className="v-glance">
                  <li>
                    <Link href="/content/posts">
                      <strong>{glance.posts}</strong> Posts
                    </Link>
                    <span className="v-muted">
                      {' '}
                      ({glance.postsPublished} published, {glance.postsDraft} draft)
                    </span>
                  </li>
                  <li>
                    <Link href="/content/pages">
                      <strong>{glance.pages}</strong> Pages
                    </Link>
                  </li>
                  <li>
                    <Link href="/comments">
                      <strong>{glance.comments}</strong> Comments
                    </Link>
                    {glance.commentsPending > 0 ? (
                      <span className="v-muted">
                        {' '}
                        ({glance.commentsPending} pending)
                      </span>
                    ) : null}
                  </li>
                  <li>
                    <Link href="/media">
                      <strong>{glance.media}</strong> Media
                    </Link>
                  </li>
                  <li>
                    <Link href="/users">
                      <strong>{glance.users}</strong> Users
                    </Link>
                  </li>
                </ul>
              )}
            </div>
          </section>
        ) : null}

        {showWidgets.activity ? (
          <section className="v-panel">
            <h2 className="v-panel__h">Activity</h2>
            <div className="v-panel__b">
              {!activity ? (
                <p className="v-muted">Loading…</p>
              ) : (
                <>
                  <h3 className="v-subh">Recently updated posts</h3>
                  <ul className="v-activity">
                    {activity.posts.length === 0 ? (
                      <li className="v-muted">No posts yet.</li>
                    ) : (
                      activity.posts.map((p) => (
                        <li key={p.id}>
                          <Link href={`/content/posts/${p.id}`}>{p.title}</Link>
                          <span className="v-muted">
                            {' '}
                            · {p.status} · {new Date(p.updatedAt).toLocaleString()}
                          </span>
                        </li>
                      ))
                    )}
                  </ul>
                  <h3 className="v-subh">Recent comments</h3>
                  <ul className="v-activity">
                    {activity.comments.length === 0 ? (
                      <li className="v-muted">No comments yet.</li>
                    ) : (
                      activity.comments.map((c) => (
                        <li key={c.id}>
                          <strong>{c.authorName}</strong>
                          <span className="v-muted"> · {c.status}</span>
                          <div className="v-muted" style={{ fontSize: 12 }}>
                            {c.body.slice(0, 120)}
                            {c.body.length > 120 ? '…' : ''}
                          </div>
                        </li>
                      ))
                    )}
                  </ul>
                  <h3 className="v-subh">Audit</h3>
                  <ul className="v-activity">
                    {activity.audit.length === 0 ? (
                      <li className="v-muted">No audit events.</li>
                    ) : (
                      activity.audit.map((a) => (
                        <li key={a.id}>
                          <code style={{ fontSize: 12 }}>{a.action}</code>
                          {a.entityType ? (
                            <span className="v-muted"> · {a.entityType}</span>
                          ) : null}
                          <span className="v-muted">
                            {' '}
                            · {new Date(a.createdAt).toLocaleString()}
                          </span>
                        </li>
                      ))
                    )}
                  </ul>
                </>
              )}
            </div>
          </section>
        ) : null}

        {showWidgets.quick ? (
          <section className="v-panel">
            <h2 className="v-panel__h">Quick Draft</h2>
            <div className="v-panel__b">
              <QuickDraft />
            </div>
          </section>
        ) : null}
      </div>
    </main>
  );
}

function QuickDraft() {
  const [title, setTitle] = useState('');
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function create() {
    if (!title.trim()) return;
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ title: title.trim() }),
      });
      if (!res.ok) {
        setMsg(`Failed (${res.status})`);
        return;
      }
      const post = (await res.json()) as { id: string };
      window.location.href = `/content/posts/${post.id}`;
    } catch {
      setMsg('Network error');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ display: 'grid', gap: 8, maxWidth: 360 }}>
      <input
        type="text"
        placeholder="Post title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        style={{
          padding: '6px 8px',
          border: '1px solid var(--wp-border)',
          borderRadius: 3,
        }}
      />
      <button
        type="button"
        className="v-btn v-btn--primary"
        disabled={busy || !title.trim()}
        onClick={() => void create()}
      >
        {busy ? 'Saving…' : 'Save Draft'}
      </button>
      {msg ? <p className="v-alert v-alert--error">{msg}</p> : null}
    </div>
  );
}
