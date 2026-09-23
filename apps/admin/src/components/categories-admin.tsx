'use client';

import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { ListTable, TableNav } from '@/components/list-table/list-table';
import { useMessages } from '@/lib/i18n';

type Row = {
  id: string;
  translations: { name: string; slug: string }[];
  _count?: { posts: number };
};

function slugify(name: string) {
  return (
    name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 80) || ''
  );
}

export function CategoriesAdmin() {
  const { t } = useMessages();
  const [items, setItems] = useState<Row[]>([]);
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [slugTouched, setSlugTouched] = useState(false);
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
      body: JSON.stringify({
        name: name.trim(),
        slug: slug.trim() || undefined,
      }),
    });
    if (!res.ok) {
      setError(t('errors', 'saveFailed') + ` (${res.status})`);
      return;
    }
    setName('');
    setSlug('');
    setSlugTouched(false);
    await load();
  }

  const filtered = items.filter((r) => {
    if (!search.trim()) return true;
    const n = r.translations[0]?.name?.toLowerCase() ?? '';
    const s = r.translations[0]?.slug?.toLowerCase() ?? '';
    const q = search.toLowerCase();
    return n.includes(q) || s.includes(q);
  });

  return (
    <div>
      <div className="v-page-header">
        <h1 className="v-page-title">{t('categories', 'title')}</h1>
      </div>
      {error ? <p className="v-alert v-alert--error">{error}</p> : null}

      <div className="v-card" style={{ marginBottom: 16, padding: 16, maxWidth: 480 }}>
        <h2 style={{ margin: '0 0 12px', fontSize: 14 }}>{t('categories', 'addNew')}</h2>
        <form onSubmit={onCreate} className="v-form">
          <p className="v-field">
            <label htmlFor="cat-name">{t('categories', 'name')}</label>
            <input
              id="cat-name"
              value={name}
              onChange={(e) => {
                const v = e.target.value;
                setName(v);
                if (!slugTouched) setSlug(slugify(v));
              }}
              placeholder={t('categories', 'namePlaceholder')}
              required
            />
          </p>
          <p className="v-field">
            <label htmlFor="cat-slug">{t('categories', 'slug')}</label>
            <input
              id="cat-slug"
              value={slug}
              onChange={(e) => {
                setSlugTouched(true);
                setSlug(e.target.value);
              }}
              placeholder="category-slug"
            />
          </p>
          <p style={{ marginTop: 12 }}>
            <button type="submit" className="v-btn v-btn--primary">
              {t('categories', 'addNew')}
            </button>
          </p>
        </form>
      </div>

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
