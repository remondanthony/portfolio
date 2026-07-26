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

/** The one moment allowed a little overshoot: browser chrome arriving. */
export const ARRIVE = 'back.out(1.35)';

/**
 * The LEGO click.
 *
 * A component travelling to its slot should decelerate hard and stop dead —
 * no bounce, no settle wobble. power4.out is the strongest deceleration that
 * still reads as physical rather than abrupt, and it is what makes fifteen
 * separate arrivals feel like assembly instead of animation.
 */
export const LOCK = 'power4.out';
