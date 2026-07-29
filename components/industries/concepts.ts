/**
 * The eight exhibits.
 *
 * Each one is a supplied hero mockup: a website design composed into the
 * environment of the business it belongs to. The artwork is final and is the
 * source of truth — the layout is built around it, not the other way round.
 *
 * That is why there is no brand, headline or row data here any more. The
 * concept sites used to be drawn in CSS on top of a photograph, so the code
 * had to know that the gym was called Ironhaus. The artwork now carries its
 * own branding (Stronger, Tavolo, MedCare, Luxe, Aurelle, Habitat, Learnix,
 * Lexora), and duplicating it in a data file would only let the two drift.
 *
 * `benefit` and `story` are the visitor-facing copy. Every benefit is one
 * imperative sentence to a business owner and all eight verbs differ — Answer,
 * Make, Sell, Keep, Say, Earn, Give, Be. Nothing claims an outcome, names a
 * client, or quotes a number.
 */

/** How much of the measure an exhibit takes, and where its caption sits. */
export type Format = 'wide' | 'pair' | 'full';

export type Concept = {
  key: string;
  /** Industry name as displayed, e.g. "Fitness & Wellness". */
  industry: string;
  /** The card's headline: one imperative sentence to the business owner. */
  benefit: string;
  /** The supporting line: what the site actually carries. */
  story: string;

  /**
   * Path under /public/concepts/. Every asset is 1536x1024, so every plate is
   * 3:2 and nothing is ever cropped.
   */
  photo: string;
  /**
   * What the artwork shows. Not decorative: these mockups are most of what a
   * visitor looks at here, and a screen-reader user who only gets the caption
   * misses the half that does the persuading.
   */
  alt: string;
  format: Format;
};

export const CONCEPTS: Concept[] = [
  {
    key: 'fitness',
    industry: 'Fitness & Wellness',
    benefit: 'Answer the nerves before anyone walks in.',
    story: 'Timetable, trial and pricing, no phone call.',
    photo: '/concepts/fitness.png',
    alt: 'A gym website design headed “Train Stronger”, shown on a screen in a dark weights room.',
    format: 'wide',
  },
  {
    key: 'healthcare',
    industry: 'Healthcare',
    benefit: 'Make the first appointment the easy part.',
    story: 'Who you’ll see, what it costs, when to come.',
    photo: '/concepts/healthcare.png',
    alt: 'A clinic website design headed “Care Without The Wait”, shown on a screen in a bright consulting room.',
    format: 'pair',
  },
  {
    key: 'restaurant',
    industry: 'Restaurant',
    benefit: 'Sell the room, not just the menu.',
    story: 'Menu, hours and booking, legible on a phone.',
    // The supplied file is spelled "resturant". Referenced exactly as given
    // rather than renamed, so re-exporting over it keeps working.
    photo: '/concepts/resturant.png',
    alt: 'A restaurant website design headed “Dining Reimagined”, shown on a screen on a candlelit table.',
    format: 'pair',
  },
  {
    key: 'boutique',
    industry: 'Boutique',
    benefit: 'Keep the window lit after closing.',
    story: 'Stock, sizing and returns, all on the page.',
    photo: '/concepts/boutique.png',
    alt: 'A fashion website design headed “Timeless Pieces”, shown on a screen in a pale boutique interior.',
    format: 'pair',
  },
  {
    key: 'beauty',
    industry: 'Beauty & Skincare',
    benefit: 'Say who it’s for, and who it isn’t.',
    story: 'Ingredients, patch tests and routine, in plain words.',
    photo: '/concepts/beauty.png',
    alt: 'A skincare website design headed “Glow With Confidence”, shown on a screen beside cream jars and a candle.',
    format: 'pair',
  },
  {
    key: 'realestate',
    industry: 'Real Estate',
    benefit: 'Earn the valuation before the call.',
    story: 'Listings kept current, and worth a slow look.',
    photo: '/concepts/realestate.png',
    alt: 'An estate agency website design headed “Find Extraordinary Homes”, shown on a screen on a dark marble desk.',
    format: 'full',
  },
  {
    key: 'education',
    industry: 'Education',
    benefit: 'Give a beginner enough to enrol tonight.',
    story: 'Levels, fees and start dates, all upfront.',
    photo: '/concepts/education.png',
    alt: 'A course website design headed “Learn Today. Lead Tomorrow.”, shown on a screen on a study desk.',
    format: 'pair',
  },
  {
    key: 'law',
    industry: 'Law',
    benefit: 'Be the firm that names its fees.',
    story: 'Practice areas, people and costs, without hedging.',
    photo: '/concepts/law.png',
    alt: 'A law firm website design headed “Legal Confidence. Every Step.”, shown on a screen in a panelled office.',
    format: 'pair',
  },
];
