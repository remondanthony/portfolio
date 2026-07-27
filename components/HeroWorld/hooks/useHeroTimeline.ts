'use client';

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { buildMasterTimeline } from '../animations/buildMasterTimeline';
import { ACT, CAPTIONS, IDLE, PIN_DISTANCE, RUNTIME } from '../animations/tokens';
import { all, one } from '../utils/select';
import { useReducedMotion } from './useReducedMotion';

gsap.registerPlugin(ScrollTrigger);

/**
 * Drives the hero: a pinned, scroll-scrubbed build of a website inside a
 * MacBook, plus the idle float that continues once the film is over.
 *
 * There is no autoplay. Progress is a pure function of scroll position, so
 * the visitor owns the pace completely — scrolling back up un-builds the site
 * exactly as it was built, which is only possible because every tween in the
 * timeline is stateless and finite.
 *
 * Everything lives in one gsap.context bound to the scope element, so React
 * StrictMode double-invocation and unmounts cannot leak a tween, a pin or a
 * ScrollTrigger.
 */
export function useHeroTimeline(scopeRef: React.RefObject<HTMLElement | null>) {
  const reduced = useReducedMotion();
  const [resolved, setResolved] = useState(false);

  useLayoutEffect(() => {
    const scope = scopeRef.current;
    if (!scope) return;

    const ctx = gsap.context(() => {
      const tl = buildMasterTimeline(gsap, scope);

      /* ---- caption track --------------------------------------------------
         On its own tweens so copy can be re-timed without touching a scene. */
      all(scope, 'caption').forEach((node, i) => {
        const at = ACT[CAPTIONS[i].at];
        const next = CAPTIONS[i + 1] ? ACT[CAPTIONS[i + 1].at] : RUNTIME;
        tl.fromTo(node, { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: 0.4 }, at + 0.2);
        tl.to(node, { opacity: 0, y: -8, duration: 0.35, ease: 'power2.in' }, next - 0.4);
      });

      /* ---- the hero copy, held back until the build is finished ------------
         The headline, tagline and service labels now arrive as the payoff of
         the story rather than sitting there through it. They are hidden by
         gsap.set at RUNTIME, never in the stylesheet: a failed bundle must
         leave the hero readable, not blank.

         Because these tweens live on the scrubbed timeline they also reverse —
         scrolling back up returns the stage to the machine alone. */
      const hero = scope.parentElement;
      const copy = hero
        ? [
            hero.querySelector<HTMLElement>('.hero-lead'),
            hero.querySelector<HTMLElement>('.hero-tag'),
            ...Array.from(hero.querySelectorAll<HTMLElement>('.hero-services > div')),
          ].filter((el): el is HTMLElement => Boolean(el))
        : [];

      if (copy.length) {
        gsap.set(copy, { opacity: 0, y: 16 });
        tl.to(
          copy,
          { opacity: 1, y: 0, duration: 0.75, ease: 'power3.out', stagger: 0.09 },
          ACT.settle - 0.15
        );
      }

      if (reduced) {
        // No pin, no scrub, no scroll cost. Resolve to the finished frame.
        tl.progress(1).pause();
        setResolved(true);
        return;
      }

      /* ---- the pinned build ----------------------------------------------
         The hero holds still while the site is assembled, then releases and
         the page continues normally into #about. */
      if (!hero) return;

      ScrollTrigger.create({
        trigger: hero,
        start: 'top top',
        end: PIN_DISTANCE,
        pin: true,
        pinSpacing: true,
        anticipatePin: 1,
        scrub: 0.8,
        invalidateOnRefresh: true,
        animation: tl,
        // The float and parallax should only wake once the build is finished.
        onUpdate: (self) => setResolved(self.progress > 0.985),
      });

      /* ---- idle float ------------------------------------------------------
         Independent of scroll: the machine is alive whether or not you move. */
      const float = one(scope, 'float');
      if (float) {
        gsap.to(float, {
          y: -IDLE.floatDistance,
          duration: IDLE.floatDuration,
          repeat: -1,
          yoyo: true,
          ease: 'sine.inOut',
        });
      }
    }, scopeRef);

    return () => ctx.revert();
  }, [scopeRef, reduced]);

  // A late webfont or image changes layout, which moves every pin boundary.
  useEffect(() => {
    const refresh = () => ScrollTrigger.refresh();
    window.addEventListener('load', refresh);
    return () => window.removeEventListener('load', refresh);
  }, []);

  return { resolved, reduced };
}
