'use client';

import { useEffect, useRef } from 'react';

/**
 * Debounced autosave — WordPress-style.
 * Never runs when `enabled` is false (e.g. empty title).
 */
export function useAutosave(
  enabled: boolean,
  deps: unknown[],
  save: () => void | Promise<void>,
  delayMs = 2500,
) {
  const saveRef = useRef(save);
  saveRef.current = save;
  const first = useRef(true);

  useEffect(() => {
    if (!enabled) return;
    // Skip the initial mount snapshot
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
