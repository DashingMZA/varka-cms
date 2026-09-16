'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * Debounced autosave — WordPress-style.
 * Never runs when `enabled` is false (e.g. empty title).
 * Interval can be customized in Settings (SiteSetting admin.autosaveIntervalMs).
 */
export function useAutosave(
  enabled: boolean,
  deps: unknown[],
  save: () => void | Promise<void>,
  delayMsOverride?: number,
) {
  const saveRef = useRef(save);
  saveRef.current = save;
  const first = useRef(true);
  const [delayMs, setDelayMs] = useState(delayMsOverride ?? 2500);

  useEffect(() => {
    if (delayMsOverride != null) {
      setDelayMs(delayMsOverride);
      return;
    }
    void (async () => {
      try {
        const res = await fetch('/api/settings/autosave', { credentials: 'include' });
        if (!res.ok) return;
        const data = (await res.json()) as { intervalMs?: number };
        if (data.intervalMs && data.intervalMs >= 1000) {
          setDelayMs(data.intervalMs);
        }
      } catch {
        /* keep default */
      }
    })();
  }, [delayMsOverride]);

  useEffect(() => {
    if (!enabled) return;
    if (first.current) {
      first.current = false;
      return;
    }
    const t = window.setTimeout(() => {
      void saveRef.current();
    }, delayMs);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, delayMs, ...deps]);
}
