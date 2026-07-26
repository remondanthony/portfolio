/**
 * Single source of truth for the "The Website Is Born" timeline.
 *
 * Every act is expressed as an absolute start time on the master timeline so
 * scenes can be authored independently and still stay in lockstep. Changing a
 * duration here re-times the whole film without touching a single scene file.
 */

export const ACT = {
  idea: 0.0,
  blueprint: 2.0,
  design: 4.3,
  build: 6.3,
  launch: 8.3,
  settle: 10.4,
} as const;

export type ActName = keyof typeof ACT;

/** Total runtime of the autoplay film, in seconds. */
export const RUNTIME = 11.2;

/** Stagger grammar — consistent rhythm across every scene. */
export const STAGGER = {
  hairline: 0.045,
  block: 0.07,
  card: 0.11,
  particle: 0.06,
} as const;

/** Idle behaviour once the film has resolved. */
export const IDLE = {
  breathDuration: 6.5,
  breathDistance: 9,
  parallaxMaxDeg: 5.5,
  parallaxLerp: 0.085,
} as const;

/**
 * How aggressively a visitor's first scroll/click/key collapses the film.
 * Short enough to feel responsive, long enough not to look like a glitch.
 */
export const SKIP_DURATION = 0.9;

/** Captions, one per act. Kept here so copy edits never touch motion code. */
export const CAPTIONS: ReadonlyArray<{ at: ActName; text: string }> = [
  { at: 'idea', text: 'Every great website starts with an idea.' },
  { at: 'blueprint', text: 'Structure before surface.' },
  { at: 'design', text: 'Then it finds its voice.' },
  { at: 'build', text: 'Engineered, committed, deployed.' },
  { at: 'launch', text: 'And it goes live.' },
];
