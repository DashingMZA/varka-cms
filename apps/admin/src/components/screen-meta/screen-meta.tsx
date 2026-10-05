'use client';

import { useState } from 'react';
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

export type ScreenHelpTab = { id: string; title: string; body: string };
export type ScreenOption = {
  id: string;
  label: string;
  checked: boolean;
  onChange: () => void;
};

type Props = {
  title?: string;
  help?: ScreenHelpTab[];
  options?: ScreenOption[];
};

/**
 * WordPress-style Screen Options + Help tabs (top-right of content area).
 */
export function ScreenMeta({ help = [], options = [] }: Props) {
  const { t } = useMessages();
  const [panel, setPanel] = useState<'none' | 'options' | 'help'>('none');
  const [helpTab, setHelpTab] = useState(help[0]?.id ?? '');

  if (!help.length && !options.length) return null;

  return (
    <div className="v-screen-meta">
      <div className="v-screen-meta__links">
        {options.length ? (
          <button
            type="button"
            className={panel === 'options' ? 'is-open' : ''}
            onClick={() => setPanel((p) => (p === 'options' ? 'none' : 'options'))}
          >
            {L(t, 'screenOptions', 'Screen Options')}
          </button>
        ) : null}
        {help.length ? (
          <button
            type="button"
            className={panel === 'help' ? 'is-open' : ''}
            onClick={() => setPanel((p) => (p === 'help' ? 'none' : 'help'))}
          >
            {t('common', 'help') || 'Help'}
          </button>
        ) : null}
      </div>

      {panel === 'options' ? (
        <div className="v-screen-meta__panel">
          <fieldset>
            <legend>{L(t, 'showOnScreen', 'Show on screen')}</legend>
            <div className="v-screen-meta__opts">
              {options.map((o) => (
                <label key={o.id}>
                  <input
                    type="checkbox"
                    checked={o.checked}
                    onChange={o.onChange}
                  />{' '}
                  {o.label}
                </label>
              ))}
            </div>
          </fieldset>
        </div>
      ) : null}

      {panel === 'help' ? (
        <div className="v-screen-meta__panel">
          <div className="v-screen-meta__help-tabs">
            {help.map((t) => (
              <button
                key={t.id}
                type="button"
                className={helpTab === t.id ? 'is-active' : ''}
                onClick={() => setHelpTab(t.id)}
              >
                {t.title}
              </button>
            ))}
          </div>
          <div className="v-screen-meta__help-body">
            {help.find((t) => t.id === helpTab)?.body}
          </div>
        </div>
      ) : null}
    </div>
  );
}
