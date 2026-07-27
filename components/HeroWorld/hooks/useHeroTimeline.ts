'use client';

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { buildMasterTimeline } from '../animations/buildMasterTimeline';
import { ACT, ARRIVE, CAPTIONS, IDLE, PIN_DISTANCE, RISE, RUNTIME } from '../animations/tokens';
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

      /**
       * The arrival order, as a sequence rather than a flat stagger.
       *
       * A single stagger over the whole block would treat a 108px headline and
       * an 11px label as the same weight. Sequencing them — and giving bigger
       * type a longer rise — is what makes this read as composed rather than
       * animated. Transform and opacity only: no blur, no mask. Those announce
       * themselves, and the brief was not to overpower the copy.
       */
      const q = (sel: string) => hero?.querySelector<HTMLElement>(sel) ?? null;

      const sequence: Array<{ el: HTMLElement; rise: number }> = [];
      const push = (el: HTMLElement | null, rise: number) => {
        if (el) sequence.push({ el, rise });
      };

      push(q('.hero-lead'), RISE.headline);
      push(q('.hero-tag h2'), RISE.tagline);
      push(q('.hero-tag p'), RISE.body);

      // Each service block arrives as a unit, its number a beat ahead of its
      // name — the one internal detail, small enough to be felt not noticed.
      const labels = hero
        ? Array.from(hero.querySelectorAll<HTMLElement>('.hero-services > div'))
        : [];

      if (sequence.length || labels.length) {
        const arriving = [
          ...sequence.map((s) => s.el),
          ...labels.flatMap((d) => Array.from(d.children) as HTMLElement[]),
        ];
        // Hidden at RUNTIME, never in the stylesheet: a bundle that fails to
        // load must leave the hero readable rather than blank.
        gsap.set(arriving, { opacity: 0 });

        sequence.forEach(({ el, rise }, i) => {
          const at = ARRIVE.at + i * ARRIVE.step;
          gsap.set(el, { y: rise });
          tl.to(el, { opacity: 1, y: 0, duration: ARRIVE.duration, ease: 'power3.out' }, at);
        });

        labels.forEach((block, i) => {
          const at = ARRIVE.at + (sequence.length + i) * ARRIVE.step;
          Array.from(block.children).forEach((child, j) => {
            const el = child as HTMLElement;
            gsap.set(el, { y: RISE.label });
            tl.to(
              el,
              { opacity: 1, y: 0, duration: ARRIVE.duration, ease: 'power3.out' },
              at + j * ARRIVE.numberLead
            );
          });
        });
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
