'use client';

import { useMessages } from '@/lib/i18n';
import { useCallback, useEffect, useState } from 'react';
import { Subsubsub } from '@/components/list-table/list-table';
import {
  listCommentsAction,
  commentCountsAction,
  setCommentStatusAction,
  deleteCommentAction,
  bulkCommentsAction,
} from '@/actions/comments';

type CommentRow = {
  id: string;
  authorName: string;
  authorEmail: string | null;
  body: string;
  status: string;
  createdAt: string;
};

type Counts = Record<string, number>;

export function CommentsModeration() {
  const { t } = useMessages();
  const [items, setItems] = useState<CommentRow[]>([]);
  const [counts, setCounts] = useState<Counts>({});
  const [filter, setFilter] = useState('all');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulk, setBulk] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [listRes, countsRes] = await Promise.all([
        listCommentsAction({ status: filter !== 'all' ? filter.toUpperCase() : undefined }),
        commentCountsAction(),
      ]);
      if (!listRes.ok) {
        setError(listRes.error);
        setLoading(false);
        return;
      }
      const data = listRes.data as { items?: CommentRow[] } | CommentRow[];
      setItems(Array.isArray(data) ? data : (data.items ?? []));
      if (countsRes.ok) {
        setCounts((countsRes.data as Counts) ?? {});
      }
      setSelected(new Set());
    } catch {
      setError(t('errors', 'networkError'));
    }
    setLoading(false);
  }, [filter, t]);

  useEffect(() => {
    void load();
  }, [load]);

  async function applyBulk() {
    if (!bulk || selected.size === 0) return;
    setLoading(true);
    const ids = Array.from(selected);
    if (bulk === 'DELETE') {
      await bulkCommentsAction(ids, 'DELETE');
    } else {
      await bulkCommentsAction(ids, bulk as 'APPROVED' | 'PENDING' | 'SPAM' | 'TRASH');
    }
    await load();
    setBulk('');
  }

  async function setStatus(id: string, status: 'APPROVED' | 'PENDING' | 'SPAM' | 'TRASH') {
    await setCommentStatusAction(id, status);
    await load();
  }

  async function remove(id: string) {
    await deleteCommentAction(id);
    await load();
  }

  return (
    <div>
      <div className="v-page-header">
        <h1 className="v-page-title">{t('comments', 'title') || 'Comments'}</h1>
      </div>

      {error ? (
        <p role="alert" className="v-alert v-alert--error">
          {error}
        </p>
      ) : null}

      <Subsubsub
        active={filter}
        onChange={setFilter}
        items={[
          { id: 'all', label: `${t('comments', 'all') || 'All'} (${counts.all ?? counts.ALL ?? '—'})` },
          { id: 'pending', label: `${t('comments', 'pending') || 'Pending'} (${counts.pending ?? counts.PENDING ?? '—'})` },
          { id: 'approved', label: `${t('comments', 'approved') || 'Approved'} (${counts.approved ?? counts.APPROVED ?? '—'})` },
          { id: 'spam', label: `${t('comments', 'spam') || 'Spam'} (${counts.spam ?? counts.SPAM ?? '—'})` },
          { id: 'trash', label: `${t('comments', 'trash') || 'Trash'} (${counts.trash ?? counts.TRASH ?? '—'})` },
        ]}
      />

      {items.length === 0 && !loading ? (
        <p className="v-muted" style={{ padding: '20px 0' }}>
          {t('comments', 'noComments') || 'No comments found.'}
        </p>
      ) : (
        <>
          <div className="v-list-table-top">
            <div className="v-bulk">
              <select value={bulk} onChange={(e) => setBulk(e.target.value)}>
                <option value="">{t('comments', 'bulkActions') || 'Bulk actions'}</option>
                <option value="APPROVED">{t('comments', 'approve') || 'Approve'}</option>
                <option value="PENDING">{t('comments', 'unapprove') || 'Unapprove'}</option>
                <option value="SPAM">{t('comments', 'spam') || 'Mark as spam'}</option>
                <option value="TRASH">{t('comments', 'trash') || 'Move to trash'}</option>
                <option value="DELETE">{t('comments', 'delete') || 'Delete permanently'}</option>
              </select>
              <button
                type="button"
                className="v-btn"
                disabled={!bulk || selected.size === 0}
                onClick={() => void applyBulk()}
              >
                {t('common', 'apply') || 'Apply'}
              </button>
              {loading ? <span className="v-muted">{t('common', 'loading')}</span> : null}
            </div>
          </div>

                    <div className="v-card" style={{ padding: 0, overflow: "hidden" }}>
  <table className="v-list-table">
              <thead>
                <tr>
                  <td className="check-col">
                    <input
                      type="checkbox"
                      checked={items.length > 0 && selected.size === items.length}
                      onChange={(e) => {
                        if (e.target.checked) setSelected(new Set(items.map((c) => c.id)));
                        else setSelected(new Set());
                      }}
                    />
                  </td>
                  <th>{t('comments', 'author') || 'Author'}</th>
                  <th>{t('comments', 'comment') || 'Comment'}</th>
                  <th>{t('comments', 'inResponseTo') || 'In response to'}</th>
                  <th>{t('comments', 'submittedOn') || 'Submitted on'}</th>
                </tr>
              </thead>
              <tbody>
                {loading && items.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="v-muted">
                      {t('common', 'loading')}
                    </td>
                  </tr>
                ) : (
                  items.map((c) => (
                    <tr key={c.id}>
                      <td className="check-col">
                        <input
                          type="checkbox"
                          checked={selected.has(c.id)}
                          onChange={(e) => {
                            setSelected((prev) => {
                              const n = new Set(prev);
                              if (e.target.checked) n.add(c.id);
                              else n.delete(c.id);
                              return n;
                            });
                          }}
                        />
                      </td>
                      <td>
                        <strong>{c.authorName}</strong>
                        {c.authorEmail ? (
                          <div className="v-muted" style={{ fontSize: 12 }}>
                            {c.authorEmail}
                          </div>
                        ) : null}
                      </td>
                      <td>
                        <div style={{ maxWidth: 420 }}>{c.body}</div>
                        <div className="row-actions">
                          <a href="#" onClick={(e) => { e.preventDefault(); void setStatus(c.id, 'APPROVED'); }}>
                            {t('comments', 'approve') || 'Approve'}
                          </a>
                          {' | '}
                          <a href="#" onClick={(e) => { e.preventDefault(); void setStatus(c.id, 'SPAM'); }}>
                            {t('comments', 'spam') || 'Spam'}
                          </a>
                          {' | '}
                          <a href="#" className="trash" onClick={(e) => { e.preventDefault(); void remove(c.id); }}>
                            {t('common', 'delete') || 'Delete'}
                          </a>
                        </div>
                      </td>
                      <td>{(c as { postTitle?: string }).postTitle || '—'}</td>
                      <td style={{ fontSize: 12 }}>
                        {c.createdAt ? new Date(c.createdAt).toLocaleString() : '—'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
            </div>
          </>
        )}
      </div>
    );
  }
