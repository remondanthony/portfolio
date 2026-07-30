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
export const RUNTIME = 14.4;

/**
 * How much scroll the pinned build consumes.
 *
 * This is the one number that trades "time to read each beat" against "how
 * long before the visitor reaches #about".
 *
 * It was 440% — roughly four and a half screens, about 4,000px at a normal
 * laptop height, before the page would move on. That was right when the hero
 * was a full-screen film and the machine was the only thing in it. It is wrong
 * now that the hero is a marketing layout with copy, a feature strip and a
 * tagline that all have to be reachable: at 440% a visitor scrolled four
 * screens of laptop before seeing the word "Performance".
 *
 * 120% keeps every act and every tween exactly as written — RUNTIME is
 * unchanged, so the timeline is identical — and simply scrubs it across one
 * extra screen instead of four and a half.
 */
export const PIN_DISTANCE = '+=120%';

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

/**
 * THE ARRIVAL — the hero copy, after the machine has finished.
 *
 * On a scrubbed timeline "slow" is not a duration, it is scroll distance:
 * RUNTIME and PIN_DISTANCE were raised together so this reveal has room to
 * breathe without speeding up the build that precedes it.
 *
 * `step` is deliberately larger than the assembly staggers. The build is
 * busy and mechanical, so it wants a quick rhythm; this is the closing line
 * and wants space between each phrase.
 */
export const ARRIVE = {
  /** When the first line begins, just as the room starts dimming. */
  at: 11.4,
  /** Gap between one element and the next. */
  step: 0.26,
  /** How long any single element takes to settle. */
  duration: 1.3,
  /** A label's number leads its name by this much — a small internal beat. */
  numberLead: 0.1,
} as const;

/**
 * Rise distance per tier, in pixels.
 *
 * Bigger type travels further. That difference is the whole styling idea:
 * it reads as depth and hierarchy rather than as an effect, and it costs
 * nothing but a transform.
 */
export const RISE = {
  headline: 44,
  tagline: 30,
  body: 24,
  label: 18,
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
  // One shape, learnable in a glance: the process label, a full stop, then
  // three or four words naming what is literally on the display. Strategy,
  // Design and Development therefore appear verbatim in the acts they name,
  // and Launch is stamped by the closing line — so the four labels under the
  // hero describe the animation rather than sitting beside it.
  //
  // The polish beat is the exception: there are five acts and only four
  // labels, so it narrates the pixels instead of claiming a position.
  { at: 'canvas', text: 'Strategy. A blank canvas.' },
  { at: 'assemble', text: 'Design. Piece by piece.' },
  { at: 'polish', text: 'Placeholders out. Real type in.' },
  { at: 'develop', text: 'Development. Commit, build, deploy.' },
  { at: 'live', text: 'From idea to launch.' },
];
