/**
 * Timing grammar for "The Website Is Born".
 *
 * The film is SCROLL-SCRUBBED: these seconds are not wall-clock, they are
 * proportions of the pinned scroll distance. ScrollTrigger maps 0 → RUNTIME
 * across PIN_DISTANCE, so re-timing an act here re-timings the scroll feel
 * without touching a single tween.
 */

export const ACT = {
  /** Blank Figma-like canvas, cursor blinking. */
  canvas: 0.0,
  /** Components fly in and lock into place, one at a time. */
  assemble: 1.4,
  /** Images, real type, colour, spacing. It becomes premium. */
  polish: 5.2,
  /** A short development beat: components, tree, deploy. */
  develop: 7.4,
  /** The browser loads and the real project takes the screen. */
  live: 9.4,
  /** Everything rests. */
  settle: 11.6,
} as const;

export type ActName = keyof typeof ACT;

/** Total timeline length. Arbitrary units — scroll distance defines the pace. */
export const RUNTIME = 12.4;

/**
 * How much scroll the pinned build consumes.
 *
 * This is the one number that trades "time to read each beat" against "how
 * long before the visitor reaches #about". 380% ≈ 3.8 viewport heights, which
 * gives each act roughly three quarters of a screen of travel.
 */
export const PIN_DISTANCE = '+=380%';

/**
 * How long after a component locks before it refines itself.
 *
 * This single number is what makes the build continuous: because each part
 * polishes on its own clock rather than at a shared act boundary, the
 * refinements of early parts overlap the arrivals of later ones, and there is
 * never a moment where everything has stopped.
 */
export const POLISH_LAG = 0.85;

/**
 * Parallax travel over the full film, in pixels.
 *
 * All three planes drift the same way at different rates. The stage moves
 * LEAST and DOWNWARD: a negative value here read as "nearest to camera" but
 * carried the machine ~21px up into the headline mid-scrub, which is a
 * collision no amount of static margin can fix. Drifting it gently away from
 * the copy keeps the depth cue and makes the clearance monotonic.
 */
export const PARALLAX = {
  grid: 30,
  dust: 66,
  stage: 12,
} as const;

/** Stagger grammar — the rhythm of the LEGO assembly. */
export const STAGGER = {
  navItem: 0.09,
  block: 0.16,
  card: 0.14,
  particle: 0.06,
} as const;

/** Idle behaviour: float and parallax, both deliberately restrained. */
export const IDLE = {
  floatDuration: 7,
  floatDistance: 10,
  parallaxMaxDeg: 4.5,
  parallaxLerp: 0.075,
} as const;

/** Captions, one per act. Copy edits never touch motion code. */
export const CAPTIONS: ReadonlyArray<{ at: ActName; text: string }> = [
  { at: 'canvas', text: 'A blank canvas.' },
  { at: 'assemble', text: 'Every component, placed with intent.' },
  { at: 'polish', text: 'Then it becomes premium.' },
  { at: 'develop', text: 'Engineered, committed, deployed.' },
  { at: 'live', text: 'From idea to launch.' },
];
