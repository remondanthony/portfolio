import type { gsap as GSAP } from 'gsap';
import { ACT, PARALLAX, POLISH_LAG, RUNTIME, STAGGER } from './tokens';
import { ARRIVE, CAMERA, DRAW, ENTER, EXIT, LOCK } from './easings';
import { all, one, present } from '../utils/select';

type Gsap = typeof GSAP;

/** How far, in percent of the artboard, a component travels before it locks. */
const TRAVEL: Record<string, { x?: number; y?: number }> = {
  top: { y: -34 },
  left: { x: -26 },
  right: { x: 30 },
  bottom: { y: 30 },
};

/**
 * Builds the scroll-scrubbed film.
 *
 * The organising idea is that there are no ACT BOUNDARIES in the motion, only
 * in the captions. A component is placed, and then — a beat later, on its own
 * clock — it is refined. Because every part arrives at a different moment,
 * their refinements overlap the arrivals still to come, and the build reads as
 * one continuous growth rather than five discrete chapters.
 *
 * Everything is finite and stateless: the timeline is scrubbed, so it has to
 * run backwards as cleanly as forwards. No infinite repeats, no tween whose
 * result depends on how it got there.
 */
export function buildMasterTimeline(gsap: Gsap, scope: HTMLElement): gsap.core.Timeline {
  const q = (name: string) => all(scope, name);
  const q1 = (name: string) => one(scope, name);

  const tl = gsap.timeline({ paused: true, defaults: { ease: ENTER } });

  const stage = q1('stage');
  const bgGrid = q1('bgGrid');
  const dust = q1('dust');
  const roomGlow = q1('roomGlow');
  const shadow = q1('shadow');
  const sheen = q1('sheen');
  const canvasGrid = q1('canvasGrid');
  const caret = q1('caret');
  const chrome = q1('chrome');
  const loadbar = q1('loadbar');
  const live = q1('live');

  /* ---------------------------------------------------------------
     DEPTH
     Three planes, three rates, running under the entire film. The grid
     barely moves, the motes move about twice as far, and the machine
     counter-moves a little — which is what makes it read as nearest.
  --------------------------------------------------------------- */

  if (bgGrid) {
    tl.fromTo(bgGrid, { opacity: 0 }, { opacity: 1, duration: 1.6 }, 0);
    tl.fromTo(bgGrid, { y: 0 }, { y: PARALLAX.grid, duration: RUNTIME, ease: 'none' }, 0);
  }
  if (dust) {
    tl.fromTo(dust, { y: 0 }, { y: PARALLAX.dust, duration: RUNTIME, ease: 'none' }, 0);
  }
  if (present(q('mote'))) {
    tl.fromTo(
      q('mote'),
      { opacity: 0, scale: 0.4 },
      { opacity: 0.85, scale: 1, duration: 1.4, stagger: { each: STAGGER.particle, from: 'random' } },
      0.15
    );
  }
  if (stage) {
    tl.fromTo(stage, { y: 0 }, { y: PARALLAX.stage, duration: RUNTIME, ease: 'none' }, 0);
  }

  /* ---------------------------------------------------------------
     THE MACHINE WAKES  (0 → ~1.6)
     It is already on the desk. Light finds it, the display comes up,
     and a caret waits on an empty canvas.
  --------------------------------------------------------------- */

  if (shadow) tl.to(shadow, { opacity: 1, duration: 1.1 }, 0);
  if (roomGlow) tl.to(roomGlow, { opacity: 0.9, duration: 1.3 }, 0);
  if (sheen) tl.to(sheen, { opacity: 0.5, duration: 1.2 }, 0.1);
  if (canvasGrid) tl.to(canvasGrid, { opacity: 1, duration: 0.9 }, 0.2);

  if (caret) {
    tl.to(caret, { opacity: 1, duration: 0.15 }, 0.5);
    tl.to(caret, { opacity: 0, duration: 0.22, repeat: 3, yoyo: true, ease: 'steps(1)' }, 0.65);
    // Leaves as the first component lands — the handover, not a cut.
    tl.to(caret, { opacity: 0, duration: 0.3, ease: EXIT }, ACT.assemble - 0.1);
  }

  /* ---------------------------------------------------------------
     GROWTH  (~1.4 → ~8.6)
     Each part flies in from the edge it belongs to, locks, and then
     refines itself POLISH_LAG later. The refinements of early parts
     therefore overlap the arrivals of late ones — the overlap IS the
     continuity.
  --------------------------------------------------------------- */

  const queue = [...q('part')].sort(
    (a, b) => Number(a.dataset.order ?? 0) - Number(b.dataset.order ?? 0)
  );

  const span = ACT.develop - ACT.assemble - 1.4;
  const step = queue.length > 1 ? span / queue.length : 0;

  /** When each role finished arriving, so its refinement can follow it. */
  const arrivedAt = new Map<string, number>();

  queue.forEach((part, i) => {
    const from = part.dataset.from ?? 'top';
    const travel = TRAVEL[from] ?? TRAVEL.top;
    const role = part.dataset.role ?? '';
    const at = ACT.assemble + i * step;
    if (!arrivedAt.has(role)) arrivedAt.set(role, at);

    tl.fromTo(
      part,
      { opacity: 0, xPercent: travel.x ?? 0, yPercent: travel.y ?? 0, scale: 0.985 },
      { opacity: 1, xPercent: 0, yPercent: 0, scale: 1, duration: 0.72, ease: LOCK },
      at
    );

    // ---- the refinement, riding this part's own arrival ----
    const polishAt = at + POLISH_LAG;

    if (role === 'navLink') {
      tl.to(part, { backgroundColor: '#8a93a5', duration: 0.55 }, polishAt);
    }
    if (role === 'media') {
      const fill = part.querySelector<HTMLElement>('[data-hw="mediaFill"]');
      if (fill) tl.to(fill, { opacity: 1, duration: 0.8 }, polishAt);
    }
    if (role === 'card') {
      const icon = part.querySelector<HTMLElement>('[data-hw="cardIcon"]');
      if (icon) tl.to(icon, { backgroundColor: '#ff5b1e', duration: 0.5 }, polishAt);
    }
    // Placeholder bars hand over to real type.
    if (['h1a', 'h1b', 'subline', 'subline2'].includes(role)) {
      tl.to(part, { opacity: 0, duration: 0.5, ease: EXIT }, polishAt);
    }
  });

  // Real typography arrives just behind the placeholder it replaces.
  q('type').forEach((node) => {
    const pairedTo = node.dataset.for ?? '';
    const base = arrivedAt.get(pairedTo);
    if (base === undefined) return;
    tl.fromTo(
      node,
      { opacity: 0, y: 6 },
      { opacity: 1, y: 0, duration: 0.6 },
      base + POLISH_LAG + 0.08
    );
  });

  // The measuring grid was always there. Acknowledge it once, then let it go.
  if (present(q('guide'))) {
    tl.to(q('guide'), { opacity: 1, duration: 0.4, stagger: 0.05, ease: DRAW }, ACT.polish + 0.4);
    tl.to(q('guide'), { opacity: 0, duration: 0.55, ease: EXIT }, ACT.polish + 1.35);
  }
  if (canvasGrid) tl.to(canvasGrid, { opacity: 0, duration: 0.9 }, ACT.polish + 1.1);

  /* ---------------------------------------------------------------
     ENGINEERING  (~7.4 → ~9.8)
     Begins while the last cards are still settling.
  --------------------------------------------------------------- */

  if (present(q('componentCard'))) {
    tl.fromTo(
      q('componentCard'),
      { opacity: 0, y: 18, z: -50 },
      { opacity: 1, y: 0, z: 0, duration: 0.7, stagger: STAGGER.card },
      ACT.develop
    );
  }
  if (q1('tree')) {
    tl.fromTo(q1('tree'), { opacity: 0, x: -10 }, { opacity: 1, x: 0, duration: 0.6 }, ACT.develop + 0.25);
  }

  const statusLines = q('statusLine');
  statusLines.forEach((line, i) => {
    const at = ACT.develop + 0.5 + i * 0.44;
    tl.fromTo(line, { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: 0.32 }, at);
    if (i < statusLines.length - 1) {
      tl.to(line, { opacity: 0, y: -8, duration: 0.28, ease: EXIT }, at + 0.4);
    }
  });

  if (present(q('componentCard'))) {
    tl.to(
      q('componentCard'),
      { opacity: 0, y: -20, z: 34, duration: 0.55, ease: EXIT, stagger: STAGGER.card * 0.6 },
      ACT.live - 0.6
    );
  }
  if (q1('tree')) tl.to(q1('tree'), { opacity: 0, x: -12, duration: 0.5, ease: EXIT }, ACT.live - 0.6);
  if (present(statusLines)) {
    tl.to(statusLines, { opacity: 0, duration: 0.4, ease: EXIT }, ACT.live + 0.2);
  }

  /* ---------------------------------------------------------------
     LIVE  (~9.4 → 11.6)
     Chrome slides down over the finished design and the real project
     loads into the same aperture the mockup occupied.
  --------------------------------------------------------------- */

  const site = [...queue, ...q('type')];

  if (chrome) {
    tl.fromTo(chrome, { opacity: 0, yPercent: -100 }, { opacity: 1, yPercent: 0, duration: 0.6, ease: ARRIVE }, ACT.live);
  }
  if (present(site)) {
    tl.to(site, { yPercent: 8, duration: 0.6, ease: CAMERA }, ACT.live);
  }
  if (loadbar) {
    tl.fromTo(loadbar, { scaleX: 0 }, { scaleX: 1, duration: 0.85, ease: 'power2.inOut' }, ACT.live + 0.3);
    tl.to(loadbar, { opacity: 0, duration: 0.25 }, ACT.live + 1.2);
  }

  if (live) tl.to(live, { opacity: 1, duration: 0.75 }, ACT.live + 1.0);
  if (present(site)) tl.to(site, { opacity: 0, duration: 0.55, ease: EXIT }, ACT.live + 1.05);

  /* ---------------------------------------------------------------
     REST  (11.6 → end)
     The room dims so the CTA above is the brightest promise on screen.
  --------------------------------------------------------------- */

  if (roomGlow) tl.to(roomGlow, { opacity: 0.52, duration: 0.8, ease: CAMERA }, ACT.settle);
  if (sheen) tl.to(sheen, { opacity: 0.34, duration: 0.8 }, ACT.settle);
  if (bgGrid) tl.to(bgGrid, { opacity: 0.55, duration: 0.8 }, ACT.settle);

  tl.set({}, {}, RUNTIME);

  return tl;
}
