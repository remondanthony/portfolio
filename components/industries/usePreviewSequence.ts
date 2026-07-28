'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * Drives one preview's scripted sequence, exactly once.
 *
 * Phases advance on timers rather than on CSS animation events: the sequence
 * is eleven beats long and a chain of animationend listeners would be far
 * harder to read and to retime. Each phase name lands on the DOM as a data
 * attribute, and every visual change is a CSS transition keyed off it — so
 * the JS only ever writes a string, and the compositor does the rest.
 *
 * Timings are the brief's, to the millisecond.
 */
export const BEAT = {
  shimmer: 300,
  fade: 400,
  cursorIn: 260,
  travel: 900,
  hover: 250,
  click: 120,
  scroll: 1200,
  hold: 1000,
  exit: 420,
} as const;

export type Phase =
  | 'ready'    // finished site, nothing has happened yet
  | 'loading'  // shimmer passes over
  | 'fade'     // site settles in
  | 'point'    // cursor enters
  | 'travel'   // cursor crosses to the CTA
  | 'hover'    // CTA lifts
  | 'click'    // press
  | 'scroll'   // page moves, second section arrives
  | 'hold'     // everything rests
  | 'done';    // cursor gone, still forever

const SEQUENCE: [Phase, number][] = [
  ['loading', BEAT.shimmer],
  ['fade', BEAT.fade],
  ['point', BEAT.cursorIn],
  ['travel', BEAT.travel],
  ['hover', BEAT.hover],
  ['click', BEAT.click],
  ['scroll', BEAT.scroll],
  ['hold', BEAT.hold],
  ['done', BEAT.exit],
];

export function usePreviewSequence<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [phase, setPhase] = useState<Phase>('ready');

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Reduced motion gets the end state immediately: a finished site with the
    // second section already in view, and no cursor theatre.
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setPhase('done');
      return;
    }

    const timers: ReturnType<typeof setTimeout>[] = [];
    let started = false;

    const run = () => {
      if (started) return;
      started = true;
      let t = 0;
      SEQUENCE.forEach(([name, ms]) => {
        timers.push(setTimeout(() => setPhase(name), t));
        t += ms;
      });
    };

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (!e.isIntersecting) return;
          run();
          io.disconnect(); // once, and never again — the brief is explicit
        });
      },
      { threshold: 0.45 }
    );

    io.observe(el);
    return () => {
      io.disconnect();
      timers.forEach(clearTimeout);
    };
  }, []);

  return { ref, phase };
}
