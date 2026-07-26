'use client';

import { useEffect } from 'react';

/**
 * A visitor who scrolls, taps or types has told you they are done watching.
 *
 * Honouring that is the difference between a film and a hostage situation:
 * the intro never blocks, and the first sign of intent fast-forwards it. We
 * listen passively, fire once, and always clean up.
 */
export function useSkipIntent(onSkip: () => void, enabled: boolean) {
  useEffect(() => {
    if (!enabled) return;

    let fired = false;
    const fire = () => {
      if (fired) return;
      fired = true;
      onSkip();
    };

    const events: Array<[keyof WindowEventMap, EventListener]> = [
      ['wheel', fire],
      ['touchstart', fire],
      ['pointerdown', fire],
      ['keydown', fire],
    ];

    events.forEach(([name, fn]) =>
      window.addEventListener(name, fn, { passive: true, once: true })
    );

    return () => events.forEach(([name, fn]) => window.removeEventListener(name, fn));
  }, [onSkip, enabled]);
}
