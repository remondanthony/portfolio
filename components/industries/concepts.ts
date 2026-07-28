/**
 * The eight concept sites.
 *
 * Real-sounding copy, no lorem, no borrowed brands. Names were checked against
 * existing businesses — the restaurant was originally "Sorrel", which is a
 * Michelin-starred restaurant in Dorking, so it became Sedge.
 *
 * `layout` selects where the hero's media sits; `rows` selects how the second
 * section renders. Between them the eight read as eight different sites rather
 * than one template in eight palettes.
 */

export type Layout = 'full' | 'right' | 'centre' | 'left' | 'grid' | 'none';
export type Rows = 'schedule' | 'menu' | 'service' | 'product' | 'listing' | 'practice' | 'course';

export type Concept = {
  key: string;
  brand: string;
  nav: [string, string, string];
  headline: string;
  sub: string;
  cta: string;
  sectionTitle: string;
  items: { label: string; meta: string }[];
  layout: Layout;
  rows: Rows;
};

export const CONCEPTS: Concept[] = [
  {
    key: 'fitness', brand: 'Ironhaus', nav: ['Classes', 'Coaches', 'Pricing'],
    headline: 'Earn Every Rep', sub: 'Coached barbell training in Shoreditch', cta: 'Book a trial',
    sectionTitle: 'This Week', layout: 'full', rows: 'schedule',
    items: [
      { label: 'Barbell Club', meta: 'Mon 6:30am' },
      { label: 'Conditioning', meta: 'Wed 7:00pm' },
      { label: 'Olympic Lifting', meta: 'Sat 9:00am' },
    ],
  },
  {
    key: 'restaurant', brand: 'Sedge', nav: ['Menu', 'Wine', 'Visit'],
    headline: 'Dinner by the fire', sub: 'Seasonal plates and natural wine', cta: 'Book a table',
    sectionTitle: 'Tonight’s Menu', layout: 'right', rows: 'menu',
    items: [
      { label: 'Ember Leeks', meta: '£9' },
      { label: 'Grilled Bream', meta: '£26' },
      { label: 'Burnt Honey Tart', meta: '£8' },
    ],
  },
  {
    key: 'healthcare', brand: 'Brightwell', nav: ['Services', 'Providers', 'Contact'],
    headline: 'Care without the wait', sub: 'Same-day appointments', cta: 'Book appointment',
    sectionTitle: 'Our Services', layout: 'centre', rows: 'service',
    items: [
      { label: 'Family Medicine', meta: 'All ages' },
      { label: 'Same-Day Clinic', meta: 'Till 8pm' },
      { label: 'Health Checks', meta: '30 minutes' },
    ],
  },
  {
    key: 'beauty', brand: 'Aurelle', nav: ['Shop', 'Ritual', 'Journal'],
    headline: 'Made for reactive skin', sub: 'Six formulas. Nothing you don’t need.', cta: 'Shop all six',
    sectionTitle: 'The Range', layout: 'left', rows: 'product',
    items: [
      { label: 'Cleansing Balm', meta: '£42' },
      { label: 'Barrier Cream', meta: '£58' },
      { label: 'Night Oil', meta: '£64' },
    ],
  },
  {
    key: 'boutique', brand: 'Halden', nav: ['New', 'Shop', 'Stockists'],
    headline: 'The Autumn Edit', sub: 'Fifteen pieces, cut in Portugal', cta: 'Shop the edit',
    sectionTitle: 'New In', layout: 'grid', rows: 'product',
    items: [
      { label: 'Wool Overshirt', meta: '£245' },
      { label: 'Bias Slip Dress', meta: '£180' },
      { label: 'Cropped Trouser', meta: '£165' },
    ],
  },
  {
    key: 'realestate', brand: 'Ashcombe', nav: ['Sales', 'Lettings', 'Private'],
    headline: 'Rare homes, sold quietly', sub: 'Prime London and the home counties', cta: 'Request valuation',
    sectionTitle: 'Current Listings', layout: 'full', rows: 'listing',
    items: [
      { label: 'Chesham Place', meta: '£6.95m, Belgravia' },
      { label: 'Netherby House', meta: '£3.4m, Surrey' },
      { label: 'Cadogan Mews', meta: '£2.15m, Chelsea' },
    ],
  },
  {
    key: 'law', brand: 'Marchmont', nav: ['Practice', 'People', 'Contact'],
    headline: 'Counsel for complex matters', sub: 'Commercial, property, private client', cta: 'Book a consultation',
    sectionTitle: 'Practice Areas', layout: 'none', rows: 'practice',
    items: [
      { label: 'Corporate', meta: 'Fixed fee' },
      { label: 'Property', meta: 'From £950' },
      { label: 'Wills & Probate', meta: 'From £480' },
    ],
  },
  {
    key: 'education', brand: 'Beanstalk', nav: ['Courses', 'Pricing', 'Login'],
    headline: 'Small lessons, real progress', sub: 'Ten minutes a day is enough', cta: 'Start free',
    sectionTitle: 'Start here', layout: 'right', rows: 'course',
    items: [
      { label: 'Spanish Basics', meta: '6 weeks' },
      { label: 'Everyday Python', meta: 'Beginner' },
      { label: 'Public Speaking', meta: '4 lessons' },
    ],
  },
];
