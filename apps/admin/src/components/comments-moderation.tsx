'use client';

import { useCallback, useEffect, useState } from 'react';

type CommentRow = {
  id: string;
  postId: string;
  authorName: string;
  authorEmail: string | null;
  body: string;
  status: string;
  createdAt: string;
  post?: { id?: string; translations?: Array<{ title: string; slug: string }> };
};

type Counts = {
  all: number;
  pending: number;
  approved: number;
  spam: number;
  trash: number;
};

const FILTERS: { key: string; label: string; countKey: keyof Counts }[] = [
  { key: '', label: 'All', countKey: 'all' },
  { key: 'PENDING', label: 'Pending', countKey: 'pending' },
  { key: 'APPROVED', label: 'Approved', countKey: 'approved' },
  { key: 'SPAM', label: 'Spam', countKey: 'spam' },
  { key: 'TRASH', label: 'Trash', countKey: 'trash' },
];

export function CommentsModeration() {
  const [items, setItems] = useState<CommentRow[]>([]);
  const [counts, setCounts] = useState<Counts | null>(null);
  const [filter, setFilter] = useState('PENDING');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulk, setBulk] = useState('approve');
  const [error, setError] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editBody, setEditBody] = useState('');
  const [replyId, setReplyId] = useState<string | null>(null);
  const [replyBody, setReplyBody] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const params = new URLSearchParams();
    if (filter) params.set('status', filter);
    if (search.trim()) params.set('search', search.trim());
    const q = params.toString() ? `?${params}` : '';
    const [listRes, countRes] = await Promise.all([
      fetch(`/api/comments${q}`, { credentials: 'include' }),
      fetch('/api/comments?counts=1', { credentials: 'include' }),
    ]);
    if (!listRes.ok) {
      setError(`Load failed (${listRes.status})`);
      return;
    }
    const data = (await listRes.json()) as { items: CommentRow[] };
    setItems(data.items ?? []);
    setSelected(new Set());
    if (countRes.ok) {
      setCounts((await countRes.json()) as Counts);
    }
  }, [filter, search]);

  useEffect(() => {
    void load();
  }, [load]);

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    if (selected.size === items.length) setSelected(new Set());
    else setSelected(new Set(items.map((c) => c.id)));
  }

  async function setStatus(id: string, status: string) {
    setBusy(true);
    setError(null);
    const res = await fetch(`/api/comments/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ status }),
    });
    setBusy(false);
    if (!res.ok) {
      setError(`Update failed (${res.status})`);
      return;
    }
    await load();
  }

  async function runBulk() {
    if (selected.size === 0) return;
    setBusy(true);
    setError(null);
    setMsg(null);
    const res = await fetch('/api/comments', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ action: bulk, ids: [...selected] }),
    });
    setBusy(false);
    if (!res.ok) {
      const body = (await res.json().catch(() => ({}))) as { error?: string };
      setError(body.error ?? `Bulk failed (${res.status})`);
      return;
    }
    setMsg(`Bulk “${bulk}” applied to ${selected.size} comment(s)`);
    await load();
  }

  async function remove(id: string) {
    if (!confirm('Delete permanently?')) return;
    const res = await fetch(`/api/comments/${id}`, {
      method: 'DELETE',
      credentials: 'include',
    });
    if (!res.ok) {
      setError(`Delete failed (${res.status})`);
      return;
    }
    await load();
  }

  async function saveEdit(id: string) {
    setBusy(true);
    const res = await fetch(`/api/comments/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ body: editBody }),
    });
    setBusy(false);
    if (!res.ok) {
      setError('Edit failed');
      return;
    }
    setEditingId(null);
    await load();
  }

  async function sendReply(c: CommentRow) {
    if (!replyBody.trim()) return;
    setBusy(true);
    const res = await fetch(`/api/comments/${c.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ reply: replyBody, postId: c.postId ?? c.post?.id }),
    });
    setBusy(false);
    if (!res.ok) {
      const body = (await res.json().catch(() => ({}))) as { error?: string };
      setError(body.error ?? 'Reply failed');
      return;
    }
    setReplyId(null);
    setReplyBody('');
    setMsg('Reply posted (approved)');
    await load();
  }

  return (
    <div>
      <div className="v-page-header" style={{ marginTop: 8 }}>
        <h1 className="v-page-title" style={{ fontSize: 20 }}>
          Comments
        </h1>
      </div>
      <p className="v-page-desc">
        WordPress-style moderation: filters, bulk actions, search, edit, and staff reply.
      </p>

      {error ? (
        <div className="v-alert v-alert--error" role="alert">
          {error}
        </div>
      ) : null}
      {msg ? <div className="v-alert v-alert--ok">{msg}</div> : null}

      <div className="v-subsubsub" style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
        {FILTERS.map((f) => {
          const n = counts?.[f.countKey];
          const active = filter === f.key;
          return (
            <button
              key={f.key || 'all'}
              type="button"
              className={`v-btn${active ? ' v-btn--primary' : ''}`}
              onClick={() => setFilter(f.key)}
            >
              {f.label}
              {typeof n === 'number' ? ` (${n})` : ''}
            </button>
          );
        })}
      </div>

      <div className="v-tablenav" style={{ marginBottom: 12 }}>
        <select value={bulk} onChange={(e) => setBulk(e.target.value)} aria-label="Bulk action">
          <option value="approve">Approve</option>
          <option value="unapprove">Unapprove</option>
          <option value="spam">Mark as spam</option>
          <option value="trash">Move to trash</option>
          <option value="delete">Delete permanently</option>
        </select>
        <button
          type="button"
          className="v-btn"
          disabled={busy || selected.size === 0}
          onClick={() => void runBulk()}
        >
          Apply
        </button>
        <input
          type="search"
          placeholder="Search author or content…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') void load();
          }}
          style={{ minWidth: 200 }}
        />
        <button type="button" className="v-btn" onClick={() => void load()}>
          Search
        </button>
        <span className="v-muted" style={{ marginLeft: 'auto' }}>
          {selected.size} selected · {items.length} shown
        </span>
      </div>

      <div className="v-table-wrap">
        <table className="v-table">
          <thead>
            <tr>
              <th style={{ width: 36 }}>
                <input
                  type="checkbox"
                  checked={items.length > 0 && selected.size === items.length}
                  onChange={toggleAll}
                  aria-label="Select all"
                />
              </th>
              <th>Author</th>
              <th>Comment</th>
              <th>In response to</th>
              <th>Submitted on</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan={5} className="v-muted">
                  No comments in this view.
                </td>
              </tr>
            ) : (
              items.map((c) => {
                const postTitle = c.post?.translations?.[0]?.title ?? c.postId;
                return (
                  <tr key={c.id}>
                    <td>
                      <input
                        type="checkbox"
                        checked={selected.has(c.id)}
                        onChange={() => toggle(c.id)}
                        aria-label={`Select comment by ${c.authorName}`}
                      />
                    </td>
                    <td>
                      <strong>{c.authorName}</strong>
                      {c.authorEmail ? (
                        <div className="v-muted" style={{ fontSize: 12 }}>
                          {c.authorEmail}
                        </div>
                      ) : null}
                      <div className="v-muted" style={{ fontSize: 11, marginTop: 4 }}>
                        {c.status}
                      </div>
                    </td>
                    <td style={{ maxWidth: 420 }}>
                      {editingId === c.id ? (
                        <div style={{ display: 'grid', gap: 6 }}>
                          <textarea
                            rows={3}
                            value={editBody}
                            onChange={(e) => setEditBody(e.target.value)}
                            style={{ width: '100%' }}
                          />
                          <div className="v-btn-row">
                            <button
                              type="button"
                              className="v-btn v-btn--primary"
                              disabled={busy}
                              onClick={() => void saveEdit(c.id)}
                            >
                              Save
                            </button>
                            <button type="button" className="v-btn" onClick={() => setEditingId(null)}>
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <p style={{ margin: '0 0 8px', whiteSpace: 'pre-wrap' }}>{c.body}</p>
                      )}
                      <div className="v-row-actions" style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        {c.status !== 'APPROVED' ? (
                          <button type="button" className="v-btn" onClick={() => void setStatus(c.id, 'APPROVED')}>
                            Approve
                          </button>
                        ) : (
                          <button type="button" className="v-btn" onClick={() => void setStatus(c.id, 'PENDING')}>
                            Unapprove
                          </button>
                        )}
                        {c.status !== 'SPAM' ? (
                          <button type="button" className="v-btn" onClick={() => void setStatus(c.id, 'SPAM')}>
                            Spam
                          </button>
                        ) : (
                          <button type="button" className="v-btn" onClick={() => void setStatus(c.id, 'PENDING')}>
                            Not spam
                          </button>
                        )}
                        {c.status !== 'TRASH' ? (
                          <button type="button" className="v-btn" onClick={() => void setStatus(c.id, 'TRASH')}>
                            Trash
                          </button>
                        ) : null}
                        <button
                          type="button"
                          className="v-btn"
                          onClick={() => {
                            setEditingId(c.id);
                            setEditBody(c.body);
                          }}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          className="v-btn"
                          onClick={() => {
                            setReplyId(c.id);
                            setReplyBody('');
                          }}
                        >
                          Reply
                        </button>
                        <button type="button" className="v-btn v-btn--danger" onClick={() => void remove(c.id)}>
                          Delete
                        </button>
                      </div>
                      {replyId === c.id ? (
                        <div style={{ marginTop: 8, display: 'grid', gap: 6 }}>
                          <textarea
                            rows={2}
                            value={replyBody}
                            onChange={(e) => setReplyBody(e.target.value)}
                            placeholder="Reply as Site Admin…"
                            style={{ width: '100%' }}
                          />
                          <div className="v-btn-row">
                            <button
                              type="button"
                              className="v-btn v-btn--primary"
                              disabled={busy}
                              onClick={() => void sendReply(c)}
                            >
                              Reply
                            </button>
                            <button type="button" className="v-btn" onClick={() => setReplyId(null)}>
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : null}
                    </td>
                    <td>
                      <span className="row-title">{postTitle}</span>
                    </td>
                    <td className="v-muted" style={{ whiteSpace: 'nowrap' }}>
                      {new Date(c.createdAt).toLocaleString()}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
