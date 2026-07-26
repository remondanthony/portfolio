/**
 * A deliberately small ease vocabulary. Restraint here is what separates
 * "premium" from "animated" — four curves, each with one job.
 */

/** Camera moves and anything that should feel like mass in motion. */
export const CAMERA = 'power3.inOut';

/** Elements entering the frame. Decisive start, long settle. */
export const ENTER = 'power3.out';

/** Elements leaving. Quick, unsentimental. */
export const EXIT = 'power2.in';

/** Strokes drawing themselves — near-linear so the pen speed reads as constant. */
export const DRAW = 'power1.inOut';

/** The one moment allowed a little overshoot: the laptop arriving. */
export const ARRIVE = 'back.out(1.35)';
