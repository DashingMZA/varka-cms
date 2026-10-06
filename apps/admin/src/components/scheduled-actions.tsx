'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useMessages } from '@/lib/i18n';
import { listScheduledPostsAction } from '@/actions/tools';

function L(
  t: (ns: 'tools' | 'common', key: string) => string,
  key: string,
  fallback: string,
): string {
  const v = t('tools', key);
  if (!v || v === key || v.startsWith('tools.')) return fallback;
  return v;
}

type ScheduledPost = {
  id: string;
  scheduledAt: string | null;
  translations: Array<{ title: string; slug: string }>;
};

export function ScheduledActions() {
  const { t } = useMessages();
  const [posts, setPosts] = useState<ScheduledPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      const res = await listScheduledPostsAction();
      if (!res.ok) {
        setError(res.error);
      } else {
        setPosts(res.data as ScheduledPost[]);
      }
      setLoading(false);
    })();
  }, []);

  if (loading) return <p className="v-muted">{L(t, 'loading', 'Loading…')}</p>;

  return (
    <div style={{ maxWidth: 800 }}>
      <h1 className="v-page-title">{L(t, 'scheduledActions', 'Scheduled Actions')}</h1>
      <p className="v-muted">
        {L(t, 'scheduledDesc', 'Posts scheduled for future publishing.')}
      </p>

      {error ? (
        <p role="alert" className="v-alert v-alert--error">
          {error}
        </p>
      ) : null}

      {posts.length === 0 ? (
        <p className="v-muted">{L(t, 'noScheduled', 'No scheduled posts.')}</p>
      ) : (
        <div className="v-table-wrap">
                <div className="v-card" style={{ padding: 0, overflow: "hidden" }}>
          <table className="v-table">
          <thead>
            <tr>
              <th>{L(t, 'title', 'Title')}</th>
              <th>{L(t, 'scheduledFor', 'Scheduled For')}</th>
              <th>{L(t, 'actions', 'Actions')}</th>
            </tr>
          </thead>
          <tbody>
            {posts.map((p) => (
              <tr key={p.id}>
                <td>{p.translations[0]?.title || '—'}</td>
                <td>
                  {p.scheduledAt
                    ? new Date(p.scheduledAt).toLocaleString()
                    : '—'}
                </td>
                <td>
                  <Link href={`/content/posts/${p.translations[0]?.slug || p.id}`}>{L(t, 'edit', 'Edit')}</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
        </div>
      )}
    </div>
  );
}
