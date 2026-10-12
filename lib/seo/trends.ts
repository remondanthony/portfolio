/**
 * Google Trends, the free research option.
 *
 * Google's Trends API is an application-only alpha (developers.google.com/
 * search/apis/trends), so there is no supported way for the CMS to fetch
 * Trends data itself — and scraping trends.google.com is not one. Instead:
 *   1. the CMS builds the official Trends report link for your terms, place
 *      and time range;
 *   2. you download the report's CSVs with Trends' own Download buttons;
 *   3. the CMS reads those files: interest over time (drawn as a chart) and
 *      related / rising queries.
 *
 * Interest is Google's normalised 0–100 index: 100 is the peak of whichever
 * terms were compared in that one report. It is never search volume, and
 * two different reports' numbers cannot be compared.
 *
 * Pure and browser-safe.
 */
import { parseDelimited } from './csv';

export const TRENDS_MAX_TERMS = 5;

export const TRENDS_RANGES = {
  'now 7-d': 'Past 7 days',
  'today 1-m': 'Past 30 days',
  'today 3-m': 'Past 90 days',
  'today 12-m': 'Past 12 months',
  'today 5-y': 'Past 5 years',
  all: '2004 – present',
} as const;
export type TrendsRange = keyof typeof TRENDS_RANGES;

/** Places offered in the picker. '' is worldwide; region codes like US-NY or IN-MH can be typed too. */
export const TRENDS_PLACES: [string, string][] = [
  ['', 'Worldwide'], ['IN', 'India'], ['US', 'United States'], ['GB', 'United Kingdom'], ['CA', 'Canada'],
  ['AU', 'Australia'], ['AE', 'United Arab Emirates'], ['SG', 'Singapore'], ['DE', 'Germany'], ['FR', 'France'],
  ['IN-MH', 'India · Maharashtra'], ['IN-KA', 'India · Karnataka'], ['IN-DL', 'India · Delhi'], ['IN-TN', 'India · Tamil Nadu'],
  ['US-NY', 'United States · New York'], ['US-CA', 'United States · California'], ['US-TX', 'United States · Texas'],
];

export const GEO = /^([A-Z]{2}(-[A-Z0-9]{1,3})?)?$/;

export function trendsTermProblems(terms: string[]): string[] {
  const out: string[] = [];
  if (!terms.length) out.push('Enter at least one keyword.');
  if (terms.length > TRENDS_MAX_TERMS) out.push(`Google Trends compares at most ${TRENDS_MAX_TERMS} terms at once.`);
  if (terms.some((t) => t.includes(','))) out.push('A term cannot contain a comma — Google Trends uses commas to separate terms.');
  if (terms.some((t) => t.length > 100)) out.push('Each term must be 100 characters or fewer.');
  return out;
}

/** The official Google Trends Explore report for these terms, place and range. */
export function trendsExploreUrl(terms: string[], geo: string, range: TrendsRange): string {
  const q = new URLSearchParams();
  q.set('date', range);
  if (geo) q.set('geo', geo);
  q.set('q', terms.map((t) => t.trim()).join(','));
  q.set('hl', 'en');
  return `https://trends.google.com/trends/explore?${q.toString()}`;
}

/** Interest over time from Trends' "Interest over time" CSV (multiTimeline.csv). */
export type InterestOverTime = {
  /** "Week", "Day", "Month" or "Time" — whatever Trends labelled the date column. */
  period: string;
  dates: string[];
  series: { term: string; place: string; values: number[] }[];
};

const num = (cell: string) => {
  const c = cell.trim();
  if (c === '<1') return 0.5; // Trends' way of saying "above zero but under 1"
  const n = Number(c);
  return Number.isFinite(n) && n >= 0 && n <= 100 ? n : null;
};

/**
 * Reads multiTimeline.csv: a "Category: …" line, a blank line, then a header
 * such as `Week,seo services: (India),web design: (India)` and one row per
 * period. Columns are matched by position after the date; the term and place
 * come from the header text.
 */
export function parseInterestOverTime(text: string): InterestOverTime | { error: string } {
  const rows = parseDelimited(text.replace(/^﻿/, ''), ',');
  const h = rows.findIndex((r) => /^(week|day|month|time|date)$/i.test((r[0] ?? '').trim()) && r.length >= 2);
  if (h < 0) return { error: 'This does not look like a Google Trends "Interest over time" CSV (no Week/Day/Month column found).' };
  const header = rows[h].map((c) => c.trim());
  const series = header.slice(1).map((label) => {
    const m = label.match(/^(.*?):\s*\((.*)\)\s*$/);
    return { term: (m ? m[1] : label).trim(), place: (m ? m[2] : '').trim(), values: [] as number[] };
  });
  if (!series.length || series.length > TRENDS_MAX_TERMS) return { error: `Expected 1–${TRENDS_MAX_TERMS} terms in the header.` };
  const dates: string[] = [];
  for (const r of rows.slice(h + 1)) {
    if (!r[0]?.trim()) continue;
    const values = r.slice(1, series.length + 1).map(num);
    if (values.length !== series.length || values.some((v) => v === null)) {
      return { error: `Row "${r.join(',').slice(0, 60)}" has values that are not between 0 and 100.` };
    }
    dates.push(r[0].trim());
    values.forEach((v, i) => series[i].values.push(v!));
  }
  if (!dates.length) return { error: 'The file has a header but no data rows.' };
  return { period: header[0], dates, series };
}

/** Related queries: Trends' "TOP" (relative 0–100) and "RISING" (+N% or "Breakout") lists. */
export type RelatedQueries = { top: { query: string; value: number }[]; rising: { query: string; value: string }[] };

export function parseRelatedQueries(text: string): RelatedQueries | { error: string } {
  const rows = parseDelimited(text.replace(/^﻿/, ''), ',');
  const out: RelatedQueries = { top: [], rising: [] };
  let section: 'top' | 'rising' | null = null;
  for (const r of rows) {
    const first = (r[0] ?? '').trim();
    if (/^top$/i.test(first)) { section = 'top'; continue; }
    if (/^rising$/i.test(first)) { section = 'rising'; continue; }
    if (!section || r.length < 2 || !first) continue;
    const v = (r[1] ?? '').trim();
    if (section === 'top') {
      const n = num(v);
      if (n !== null) out.top.push({ query: first.slice(0, 120), value: n });
    } else if (/^(breakout|\+?[\d,]+%)$/i.test(v)) {
      out.rising.push({ query: first.slice(0, 120), value: v });
    }
  }
  if (!out.top.length && !out.rising.length) return { error: 'This does not look like a Google Trends "Related queries" CSV (no TOP or RISING section found).' };
  return out;
}

/** Average, peak and latest interest for one series, rounded to whole points. */
export function summarize(values: number[]) {
  const avg = values.reduce((a, b) => a + b, 0) / values.length;
  return { average: Math.round(avg), peak: Math.round(Math.max(...values)), latest: Math.round(values[values.length - 1]) };
}
