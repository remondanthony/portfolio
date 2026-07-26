/**
 * The portfolio registry the finale reads from.
 *
 * This is the future-proofing seam: adding Boutique, Restaurant, Real Estate,
 * Gym or Law Firm is a data edit, never an animation edit. The laptop scene
 * takes whichever entry it is handed and knows nothing else about it.
 */

export type Project = {
  /** Stable key, also used as the React key when rotating. */
  id: string;
  /** Shown in the browser URL pill before the laptop forms. */
  domain: string;
  /** Screen capture, 16:10 to match the display aperture. */
  screen: string;
  /** Alt text — this is a real portfolio piece, so describe it properly. */
  alt: string;
  /** Sector label, reserved for the rotating-project caption. */
  sector: string;
};

export const PROJECTS: readonly Project[] = [
  {
    id: 'born21',
    domain: 'born21.com',
    screen: '/projects/born21.jpg',
    alt: 'Born21 — YouTube growth agency website built by VIONICHE',
    sector: 'Media · Agency',
  },
];

/**
 * Picks the project to feature. Deterministic by default so server and client
 * render identically — pass an index to rotate without touching the timeline.
 */
export function getFeaturedProject(index = 0): Project {
  return PROJECTS[index % PROJECTS.length];
}
