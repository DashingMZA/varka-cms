'use client';

import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { ListTable, TableNav } from '@/components/list-table/list-table';
import { useMessages } from '@/lib/i18n';
import { listTagsAction, createTagAction } from '@/actions/taxonomy';

type Row = {
  id: string;
  translations: { name: string; slug: string }[];
  _count?: { posts: number };
};

export function TagsAdmin({
  initialItems = [],
}: {
  initialItems?: Row[];
}) {
  const { t } = useMessages();
  const [items, setItems] = useState<Row[]>(initialItems);
  const [name, setName] = useState('');
  const [q, setQ] = useState('');
  const [search, setSearch] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [bulk, setBulk] = useState('');
  const [hydrated, setHydrated] = useState(false);

  const load = useCallback(async () => {
    const result = await listTagsAction();
    if (!result.ok) {
      setError(t('errors', 'loadFailed') + `: ${result.error}`);
      return;
    }
    setItems((result.data.items as Row[]) ?? []);
  }, [t]);

  useEffect(() => {
    // Skip first fetch when server provided initial data
    if (!hydrated && initialItems.length > 0) {
      setHydrated(true);
      return;
    }
    void load();
  }, [load, hydrated, initialItems.length]);

  async function onCreate(e: FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    const result = await createTagAction({ name: name.trim() });
    if (!result.ok) {
      setError(t('errors', 'saveFailed') + `: ${result.error}`);
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
        {t('tags', 'title')}
      </h1>
      {error ? <p className="v-alert v-alert--error">{error}</p> : null}
      <form onSubmit={onCreate} style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t('tags', 'namePlaceholder')}
          aria-label={t('tags', 'name')}
        />
        <button type="submit" className="v-btn v-btn--primary">
          {t('tags', 'addNew')}
        </button>
      </form>
      <TableNav
        bulkOptions={[{ value: 'delete', label: t('common', 'delete') }]}
        bulkValue={bulk}
        onBulkChange={setBulk}
        bulkLabel={t('common', 'bulkActions')}
        applyLabel={t('common', 'apply')}
        searchLabel={t('common', 'search')}
        onBulkApply={() => setError(t('tags', 'bulkNotWired'))}
        search={q}
        onSearchChange={setQ}
        onSearchSubmit={() => setSearch(q)}
        searchPlaceholder={t('tags', 'search')}
      />
      <ListTable
        isEmpty={filtered.length === 0}
        empty={t('tags', 'noTags')}
        headers={
          <>
            <th>{t('tags', 'name')}</th>
            <th>{t('tags', 'slug')}</th>
            <th>{t('tags', 'count')}</th>
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
