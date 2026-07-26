'use client';

import { useLayoutEffect } from 'react';
import { gsap } from 'gsap';

/**
 * A single, very quiet entrance for the approved hero copy.
 *
 * The copy is otherwise completely static — the MacBook carries the story, and
 * text that keeps moving would compete with it. This is one fade on first
 * paint and nothing after.
 *
 * Two deliberate choices:
 *
 *   • gsap.from(), never a CSS opacity:0. The start state is written by JS at
 *     runtime, so if the bundle fails or never runs the copy is simply there.
 *     Hiding it in the stylesheet would mean a broken script hides the hero.
 *
 *   • useLayoutEffect, so the start state lands before the browser paints and
 *     there is no flash of fully-opaque text snapping back to transparent.
 */
export function useHeroCopyIntro(heroRef: React.RefObject<HTMLElement | null>, enabled: boolean) {
  useLayoutEffect(() => {
    const hero = heroRef.current?.parentElement;
    if (!hero || !enabled) return;

    const targets = hero.querySelectorAll<HTMLElement>('.hero-lead, .hero-tag, .hero-services');
    if (!targets.length) return;

    const ctx = gsap.context(() => {
      gsap.from(targets, {
        opacity: 0,
        y: 12,
        duration: 1.1,
        ease: 'power2.out',
        stagger: 0.12,
        clearProps: 'opacity,transform',
      });
    }, hero);

    return () => ctx.revert();
  }, [heroRef, enabled]);
}
