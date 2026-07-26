'use client';

import { useEffect } from 'react';
import { IDLE } from '../animations/tokens';

/**
 * The laptop answers the pointer — gently.
 *
 * Two rules keep this on the right side of tasteful:
 *   1. It only engages AFTER the film resolves, so it never fights the story.
 *   2. It is lerped in a single rAF loop, never tweened per mousemove — one
 *      write per frame, no timeline churn, no jitter.
 *
 * Touch devices are excluded outright: there is no hover, and reading a
 * finger as a camera is how you get a jumpy hero on mobile.
 */
export function usePointerParallax(
  target: React.RefObject<HTMLElement | null>,
  enabled: boolean
) {
  useEffect(() => {
    const el = target.current;
    if (!el || !enabled) return;
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;

    let targetX = 0;
    let targetY = 0;
    let currentX = 0;
    let currentY = 0;
    let raf = 0;

    const onMove = (e: PointerEvent) => {
      const nx = (e.clientX / window.innerWidth) * 2 - 1;   // -1 .. 1
      const ny = (e.clientY / window.innerHeight) * 2 - 1;
      targetY = nx * IDLE.parallaxMaxDeg;        // yaw follows horizontal
      targetX = -ny * (IDLE.parallaxMaxDeg * 0.6); // pitch is deliberately shyer
    };

    const frame = () => {
      currentX += (targetX - currentX) * IDLE.parallaxLerp;
      currentY += (targetY - currentY) * IDLE.parallaxLerp;
      el.style.transform = `rotateX(${currentX.toFixed(3)}deg) rotateY(${currentY.toFixed(3)}deg)`;
      raf = requestAnimationFrame(frame);
    };

    window.addEventListener('pointermove', onMove, { passive: true });
    raf = requestAnimationFrame(frame);

    return () => {
      window.removeEventListener('pointermove', onMove);
      cancelAnimationFrame(raf);
      el.style.transform = '';
    };
  }, [target, enabled]);
}
