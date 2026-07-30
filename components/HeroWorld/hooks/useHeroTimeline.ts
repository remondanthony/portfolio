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

    // The <head> script already turned off the browser's scroll restoration,
    // but the pin is only correct if it is created from a standing start —
    // anything that scrolled the page between then and now would have the
    // build open mid-scrub. Cheap to assert, so assert it.
    if (!window.location.hash) window.scrollTo(0, 0);

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
      /* The hero section, found by class rather than by parentElement: the
         machine now renders inside its own column in the layout, so the parent
         is that column and pinning it would pin the wrong box. */
      const hero = scope.closest<HTMLElement>('.hero-blank');

      /* ---- the copy used to arrive here ------------------------------------
         The headline, tagline and service labels were hidden at RUNTIME and
         tweened in at the end of the build, as the payoff of the film. Both
         that sequence and the --lift tween that lifted the machine clear of
         the arriving copy on mobile are gone.

         Neither was solving a problem that still exists. The copy has its own
         column now and is visible from the first frame, as the layout intends,
         so there is nothing to reveal and nothing for the machine to avoid.
         Its entrance is a CSS animation on load — no tween, no ScrollTrigger,
         nothing added to this timeline.

         The old selectors (.hero-lead, .hero-tag, .hero-services) no longer
         exist in the markup, so leaving this in place would have been dead
         code that silently matched nothing. */

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

    // Back/forward can hand the page back from the bfcache fully rendered and
    // already scrolled, skipping mount entirely — so neither the head script
    // nor the layout effect above gets a say. This is the only hook that fires.
    const onShow = (e: PageTransitionEvent) => {
      if (!e.persisted) return;
      if (!window.location.hash) window.scrollTo(0, 0);
      ScrollTrigger.refresh();
    };
    window.addEventListener('pageshow', onShow);

    return () => {
      window.removeEventListener('load', refresh);
      window.removeEventListener('pageshow', onShow);
    };
  }, []);

  return { resolved, reduced };
}
