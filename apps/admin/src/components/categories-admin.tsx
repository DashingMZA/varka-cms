'use client';

import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { ListTable, TableNav } from '@/components/list-table/list-table';

type Row = {
  id: string;
  translations: { name: string; slug: string }[];
  _count?: { posts: number };
};

export function CategoriesAdmin() {
  const [items, setItems] = useState<Row[]>([]);
  const [name, setName] = useState('');
  const [q, setQ] = useState('');
  const [search, setSearch] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [bulk, setBulk] = useState('');

  const load = useCallback(async () => {
    const res = await fetch('/api/categories', { credentials: 'include' });
    if (!res.ok) {
      setError(`Load failed (${res.status})`);
      return;
    }
    const data = (await res.json()) as { items: Row[] };
    setItems(data.items ?? []);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function onCreate(e: FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    const res = await fetch('/api/categories', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: name.trim() }),
    });
    if (!res.ok) {
      setError(`Create failed (${res.status})`);
      return;
    }
    setName('');
    await load();
  }

  const filtered = items.filter((r) => {
    if (!search.trim()) return true;
    const n = r.translations[0]?.name?.toLowerCase() ?? '';
    return n.includes(search.toLowerCase());
  });

  return (
    <div style={{ marginTop: 12 }}>
      {error ? <p className="v-alert v-alert--error">{error}</p> : null}
      <form onSubmit={onCreate} style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="New category name"
          aria-label="Category name"
        />
        <button type="submit" className="v-btn v-btn--primary">
          Add Category
        </button>
      </form>
      <TableNav
        bulkOptions={[{ value: 'delete', label: 'Delete' }]}
        bulkValue={bulk}
        onBulkChange={setBulk}
        onBulkApply={() => setError('Bulk delete not wired yet — use editor flows.')}
        search={q}
        onSearchChange={setQ}
        onSearchSubmit={() => setSearch(q)}
      />
      <ListTable
        isEmpty={filtered.length === 0}
        empty="No categories yet."
        headers={
          <>
            <th>Name</th>
            <th>Slug</th>
            <th>Count</th>
          </>
        }
      >
        {filtered.map((r) => (
          <tr key={r.id}>
            <td>
              <strong>{r.translations[0]?.name ?? r.id}</strong>
            </td>
            <td className="v-muted">{r.translations[0]?.slug}</td>
            <td>{r._count?.posts ?? 0}</td>
          </tr>
        ))}
      </ListTable>
    </div>
  );
}
