/**
 * The eight exhibits.
 *
 * Each one pairs a photograph of a business with a fragment of the website
 * that business might have. Everything here is invented but checked: the
 * restaurant was originally "Sorrel", which is a Michelin-starred restaurant
 * in Dorking, so it became Sedge. Concept work that borrows a real business's
 * name stops being concept work.
 *
 * `benefit` and `story` are the visitor-facing copy. Every benefit is one
 * imperative sentence to a business owner and all eight verbs differ — Answer,
 * Make, Sell, Keep, Say, Earn, Give, Be. Every story is a plain list of that
 * trade's actual plumbing. Nothing claims an outcome, names a client, or
 * quotes a number, because there is no shipped client work behind this page.
 */

export type Format = 'wide' | 'column' | 'bleed';

export type Concept = {
  key: string;
  /** Industry name as displayed, e.g. "Fitness & Wellness". */
  industry: string;
  /** The card's headline: one imperative sentence to the business owner. */
  benefit: string;
  /** The supporting line: what the site actually carries. */
  story: string;

  /** Invented brand for the concept site. */
  brand: string;
  /** The concept site's own headline, shown large on the floating canvas. */
  headline: string;
  /** One real-looking row of that site's content. */
  row: { label: string; meta: string };

  /** Photograph under /public/concepts/. See CREDITS.md for provenance. */
  photo: string;
  /**
   * What the photograph shows. Not decorative: the photography carries most of
   * this section, and a screen-reader user who only gets the caption misses
   * the half of it that does the persuading.
   */
  alt: string;
  /** Plate shape and grid behaviour. */
  format: Format;
};

export const CONCEPTS: Concept[] = [
  {
    key: 'fitness',
    industry: 'Fitness & Wellness',
    benefit: 'Answer the nerves before anyone walks in.',
    story: 'Timetable, trial and pricing, no phone call.',
    brand: 'Ironhaus',
    headline: 'Earn Every Rep',
    row: { label: 'Barbell Club', meta: 'Mon 6:30am' },
    photo: '/concepts/fitness.jpg',
    alt: 'A lifter holding a loaded barbell overhead in a low-lit gym.',
    format: 'wide',
  },
  {
    key: 'healthcare',
    industry: 'Healthcare',
    benefit: 'Make the first appointment the easy part.',
    story: 'Who you’ll see, what it costs, when to come.',
    brand: 'Brightwell',
    headline: 'Care without the wait',
    row: { label: 'Same-Day Clinic', meta: 'Till 8pm' },
    photo: '/concepts/healthcare.jpg',
    alt: 'A doctor in conversation with a patient across a consulting-room desk.',
    format: 'column',
  },
  {
    key: 'restaurant',
    industry: 'Restaurant',
    benefit: 'Sell the room, not just the menu.',
    story: 'Menu, hours and booking, legible on a phone.',
    brand: 'Sedge',
    headline: 'Dinner by the fire',
    row: { label: 'Grilled Bream', meta: '£26' },
    photo: '/concepts/restaurant.jpg',
    alt: 'A plated dish of sliced duck and herbs on a dark plate, warmly lit.',
    format: 'column',
  },
  {
    key: 'boutique',
    industry: 'Boutique',
    benefit: 'Keep the window lit after closing.',
    story: 'Stock, sizing and returns, all on the page.',
    brand: 'Halden',
    headline: 'The Autumn Edit',
    row: { label: 'Wool Overshirt', meta: '£245' },
    photo: '/concepts/boutique.jpg',
    alt: 'A model in a beige suit under hard directional light, casting a long shadow.',
    format: 'column',
  },
  {
    key: 'beauty',
    industry: 'Beauty & Skincare',
    benefit: 'Say who it’s for, and who it isn’t.',
    story: 'Ingredients, patch tests and routine, in plain words.',
    brand: 'Aurelle',
    headline: 'Made for reactive skin',
    row: { label: 'Barrier Cream', meta: '£58' },
    photo: '/concepts/beauty.jpg',
    alt: 'An amber serum bottle resting on soft white fabric in daylight.',
    format: 'column',
  },
  {
    key: 'realestate',
    industry: 'Real Estate',
    benefit: 'Earn the valuation before the call.',
    story: 'Listings kept current, and worth a slow look.',
    brand: 'Ashcombe',
    headline: 'Rare homes, sold quietly',
    row: { label: 'Chesham Place', meta: '£6.95m, Belgravia' },
    photo: '/concepts/realestate.jpg',
    alt: 'A contemporary house at dusk, its interior lit behind full-height glass.',
    format: 'bleed',
  },
  {
    key: 'education',
    industry: 'Education',
    benefit: 'Give a beginner enough to enrol tonight.',
    story: 'Levels, fees and start dates, all upfront.',
    brand: 'Beanstalk',
    headline: 'Small lessons, real progress',
    row: { label: 'Spanish Basics', meta: '6 weeks' },
    photo: '/concepts/education.jpg',
    alt: 'Two students working side by side over open notebooks and a laptop.',
    format: 'wide',
  },
  {
    key: 'law',
    industry: 'Law',
    benefit: 'Be the firm that names its fees.',
    story: 'Practice areas, people and costs, without hedging.',
    brand: 'Marchmont',
    headline: 'Counsel for complex matters',
    row: { label: 'Wills & Probate', meta: 'From £480' },
    photo: '/concepts/law.jpg',
    alt: 'A set of brass scales and a gavel beside law books on a desk.',
    format: 'wide',
  },
];
