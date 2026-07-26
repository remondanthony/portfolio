import type { gsap as GSAP } from 'gsap';
import { ACT, RUNTIME, STAGGER } from './tokens';
import { ARRIVE, CAMERA, DRAW, ENTER, EXIT, LOCK } from './easings';
import { all, one, present } from '../utils/select';

type Gsap = typeof GSAP;

/**
 * How far, in percent of the artboard, a component travels before it locks.
 * Small numbers on purpose: this should read as a part being placed, not
 * thrown. Anything larger and the assembly starts to look like confetti.
 */
const TRAVEL: Record<string, { x?: number; y?: number }> = {
  top:    { y: -34 },
  left:   { x: -26 },
  right:  { x: 30 },
  bottom: { y: 30 },
};

/**
 * The polished appearance of each component, applied in scene 3.
 * Keyed by the CSS-module class fragment carried in data-role.
 */
const POLISH: Record<string, gsap.TweenVars> = {
  navLink:  { backgroundColor: '#8a93a5' },
  cardIcon: { backgroundColor: '#ff5b1e' },
};

/**
 * Builds the scroll-scrubbed film.
 *
 * The timeline is created paused and unattached; useHeroTimeline hands it to
 * a pinned ScrollTrigger, so these "seconds" are really proportions of scroll
 * distance. Nothing here autoplays and nothing repeats infinitely — a
 * scrubbed timeline must be able to run backwards as cleanly as forwards,
 * which rules out any tween whose state depends on how it got there.
 */
export function buildMasterTimeline(gsap: Gsap, scope: HTMLElement): gsap.core.Timeline {
  const q = (name: string) => all(scope, name);
  const q1 = (name: string) => one(scope, name);

  const tl = gsap.timeline({ paused: true, defaults: { ease: ENTER } });

  const roomGlow = q1('roomGlow');
  const shadow = q1('shadow');
  const sheen = q1('sheen');
  const canvasGrid = q1('canvasGrid');
  const caret = q1('caret');
  const parts = q('part');
  const types = q('type');
  const chrome = q1('chrome');
  const loadbar = q1('loadbar');
  const live = q1('live');

  /* ===============================================================
     SCENE 1 — BLANK CANVAS  (0 → 1.4)
     The machine is already on the desk. The canvas is empty and a
     caret is waiting. Nothing has been decided yet.
  =============================================================== */

  if (shadow) tl.to(shadow, { opacity: 1, duration: 0.8 }, ACT.canvas);
  if (roomGlow) tl.to(roomGlow, { opacity: 0.9, duration: 1.0 }, ACT.canvas);
  if (sheen) tl.to(sheen, { opacity: 0.55, duration: 1.0 }, ACT.canvas + 0.1);
  if (canvasGrid) tl.to(canvasGrid, { opacity: 1, duration: 0.7 }, ACT.canvas + 0.15);

  if (caret) {
    tl.to(caret, { opacity: 1, duration: 0.15 }, ACT.canvas + 0.45);
    // Finite blink. An infinite one would survive into later acts and, on a
    // scrubbed timeline, would also refuse to run backwards coherently.
    tl.to(caret, { opacity: 0, duration: 0.22, repeat: 3, yoyo: true, ease: 'steps(1)' }, ACT.canvas + 0.6);
    tl.to(caret, { opacity: 0, duration: 0.2, ease: EXIT }, ACT.assemble - 0.2);
  }

  /* ===============================================================
     SCENE 2 — ASSEMBLY  (1.4 → 5.2)
     LEGO. Each component travels in from the edge it belongs to and
     locks. Order is authored in the markup via data-order, so the
     build queue is readable without opening this file.
  =============================================================== */

  const queue = [...parts].sort(
    (a, b) => Number(a.dataset.order ?? 0) - Number(b.dataset.order ?? 0)
  );

  const assembleSpan = ACT.polish - ACT.assemble - 0.5;
  const step = queue.length > 1 ? assembleSpan / queue.length : 0;

  queue.forEach((part, i) => {
    const from = part.dataset.from ?? 'top';
    const travel = TRAVEL[from] ?? TRAVEL.top;
    const at = ACT.assemble + i * step;

    tl.fromTo(
      part,
      {
        opacity: 0,
        xPercent: travel.x ?? 0,
        yPercent: travel.y ?? 0,
        scale: 0.985,
      },
      {
        opacity: 1,
        xPercent: 0,
        yPercent: 0,
        scale: 1,
        duration: 0.62,
        ease: LOCK,
      },
      at
    );
  });

  /* ===============================================================
     SCENE 3 — POLISH  (5.2 → 7.4)
     Placeholders retire, real type arrives, the image gains its
     photograph, and the spacing guides flash once to show the grid
     was there all along.
  =============================================================== */

  // Grey headline and body bars hand over to real typography.
  ['h1a', 'h1b', 'subline', 'subline2'].forEach((role, i) => {
    const node = queue.find((p) => p.className.includes(role));
    if (node) tl.to(node, { opacity: 0, duration: 0.45, ease: EXIT }, ACT.polish + i * 0.06);
  });

  if (present(types)) {
    tl.fromTo(
      types,
      { opacity: 0, y: 7 },
      { opacity: 1, y: 0, duration: 0.55, stagger: STAGGER.block * 0.55 },
      ACT.polish + 0.18
    );
  }

  if (q1('mediaFill')) {
    tl.to(q1('mediaFill'), { opacity: 1, duration: 0.85 }, ACT.polish + 0.25);
  }

  queue.forEach((part) => {
    Object.entries(POLISH).forEach(([role, vars]) => {
      if (part.className.includes(role)) {
        tl.to(part, { ...vars, duration: 0.6 }, ACT.polish + 0.35);
      }
    });
  });
  if (present(q('cardIcon'))) {
    tl.to(q('cardIcon'), { backgroundColor: '#ff5b1e', duration: 0.6, stagger: 0.07 }, ACT.polish + 0.4);
  }

  // The grid was always there. Show it once, then let it go.
  if (present(q('guide'))) {
    tl.to(q('guide'), { opacity: 1, duration: 0.35, stagger: 0.045, ease: DRAW }, ACT.polish + 0.75);
    tl.to(q('guide'), { opacity: 0, duration: 0.45, ease: EXIT }, ACT.polish + 1.5);
  }
  if (canvasGrid) tl.to(canvasGrid, { opacity: 0, duration: 0.6 }, ACT.polish + 1.4);

  /* ===============================================================
     SCENE 4 — DEVELOPMENT  (7.4 → 9.4)
     Short, quiet, and outside the screen.
  =============================================================== */

  if (present(q('componentCard'))) {
    tl.fromTo(
      q('componentCard'),
      { opacity: 0, y: 18, z: -50 },
      { opacity: 1, y: 0, z: 0, duration: 0.6, stagger: STAGGER.card },
      ACT.develop
    );
  }
  if (q1('tree')) {
    tl.fromTo(q1('tree'), { opacity: 0, x: -10 }, { opacity: 1, x: 0, duration: 0.55 }, ACT.develop + 0.2);
  }

  const statusLines = q('statusLine');
  statusLines.forEach((line, i) => {
    const at = ACT.develop + 0.45 + i * 0.42;
    tl.fromTo(line, { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: 0.3 }, at);
    if (i < statusLines.length - 1) {
      tl.to(line, { opacity: 0, y: -8, duration: 0.26, ease: EXIT }, at + 0.38);
    }
  });

  if (present(q('componentCard'))) {
    tl.to(
      q('componentCard'),
      { opacity: 0, y: -20, z: 34, duration: 0.5, ease: EXIT, stagger: STAGGER.card * 0.6 },
      ACT.live - 0.5
    );
  }
  if (q1('tree')) tl.to(q1('tree'), { opacity: 0, x: -12, duration: 0.45, ease: EXIT }, ACT.live - 0.5);
  if (present(statusLines)) {
    tl.to(statusLines, { opacity: 0, duration: 0.35, ease: EXIT }, ACT.live + 0.25);
  }

  /* ===============================================================
     SCENE 5 — LIVE  (9.4 → 11.6)
     Chrome slides down, the bar sweeps, the real project loads into
     the same aperture the mockup occupied.
  =============================================================== */

  if (chrome) {
    tl.fromTo(chrome, { opacity: 0, yPercent: -100 }, { opacity: 1, yPercent: 0, duration: 0.55, ease: ARRIVE }, ACT.live);
  }
  if (present(parts)) {
    // The design settles beneath the new chrome bar.
    tl.to(parts, { yPercent: 8, duration: 0.55, ease: CAMERA }, ACT.live);
  }
  if (present(types)) {
    tl.to(types, { yPercent: 8, duration: 0.55, ease: CAMERA }, ACT.live);
  }
  if (loadbar) {
    tl.fromTo(loadbar, { scaleX: 0 }, { scaleX: 1, duration: 0.8, ease: 'power2.inOut' }, ACT.live + 0.3);
    tl.to(loadbar, { opacity: 0, duration: 0.25 }, ACT.live + 1.15);
  }

  if (live) tl.to(live, { opacity: 1, duration: 0.7 }, ACT.live + 0.95);
  if (present(parts)) tl.to(parts, { opacity: 0, duration: 0.5, ease: EXIT }, ACT.live + 1.0);
  if (present(types)) tl.to(types, { opacity: 0, duration: 0.5, ease: EXIT }, ACT.live + 1.0);

  /* ===============================================================
     SETTLE  (11.6 → end)
     Ambient light drops back so the CTA above is the brightest
     promise on the screen. The film ends by getting out of the way.
  =============================================================== */

  if (roomGlow) tl.to(roomGlow, { opacity: 0.5, duration: 0.7, ease: CAMERA }, ACT.settle);
  if (sheen) tl.to(sheen, { opacity: 0.38, duration: 0.7 }, ACT.settle);

  // Pin the exact length so scroll-distance maths stay honest.
  tl.set({}, {}, RUNTIME);

  return tl;
}
