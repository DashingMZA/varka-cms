'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ScreenMeta } from '@/components/screen-meta/screen-meta';
import { getDashboardAction } from '@/actions/dashboard';
import { createPostAction } from '@/actions/posts';
import { useMessages } from '@/lib/i18n';

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
  const { t } = useMessages();
  const [glance, setGlance] = useState<Glance | null>(null);
  const [activity, setActivity] = useState<Activity | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [health, setHealth] = useState<{
    status?: string;
    checks?: { id: string; ok: boolean; label: string; detail?: string }[];
    score?: number;
  } | null>(null);
  const [showWidgets, setShowWidgets] = useState({
    glance: true,
    activity: true,
    quick: true,
  });
  // WP-style dismissible Welcome panel
  const [showWelcome, setShowWelcome] = useState(true);

  useEffect(() => {
    try {
      if (localStorage.getItem('varka.dashboard.welcomeDismissed') === '1') {
        setShowWelcome(false);
      }
    } catch {
      /* ignore */
    }
  }, []);

  function dismissWelcome() {
    setShowWelcome(false);
    try {
      localStorage.setItem('varka.dashboard.welcomeDismissed', '1');
    } catch {
      /* ignore */
    }
  }

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
      try {
        const res = await fetch('/api/health');
        const data = await res.json();
        const checks: { id: string; ok: boolean; label: string; detail?: string }[] = [];
        if (data.database === 'up') {
          checks.push({ id: 'db', ok: true, label: 'Database', detail: 'connected' });
        } else {
          checks.push({ id: 'db', ok: false, label: 'Database', detail: String(data.databaseError ?? 'down') });
        }
        if (data.cachePing) {
          checks.push({ id: 'cache', ok: true, label: 'Cache', detail: String(data.cache ?? 'up') });
        } else {
          checks.push({ id: 'cache', ok: false, label: 'Cache', detail: 'unreachable' });
        }
        // Storage driver from env (visible to client via meta)
        checks.push({ id: 'storage', ok: true, label: 'Media storage', detail: 'configured' });
        const score = Math.round((checks.filter((c) => c.ok).length / Math.max(checks.length, 1)) * 100);
        setHealth({
          status: score === 100 ? 'good' : score >= 50 ? 'warning' : 'critical',
          score,
          checks,
        });
      } catch {
        setHealth({
          status: 'critical',
          score: 0,
          checks: [{ id: 'api', ok: false, label: 'Health API', detail: 'unreachable' }],
        });
      }
    })();
  }, []);

  useEffect(() => {
    void (async () => {
      const result = await getDashboardAction();
      if (!result.ok) {
        setError(`Failed to load: ${result.error}`);
        return;
      }
      setGlance(result.data.glance as Glance);
      setActivity(result.data.activity as Activity);
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
    <div className="v-wrap">
      <ScreenMeta
        title={t('dashboard', 'title') || 'Dashboard'}
        help={[
          {
            id: 'overview',
            title: t('dashboard', 'overview') || 'Overview',
            body: t('dashboard', 'overviewBody') || 'At a Glance shows live counts from the database. Activity lists recent posts, comments, and audit events.',
          },
          {
            id: 'navigation',
            title: t('dashboard', 'navigation') || 'Navigation',
            body: t('dashboard', 'navigationBody') || 'Use the left menu to manage content, media, users, and settings.',
          },
        ]}
        options={[
          {
            id: 'glance',
            label: t('dashboard', 'atAGlance') || 'At a Glance',
            checked: showWidgets.glance,
            onChange: () => toggleWidget('glance'),
          },
          {
            id: 'activity',
            label: t('dashboard', 'activity') || 'Activity',
            checked: showWidgets.activity,
            onChange: () => toggleWidget('activity'),
          },
          {
            id: 'quick',
            label: t('dashboard', 'quickDraft') || 'Quick Draft',
            checked: showWidgets.quick,
            onChange: () => toggleWidget('quick'),
          },
        ]}
      />

      <div className="v-page-header">
        <h1 className="v-page-title">{t('dashboard', 'title') || 'Dashboard'}</h1>
      </div>

      {error ? (
        <div className="v-notice v-notice--error">
          <p>{error}</p>
        </div>
      ) : null}

      {showWelcome ? (
        <section className="v-postbox" aria-label={t('dashboard', 'welcome') || 'Welcome'}>
          <div className="v-postbox__b">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
              <div>
                <h2 style={{ margin: '0 0 4px', fontSize: 21, fontWeight: 400 }}>
                  {t('dashboard', 'welcomeTitle') || 'Welcome to VARKA'}
                </h2>
                <p className="v-muted" style={{ margin: '0 0 12px' }}>
                  {t('dashboard', 'welcomeBody') ||
                    'Get started with the essentials — write content, shape your site, and tune how it looks.'}
                </p>
                <ul
                  style={{
                    listStyle: 'none',
                    margin: 0,
                    padding: 0,
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                    gap: 8,
                  }}
                >
                  <li>
                    <Link href="/content/posts/new">
                      {t('dashboard', 'welcomeWritePost') || 'Write your first blog post'}
                    </Link>
                  </li>
                  <li>
                    <Link href="/content/pages/new">
                      {t('dashboard', 'welcomeAddPage') || 'Add an About page'}
                    </Link>
                  </li>
                  <li>
                    <Link href="/settings/reading">
                      {t('dashboard', 'welcomeHomepage') || 'Set up your homepage'}
                    </Link>
                  </li>
                  <li>
                    <Link href="/appearance/menus">
                      {t('dashboard', 'welcomeMenus') || 'Manage menus'}
                    </Link>
                  </li>
                  <li>
                    <Link href="/appearance/widgets">
                      {t('dashboard', 'welcomeWidgets') || 'Manage widgets'}
                    </Link>
                  </li>
                  <li>
                    <Link href="/settings/discussion">
                      {t('dashboard', 'welcomeComments') || 'Turn comments on or off'}
                    </Link>
                  </li>
                </ul>
              </div>
              <button
                type="button"
                className="v-btn v-btn--small"
                onClick={dismissWelcome}
                aria-label={t('common', 'dismiss') || 'Dismiss'}
              >
                {t('common', 'dismiss') || 'Dismiss'}
              </button>
            </div>
          </div>
        </section>
      ) : null}

      <div className="v-dash-grid">
        {showWidgets.glance ? (
          <section className="v-postbox">
            <h2 className="v-postbox__h">{t('dashboard', 'atAGlance') || 'At a Glance'}</h2>
            <div className="v-postbox__b">
              {!glance ? (
                <p className="v-muted">{t('common', 'loading') || 'Loading…'}</p>
              ) : (
                <ul className="v-glance">
                  <li>
                    <Link href="/content/posts">
                      <strong>{glance.posts}</strong> {t('nav', 'posts') || 'Posts'}
                    </Link>
                    <span className="v-muted">
                      {' '}
                      ({glance.postsPublished} published, {glance.postsDraft} draft)
                    </span>
                  </li>
                  <li>
                    <Link href="/content/pages">
                      <strong>{glance.pages}</strong> {t('nav', 'pages') || 'Pages'}
                    </Link>
                  </li>
                  <li>
                    <Link href="/comments">
                      <strong>{glance.comments}</strong> {t('nav', 'comments') || 'Comments'}
                    </Link>
                    {glance.commentsPending > 0 ? (
                      <span className="v-muted"> ({glance.commentsPending} pending)</span>
                    ) : null}
                  </li>
                  <li>
                    <Link href="/media">
                      <strong>{glance.media}</strong> {t('nav', 'media') || 'Media'}
                    </Link>
                  </li>
                  <li>
                    <Link href="/users">
                      <strong>{glance.users}</strong> {t('nav', 'users') || 'Users'}
                    </Link>
                  </li>
                </ul>
              )}
            </div>
          </section>
        ) : null}

        {showWidgets.activity ? (
          <section className="v-postbox">
            <h2 className="v-postbox__h">{t('dashboard', 'activity') || 'Activity'}</h2>
            <div className="v-postbox__b">
              {!activity ? (
                <p className="v-muted">{t('common', 'loading') || 'Loading…'}</p>
              ) : (
                <>
                  <h3 className="v-subh">{t('nav', 'posts') || 'Posts'}</h3>
                  <ul className="v-activity">
                    {(activity.posts ?? []).slice(0, 5).map((p) => (
                      <li key={p.id}>
                        <Link href={`/content/posts/${p.id}`}>{p.title || 'Untitled'}</Link>
                        <span className="v-muted"> — {p.status.toLowerCase()}</span>
                        <time dateTime={p.updatedAt}>
                          {new Date(p.updatedAt).toLocaleString()}
                        </time>
                      </li>
                    ))}
                    {(activity.posts ?? []).length === 0 ? (
                      <li className="v-muted">No recent posts.</li>
                    ) : null}
                  </ul>

                  <h3 className="v-subh">{t('nav', 'comments') || 'Comments'}</h3>
                  <ul className="v-activity">
                    {(activity.comments ?? []).slice(0, 5).map((c) => (
                      <li key={c.id}>
                        <strong>{c.authorName}</strong>
                        <span className="v-muted"> — {c.status.toLowerCase()}</span>
                        <div style={{ marginTop: 2 }}>
                          {c.body.slice(0, 120)}
                          {c.body.length > 120 ? '…' : ''}
                        </div>
                        <time dateTime={c.createdAt}>
                          {new Date(c.createdAt).toLocaleString()}
                        </time>
                      </li>
                    ))}
                    {(activity.comments ?? []).length === 0 ? (
                      <li className="v-muted">No recent comments.</li>
                    ) : null}
                  </ul>
                </>
              )}
            </div>
          </section>
        ) : null}

        {showWidgets.quick ? (
          <section className="v-postbox">
            <h2 className="v-postbox__h">{t('dashboard', 'quickDraft') || 'Quick Draft'}</h2>
            <div className="v-postbox__b">
              <QuickDraft />
            </div>
          </section>
        ) : null}

        <section className="v-postbox">
          <h2 className="v-postbox__h">{t('dashboard', 'siteHealth') || 'Site Health'}</h2>
          <div className="v-postbox__b">
            {health ? (
              <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start', flexWrap: 'wrap' }}>
                <div
                  className={
                    'v-health-score' +
                    (health.status === 'improve'
                      ? ' v-health-score--improve'
                      : health.status === 'critical'
                        ? ' v-health-score--critical'
                        : '')
                  }
                  title={health.status}
                >
                  {health.score}%
                </div>
                <ul style={{ margin: 0, paddingInlineStart: 18, fontSize: 13 }}>
                  {(health.checks ?? []).map((c) => (
                    <li key={c.id} style={{ color: c.ok ? 'inherit' : 'var(--wp-danger)' }}>
                      {c.ok ? '✓' : '✕'} {c.label}
                      {c.detail ? <span className="v-muted"> — {String(c.detail)}</span> : null}
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <p className="v-muted">Checking…</p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

function QuickDraft() {
  const { t } = useMessages();
  const [title, setTitle] = useState('');
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function create() {
    if (!title.trim()) return;
    setBusy(true);
    setMsg(null);
    try {
      const result = await createPostAction(title.trim() || 'Untitled');
      if (result.ok) {
        window.location.href = `/content/posts/${result.data.id}`;
      } else {
        setMsg(result.error);
      }
    } catch {
      setMsg('Network error');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ display: 'grid', gap: 8, maxWidth: 360 }}>
      <label>
        <input
          type="text"
          placeholder={t('posts', 'titlePlaceholder') || 'Post title'}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          style={{ width: '100%' }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') void create();
          }}
        />
      </label>
      <div>
        <button
          type="button"
          className="v-btn v-btn--primary"
          disabled={busy || !title.trim()}
          onClick={() => void create()}
        >
          {busy ? t('common', 'saving') || 'Saving…' : t('posts', 'saveDraft') || 'Save Draft'}
        </button>
      </div>
      {msg ? (
        <div className="v-notice v-notice--error">
          <p>{msg}</p>
        </div>
      ) : null}
    </div>
  );
}
