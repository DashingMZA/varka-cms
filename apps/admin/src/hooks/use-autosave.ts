'use client';

import { useEffect, useRef, useState } from 'react';
import { getAutosaveAction } from '@/actions/settings';

/** Debounced autosave — WordPress-style. Never runs when enabled is false. */
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
    if (delayMsOverride !== undefined) {
      setDelayMs(delayMsOverride);
      return;
    }
    void (async () => {
      try {
        const result = await getAutosaveAction();
        if (!result.ok) return;
        if (result.data.intervalMs && result.data.intervalMs >= 1000) setDelayMs(result.data.intervalMs);
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
