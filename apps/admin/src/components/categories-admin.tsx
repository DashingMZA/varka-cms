'use client';

import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { ListTable, TableNav } from '@/components/list-table/list-table';
import { useMessages } from '@/lib/i18n';

type Row = {
  id: string;
  translations: { name: string; slug: string }[];
  _count?: { posts: number };
};

export function CategoriesAdmin() {
  const { t } = useMessages();
  const [items, setItems] = useState<Row[]>([]);
  const [name, setName] = useState('');
  const [q, setQ] = useState('');
  const [search, setSearch] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [bulk, setBulk] = useState('');

  const load = useCallback(async () => {
    const res = await fetch('/api/categories', { credentials: 'include' });
    if (!res.ok) {
      setError(t('errors', 'loadFailed') + ` (${res.status})`);
      return;
    }
    const data = (await res.json()) as { items: Row[] };
    setItems(data.items ?? []);
  }, [t]);

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
      setError(t('errors', 'saveFailed') + ` (${res.status})`);
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
      <h1 className="v-page-title" style={{ marginBottom: 12 }}>
        {t('categories', 'title')}
      </h1>
      {error ? <p className="v-alert v-alert--error">{error}</p> : null}
      <form onSubmit={onCreate} style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t('categories', 'namePlaceholder')}
          aria-label={t('categories', 'name')}
        />
        <button type="submit" className="v-btn v-btn--primary">
          {t('categories', 'addNew')}
        </button>
      </form>
      <TableNav
        bulkOptions={[{ value: 'delete', label: t('common', 'delete') }]}
        bulkValue={bulk}
        onBulkChange={setBulk}
        bulkLabel={t('common', 'bulkActions')}
        applyLabel={t('common', 'apply')}
        searchLabel={t('common', 'search')}
        onBulkApply={() => setError(t('categories', 'bulkNotWired'))}
        search={q}
        onSearchChange={setQ}
        onSearchSubmit={() => setSearch(q)}
        searchPlaceholder={t('categories', 'search')}
      />
      <ListTable
        isEmpty={filtered.length === 0}
        empty={t('categories', 'noCategories')}
        headers={
          <>
            <th>{t('categories', 'name')}</th>
            <th>{t('categories', 'slug')}</th>
            <th>{t('categories', 'count')}</th>
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
