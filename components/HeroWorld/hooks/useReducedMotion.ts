'use client';

import { useEffect, useState } from 'react';

/**
 * Tracks the OS "reduce motion" setting, live.
 *
 * Starts false so server and client markup agree, then corrects on mount.
 * A visitor who flips the setting mid-visit gets the change immediately —
 * this is an accessibility control, not a preference we cache.
 */
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const sync = () => setReduced(mq.matches);
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, []);

  return reduced;
}
