'use client';

import type { ReactNode } from 'react';
import { useMessages } from '@/lib/i18n';

/** Label with hard fallback so missing i18n never shows raw keys */
function L(
  t: (ns: 'tables' | 'common', key: string) => string,
  key: string,
  fallback: string,
): string {
  const v = t('tables', key);
  if (!v || v === key || v.startsWith('tables.')) return fallback;
  return v;
}

/** Shared WP-style list-table primitives (one pattern for every entity). */

export function Subsubsub(props: {
  items: { id: string; label: string; count?: number }[];
  active: string;
  onChange: (id: string) => void;
}) {
  return (
    <ul className="v-subsubsub" style={{ display: 'flex', flexWrap: 'wrap', gap: 0, listStyle: 'none', padding: 0, margin: '0 0 12px', fontSize: 13 }}>
      {props.items.map((item, i) => (
        <li key={item.id} style={{ margin: 0 }}>
          {i > 0 ? <span style={{ color: 'var(--muted)', margin: '0 6px' }}>|</span> : null}
          <button
            type="button"
            onClick={() => props.onChange(item.id)}
            style={{
              background: 'none',
              border: 'none',
              padding: 0,
              cursor: 'pointer',
              color: props.active === item.id ? 'var(--ink)' : 'var(--accent)',
              fontWeight: props.active === item.id ? 600 : 400,
              textDecoration: props.active === item.id ? 'none' : 'underline',
            }}
          >
            {item.label}
            {typeof item.count === 'number' ? (
              <span className="v-muted"> ({item.count})</span>
            ) : null}
          </button>
        </li>
      ))}
    </ul>
  );
}

export function TableNav(props: {
  bulkOptions: { value: string; label: string }[];
  bulkValue: string;
  onBulkChange: (v: string) => void;
  onBulkApply: () => void;
  search: string;
  onSearchChange: (v: string) => void;
  onSearchSubmit: () => void;
  children?: ReactNode;
  /** Optional i18n labels (accepted for API compatibility; reserved for future wiring). */
  bulkLabel?: string;
  applyLabel?: string;
  searchLabel?: string;
  searchPlaceholder?: string;
}) {
  const { t } = useMessages();
  return (
    <div className="v-tablenav" style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center', marginBottom: 10 }}>
      <select
        value={props.bulkValue}
        onChange={(e) => props.onBulkChange(e.target.value)}
        aria-label={L(t, 'bulkActions', 'Bulk actions')}
      >
        <option value="">{L(t, 'bulkActions', 'Bulk actions')}</option>
        {props.bulkOptions.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <button type="button" className="v-btn" onClick={props.onBulkApply}>
        {t('common', 'apply') || 'Apply'}
      </button>
      {props.children}
      <form
        style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}
        onSubmit={(e) => {
          e.preventDefault();
          props.onSearchSubmit();
        }}
      >
        <input
          type="search"
          value={props.search}
          onChange={(e) => props.onSearchChange(e.target.value)}
          placeholder={L(t, 'searchPlaceholder', 'Search…')}
          aria-label={t('common', 'search') || 'Search'}
        />
        <button type="submit" className="v-btn">
          {t('common', 'search') || 'Search'}
        </button>
      </form>
    </div>
  );
}

export function ListTable(props: {
  headers: ReactNode;
  children: ReactNode;
  empty?: string;
  isEmpty?: boolean;
}) {
  const { t } = useMessages();
  if (props.isEmpty) {
    return <p className="v-muted">{props.empty ?? L(t, 'noItemsFound', 'No items found.')}</p>;
  }
  return (
    <div className="v-table-wrap">
      <table className="v-table">
        <thead>
          <tr>{props.headers}</tr>
        </thead>
        <tbody>{props.children}</tbody>
      </table>
    </div>
  );
}
