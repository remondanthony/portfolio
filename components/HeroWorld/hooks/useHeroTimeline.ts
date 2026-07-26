'use client';

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { buildMasterTimeline } from '../animations/buildMasterTimeline';
import { CAPTIONS, IDLE, RUNTIME, SKIP_DURATION, ACT } from '../animations/tokens';
import { all, one } from '../utils/select';
import { useReducedMotion } from './useReducedMotion';
import { useSkipIntent } from './useSkipIntent';

gsap.registerPlugin(ScrollTrigger);

/**
 * Orchestrates the whole hero: the finite film, the infinite ambience, the
 * caption track, the scroll settle and teardown.
 *
 * Everything is created inside a single gsap.context bound to the scope
 * element, so React StrictMode double-invocation and route changes cannot
 * leak a tween or a ScrollTrigger.
 */
export function useHeroTimeline(scopeRef: React.RefObject<HTMLElement | null>) {
  const reduced = useReducedMotion();
  const tlRef = useRef<gsap.core.Timeline | null>(null);
  const [resolved, setResolved] = useState(false);

  /** Fast-forward rather than cut — a jump reads as a bug, a rush reads as respect. */
  const skip = useCallback(() => {
    const tl = tlRef.current;
    if (!tl || tl.progress() === 1) return;
    gsap.to(tl, { time: RUNTIME, duration: SKIP_DURATION, ease: 'power2.inOut' });
  }, []);

  useSkipIntent(skip, !reduced && !resolved);

  useLayoutEffect(() => {
    const scope = scopeRef.current;
    if (!scope) return;

    const ctx = gsap.context(() => {
      const tl = buildMasterTimeline(gsap, scope);
      tlRef.current = tl;
      tl.eventCallback('onComplete', () => setResolved(true));

      /* ---- caption track -------------------------------------------------
         Captions live on their own timeline so copy can be re-timed without
         touching a single scene tween. */
      const captions = all(scope, 'caption');
      captions.forEach((node, i) => {
        const at = ACT[CAPTIONS[i].at];
        const next = CAPTIONS[i + 1] ? ACT[CAPTIONS[i + 1].at] : RUNTIME;
        tl.fromTo(node, { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.55 }, at + 0.35);
        tl.to(node, { opacity: 0, y: -10, duration: 0.45, ease: 'power2.in' }, next - 0.45);
      });

      if (reduced) {
        // No film. Resolve straight to the final frame and stop.
        tl.progress(1).pause();
        setResolved(true);
      } else {
        tl.play();

        /* ---- infinite ambience -----------------------------------------
           Kept off the master timeline: a repeating tween there would mean
           onComplete never fires, and skip-to-end would lose its meaning. */
        all(scope, 'particle').forEach((p) => {
          const drift = Number(p.dataset.drift ?? 0);
          gsap.to(p, {
            y: -18 - drift * 6,
            x: (drift - 1) * 7,
            duration: 7 + drift * 2.2,
            repeat: -1,
            yoyo: true,
            ease: 'sine.inOut',
            delay: drift * 0.5,
          });
        });
      }

      /* ---- idle breathing ------------------------------------------------
         Starts only once the film resolves, so it never competes with the
         camera push. */
      const deck = one(scope, 'deck');
      if (deck && !reduced) {
        gsap.to(deck, {
          y: -IDLE.breathDistance,
          duration: IDLE.breathDuration,
          repeat: -1,
          yoyo: true,
          ease: 'sine.inOut',
          delay: RUNTIME,
        });
      }

      /* ---- scroll settle -------------------------------------------------
         No pin, no added scroll distance. The film simply parts company with
         the visitor as the hero leaves, so #about stays exactly where it was. */
      const hero = scope.parentElement;
      const stage = one(scope, 'stage');
      if (hero && stage && !reduced) {
        gsap.to(stage, {
          y: -70,
          opacity: 0.25,
          scale: 0.97,
          ease: 'none',
          scrollTrigger: {
            trigger: hero,
            start: 'top top',
            end: 'bottom top',
            scrub: 0.6,
            invalidateOnRefresh: true,
          },
        });
      }
    }, scopeRef);

    return () => ctx.revert();
  }, [scopeRef, reduced]);

  // A late webfont or image can change layout under a pinned-free trigger.
  useEffect(() => {
    const refresh = () => ScrollTrigger.refresh();
    window.addEventListener('load', refresh);
    return () => window.removeEventListener('load', refresh);
  }, []);

  return { resolved, skip, reduced };
}
