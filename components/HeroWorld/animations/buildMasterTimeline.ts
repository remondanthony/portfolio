import type { gsap as GSAP } from 'gsap';
import { ACT, RUNTIME, STAGGER } from './tokens';
import { ARRIVE, CAMERA, DRAW, ENTER, EXIT } from './easings';
import { all, one, present } from '../utils/select';

type Gsap = typeof GSAP;

/**
 * The designed appearance of every wireframe part, keyed by `data-role`.
 *
 * Act III is nothing more than tweening each part from its CSS wireframe state
 * to the values below. Keeping them as data (not scattered tweens) is what
 * makes the palette editable without reading a line of animation code.
 */
const DESIGNED: Record<string, gsap.TweenVars> = {
  topbar:   { backgroundColor: 'rgba(255,255,255,0.045)', borderColor: 'rgba(255,255,255,0.10)' },
  brandDot: { backgroundColor: '#ff5b1e', borderColor: 'rgba(255,91,30,0)' },
  navPill:  { backgroundColor: 'rgba(255,255,255,0.13)', borderColor: 'rgba(255,255,255,0)' },
  ctaPill:  { backgroundColor: '#ff5b1e', borderColor: 'rgba(255,91,30,0)' },
  btn:      { backgroundColor: '#ff5b1e', borderColor: 'rgba(255,91,30,0)' },
  media:    { backgroundColor: '#3d1c11', borderColor: 'rgba(255,138,74,0.22)' },
  card:     { backgroundColor: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.10)' },
  // The headline and body bars are placeholders — they hand over to real type.
  head:     { opacity: 0 },
  sub:      { opacity: 0 },
};

export type FilmRefs = { scope: HTMLElement };

/**
 * Builds the complete finite film. Infinite ambient loops (particle drift,
 * idle breathing) deliberately live OUTSIDE this timeline — a repeating tween
 * on the master would mean it never reports complete, and the skip-to-end
 * affordance depends on completion being meaningful.
 *
 * Anything that must yield to a later act stays ON the timeline instead, with
 * a finite repeat — see the cursor blink in act I.
 */
export function buildMasterTimeline(gsap: Gsap, scope: HTMLElement): gsap.core.Timeline {
  const q = (name: string) => all(scope, name);
  const q1 = (name: string) => one(scope, name);

  const tl = gsap.timeline({ paused: true, defaults: { ease: ENTER } });

  const stage = q1('stage');
  const grid = q1('grid');
  const glow = q1('glow');
  const cursor = q1('cursor');
  const deckSurface = q1('deckSurface');
  const deckContent = q1('deckContent');
  const parts = q('part');
  const deckText = q('deckText');
  const chrome = q1('chrome');
  const loadbar = q1('loadbar');
  const laptop = q1('laptop');
  const screen = q1('screen');
  const sheen = q1('sheen');

  /* ---------------------------------------------------------------
     ACT I — IDEA (0.0 → 2.0)
     A grid resolves out of nothing, one ember of light appears, and the
     camera leans in. Nothing is asked of the visitor except curiosity.
  --------------------------------------------------------------- */

  if (stage) {
    // A single slow push that runs UNDER the entire film — this is the camera.
    tl.fromTo(stage, { scale: 0.93 }, { scale: 1, duration: RUNTIME * 0.82, ease: CAMERA }, ACT.idea);
  }

  if (grid) {
    tl.fromTo(grid, { opacity: 0, scale: 1.14 }, { opacity: 1, scale: 1, duration: 1.7, ease: CAMERA }, ACT.idea);
  }

  if (glow) {
    tl.fromTo(glow, { opacity: 0, scale: 0.08 }, { opacity: 0.85, scale: 0.42, duration: 1.6 }, ACT.idea + 0.2);
  }

  if (present(q('particle'))) {
    tl.fromTo(
      q('particle'),
      { opacity: 0, scale: 0.4 },
      { opacity: 0.9, scale: 1, duration: 1.1, stagger: { each: STAGGER.particle, from: 'random' } },
      ACT.idea + 0.35
    );
  }

  if (cursor) {
    tl.to(cursor, { opacity: 1, duration: 0.25 }, ACT.idea + 0.9);
    // The blink lives ON the timeline and is finite. As an independent
    // infinite tween it kept writing opacity:1 and survived act II's
    // fade-out, leaving an orange bar stranded over the finished laptop.
    tl.to(
      cursor,
      { opacity: 0, duration: 0.4, repeat: 1, yoyo: true, ease: 'steps(1)' },
      ACT.idea + 1.15
    );
  }

  /* ---------------------------------------------------------------
     ACT II — BLUEPRINT (2.0 → 4.3)
     The light opens out into structure. Columns fall, baselines run, and
     the wireframe strokes itself in. No element ever "pops".
  --------------------------------------------------------------- */

  if (cursor) tl.to(cursor, { opacity: 0, duration: 0.3, ease: EXIT }, ACT.blueprint);
  if (glow) tl.to(glow, { scale: 1.05, opacity: 0.38, duration: 1.5, ease: CAMERA }, ACT.blueprint);

  if (present(q('col'))) {
    tl.to(q('col'), { scaleY: 1, duration: 0.85, ease: DRAW, stagger: STAGGER.hairline }, ACT.blueprint + 0.1);
  }
  if (present(q('baseline'))) {
    tl.to(q('baseline'), { scaleX: 1, duration: 0.9, ease: DRAW, stagger: 0.1 }, ACT.blueprint + 0.35);
  }
  if (present(q('dim'))) {
    tl.to(q('dim'), { opacity: 1, duration: 0.5, stagger: 0.08 }, ACT.blueprint + 0.7);
  }

  if (deckSurface) {
    tl.to(
      deckSurface,
      { backgroundColor: 'rgba(12,8,7,0.38)', borderColor: 'rgba(255,255,255,0.10)', duration: 1.0 },
      ACT.blueprint + 0.5
    );
  }

  if (present(parts)) {
    // Wireframe rectangles arrive top-to-bottom, as if someone is drawing them.
    tl.fromTo(
      parts,
      { opacity: 0, y: 7 },
      { opacity: 1, y: 0, duration: 0.6, stagger: STAGGER.block },
      ACT.blueprint + 0.55
    );
  }

  /* ---------------------------------------------------------------
     ACT III — DESIGN (4.3 → 6.3)
     Structure earns its surface. Guides retire, greys take colour, and
     the placeholder bars hand over to real typography.
  --------------------------------------------------------------- */

  if (present(q('col'))) {
    tl.to(q('col'), { scaleY: 0, opacity: 0, duration: 0.7, ease: EXIT, stagger: STAGGER.hairline }, ACT.design);
  }
  if (present(q('baseline'))) {
    tl.to(q('baseline'), { opacity: 0, duration: 0.5, ease: EXIT }, ACT.design);
  }
  if (present(q('dim'))) {
    tl.to(q('dim'), { opacity: 0, duration: 0.4, ease: EXIT }, ACT.design);
  }

  // Colour sweeps left-to-right across the artboard rather than landing at once.
  parts.forEach((part) => {
    const role = part.dataset.role ?? '';
    const vars = DESIGNED[role];
    if (!vars) return;
    const offset = (part.offsetLeft / Math.max(part.offsetParent instanceof HTMLElement ? part.offsetParent.offsetWidth : 1, 1)) * 0.45;
    tl.to(part, { ...vars, duration: 0.85, ease: ENTER }, ACT.design + 0.25 + offset);
  });

  if (q1('mediaFill')) {
    tl.to(q1('mediaFill'), { opacity: 1, duration: 0.9, ease: ENTER }, ACT.design + 0.5);
  }

  if (present(deckText)) {
    tl.fromTo(
      deckText,
      { opacity: 0, y: 8 },
      { opacity: 1, y: 0, duration: 0.7, stagger: STAGGER.block },
      ACT.design + 0.55
    );
  }

  if (deckSurface) {
    tl.to(deckSurface, { backgroundColor: 'rgba(10,7,6,0.72)', duration: 0.9 }, ACT.design + 0.3);
  }

  /* ---------------------------------------------------------------
     ACT IV — DEVELOPMENT (6.3 → 8.3)
     Four components, a folder, three lines of output. Then they dissolve
     upward INTO the artboard — they compiled, they did not decorate.
  --------------------------------------------------------------- */

  if (present(q('componentCard'))) {
    tl.fromTo(
      q('componentCard'),
      { opacity: 0, y: 16, z: -40 },
      { opacity: 1, y: 0, z: 0, duration: 0.7, stagger: STAGGER.card },
      ACT.build
    );
  }
  if (q1('tree')) {
    tl.fromTo(q1('tree'), { opacity: 0, x: -10 }, { opacity: 1, x: 0, duration: 0.6 }, ACT.build + 0.25);
  }

  // Status lines occupy the same grid cell, so each replaces the last cleanly.
  q('statusLine').forEach((line, i) => {
    const at = ACT.build + 0.5 + i * 0.5;
    tl.fromTo(line, { opacity: 0, y: 9 }, { opacity: 1, y: 0, duration: 0.35 }, at);
    if (i < q('statusLine').length - 1) {
      tl.to(line, { opacity: 0, y: -9, duration: 0.3, ease: EXIT }, at + 0.45);
    }
  });

  if (present(q('componentCard'))) {
    tl.to(
      q('componentCard'),
      { opacity: 0, y: -22, z: 30, duration: 0.6, ease: EXIT, stagger: STAGGER.card * 0.7 },
      ACT.launch - 0.35
    );
  }
  if (q1('tree')) {
    tl.to(q1('tree'), { opacity: 0, x: -12, duration: 0.5, ease: EXIT }, ACT.launch - 0.35);
  }
  if (present(q('statusLine'))) {
    tl.to(q('statusLine'), { opacity: 0, duration: 0.4, ease: EXIT }, ACT.launch + 0.4);
  }

  /* ---------------------------------------------------------------
     ACT V — LAUNCH (8.3 → 10.4)
     Chrome wraps the rectangle, the bar sweeps, the shell hardens into a
     laptop, and the real project arrives last because it is the payoff.
  --------------------------------------------------------------- */

  if (chrome) tl.to(chrome, { opacity: 1, duration: 0.5 }, ACT.launch);
  if (deckContent) {
    // Content settles beneath the new chrome bar — the site is now "in" a browser.
    tl.to(deckContent, { scale: 0.915, y: '4.2%', duration: 0.7, ease: CAMERA }, ACT.launch);
  }
  if (loadbar) {
    tl.fromTo(loadbar, { scaleX: 0 }, { scaleX: 1, duration: 0.85, ease: 'power2.inOut' }, ACT.launch + 0.25);
    tl.to(loadbar, { opacity: 0, duration: 0.3 }, ACT.launch + 1.15);
  }

  if (laptop) {
    tl.fromTo(laptop, { opacity: 0, scale: 0.965 }, { opacity: 1, scale: 1, duration: 0.9, ease: ARRIVE }, ACT.launch + 0.95);
  }
  if (chrome) tl.to(chrome, { opacity: 0, duration: 0.5, ease: EXIT }, ACT.launch + 1.15);

  // The built site hands over to the real one. Crossfade, same rectangle.
  if (screen) tl.to(screen, { opacity: 1, duration: 0.8 }, ACT.launch + 1.25);
  if (deckContent) tl.to(deckContent, { opacity: 0, duration: 0.6, ease: EXIT }, ACT.launch + 1.3);
  if (deckSurface) tl.to(deckSurface, { opacity: 0, duration: 0.6 }, ACT.launch + 1.3);
  if (sheen) tl.to(sheen, { opacity: 1, duration: 1.0 }, ACT.launch + 1.5);

  /* ---------------------------------------------------------------
     SETTLE (10.4 → 11.2)
     Ambient light drops back so the CTA above is the brightest promise
     on the screen. The film ends by getting out of the way.
  --------------------------------------------------------------- */

  if (glow) tl.to(glow, { opacity: 0.22, scale: 1.25, duration: 1.1, ease: CAMERA }, ACT.settle - 0.4);
  if (grid) tl.to(grid, { opacity: 0.55, duration: 1.0 }, ACT.settle - 0.4);
  if (present(q('particle'))) {
    tl.to(q('particle'), { opacity: 0.45, duration: 1.0, stagger: 0.02 }, ACT.settle - 0.4);
  }

  // Guarantee the timeline is exactly RUNTIME long so skip maths stay honest.
  tl.set({}, {}, RUNTIME);

  return tl;
}
