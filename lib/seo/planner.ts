/**
 * Google Keyword Planner "keyword ideas" exports → the keyword library.
 *
 * No connection to Google Ads: the export is downloaded in Keyword Planner
 * and uploaded here. It goes through the same parser as every other import
 * (lib/seo/csv.ts: UTF-16 or UTF-8, tab or comma, title lines before the
 * header), with this column map. Column names are matched loosely — case,
 * spacing and punctuation are ignored, and common variations are listed —
 * and any column not listed is ignored.
 *
 * Keyword Planner's metrics are advertising data: competition is how many
 * advertisers bid (Low/Medium/High, index 0–100), not an SEO difficulty
 * score, and bids are top-of-page bid estimates. They are stored as such, in
 * the keyword's own `planner` block, and labelled that way everywhere.
 *
 * Pure and browser-safe.
 */
import { columnMap } from './csv';
import { COMPETITION, keywordProblems, normalizeKeyword, type Competition, type Keyword, type KeywordLibrary, type PlannerData } from './keywords';

export const PLANNER_COLUMNS = columnMap({
  keyword: 'keyword', keywords: 'keyword', 'keyword text': 'keyword', 'search term': 'keyword', 'keyword ideas': 'keyword',
  'avg. monthly searches': 'volume', 'average monthly searches': 'volume', 'avg monthly searches': 'volume', 'average searches': 'volume',
  'monthly searches': 'volume', 'search volume': 'volume', 'avg. searches': 'volume',
  competition: 'competition', 'competition level': 'competition',
  'competition (indexed value)': 'competitionIndex', 'competition indexed value': 'competitionIndex', 'competition index': 'competitionIndex',
  'three month change': 'threeMonthChange', '3 month change': 'threeMonthChange', 'three-month change': 'threeMonthChange', '3-month change': 'threeMonthChange',
  'yoy change': 'yoyChange', 'year over year change': 'yoyChange', 'year-over-year change': 'yoyChange', 'yearly change': 'yoyChange',
  'top of page bid (low range)': 'bidLow', 'top of page bid low range': 'bidLow', 'top of page bid (low)': 'bidLow', 'low range top of page bid': 'bidLow',
  'top of page bid (high range)': 'bidHigh', 'top of page bid high range': 'bidHigh', 'top of page bid (high)': 'bidHigh', 'high range top of page bid': 'bidHigh',
  currency: 'currency', 'currency code': 'currency',
  location: 'location', locations: 'location', 'target location': 'location',
});

/** Places offered when the export does not say. Free text is accepted too; empty = unknown, never guessed. */
export const PLANNER_LOCATIONS = ['Global', 'United States', 'India', 'United Kingdom', 'Canada', 'Australia', 'United Arab Emirates', 'Singapore'];

const EMPTY = /^(|-|--|—|n\/a|na|null)$/i;
const clean = (v: string | undefined) => (v ?? '').replace(/[\u0000-\u001f\u007f]/g, ' ').trim();

/** "1,300" → 1300. "1K – 10K" → a range. Anything else → a problem. */
function volume(raw: string): { volume?: number; volumeRange?: string } | string {
  if (EMPTY.test(raw)) return {};
  const plain = raw.replace(/[,\s]/g, '');
  if (/^\d+$/.test(plain)) return { volume: Number(plain) };
  if (/^\d+(\.\d+)?\s*[KM]?\s*[–—-]\s*\d+(\.\d+)?\s*[KM]?$/i.test(raw)) return { volumeRange: raw.replace(/\s*[–—-]\s*/, ' – ').slice(0, 40) };
  return `Avg. monthly searches "${raw.slice(0, 30)}" is not a number or a range like "1K – 10K"`;
}

/** "+25%", "-90%", "0 %", "25" → 25. Empty → undefined. Anything else → a problem. */
function percent(raw: string, name: string): number | undefined | string {
  if (EMPTY.test(raw)) return undefined;
  const m = raw.replace(/\s/g, '').match(/^([+-]?\d+(?:\.\d+)?)%?$/);
  if (!m) return `${name} "${raw.slice(0, 20)}" is not a percentage`;
  const n = Number(m[1]);
  return n < -100 || n > 1e6 ? `${name} ${n}% is out of range` : n;
}

/** "0.45", "1,234.50", "$1.20" → a number ≥ 0. */
function money(raw: string, name: string): number | undefined | string {
  if (EMPTY.test(raw)) return undefined;
  const s = raw.replace(/[$€£₹¥,\s]/g, '');
  if (!/^\d+(\.\d+)?$/.test(s)) return `${name} "${raw.slice(0, 20)}" is not an amount`;
  const n = Number(s);
  return n > 1e7 ? `${name} is out of range` : n;
}

export type PlannerRow = {
  line: number;
  keyword: string;
  data: Omit<PlannerData, 'importedAt'>;
  problems: string[];
};

/**
 * One row of an export → a keyword and its Keyword Planner data, plus
 * every problem found. `location` is the place chosen for the import, used
 * only when the row itself has none.
 */
export function plannerRow(line: number, values: Record<string, string>, location?: string): PlannerRow {
  const problems: string[] = [];
  const keyword = clean(values.keyword).replace(/\s+/g, ' ');
  problems.push(...keywordProblems({ keyword, type: 'secondary', source: 'google-keyword-planner', status: 'idea' }));
  const data: PlannerRow['data'] = {};

  const v = volume(clean(values.volume));
  if (typeof v === 'string') problems.push(v); else Object.assign(data, v);

  const comp = clean(values.competition).toLowerCase();
  if (!EMPTY.test(comp)) {
    if ((COMPETITION as readonly string[]).includes(comp)) data.competition = comp as Competition;
    else problems.push(`Competition "${clean(values.competition).slice(0, 20)}" is not Low, Medium or High`);
  }
  const idx = clean(values.competitionIndex);
  if (!EMPTY.test(idx)) {
    const n = Number(idx);
    if (!Number.isInteger(n) || n < 0 || n > 100) problems.push(`Competition index "${idx.slice(0, 20)}" is not a whole number from 0 to 100`);
    else data.competitionIndex = n;
  }
  for (const [field, name] of [['threeMonthChange', 'Three month change'], ['yoyChange', 'YoY change']] as const) {
    const p = percent(clean(values[field]), name);
    if (typeof p === 'string') problems.push(p); else if (p !== undefined) data[field] = p;
  }
  for (const [field, name] of [['bidLow', 'Top of page bid (low range)'], ['bidHigh', 'Top of page bid (high range)']] as const) {
    const m = money(clean(values[field]), name);
    if (typeof m === 'string') problems.push(m); else if (m !== undefined) data[field] = m;
  }
  if (data.bidLow !== undefined && data.bidHigh !== undefined && data.bidLow > data.bidHigh) problems.push('Top of page bid: the low range is above the high range');
  const cur = clean(values.currency).toUpperCase();
  if (!EMPTY.test(cur)) {
    if (/^[A-Z]{3}$/.test(cur)) data.currency = cur;
    else problems.push(`Currency "${cur.slice(0, 10)}" is not a three-letter code like USD or INR`);
  }
  const loc = clean(values.location) || clean(location);
  if (loc) {
    if (loc.length > 100 || /[<>]/.test(loc) || /^[=+\-@]/.test(loc)) problems.push('Location must be 100 characters or fewer, without < > or a leading = + - @');
    else data.location = loc;
  }
  return { line, keyword, data, problems };
}

const fmtPct = (n?: number) => (n === undefined ? undefined : `${n > 0 ? '+' : ''}${n}%`);

/** A one-line summary for the research history. */
export function plannerSummary(d: Omit<PlannerData, 'importedAt'>) {
  const parts = [
    d.volume !== undefined ? `${d.volume.toLocaleString('en')} avg. monthly searches` : d.volumeRange ? `${d.volumeRange} avg. monthly searches` : null,
    d.competition ? `${d.competition} competition${d.competitionIndex !== undefined ? ` (${d.competitionIndex})` : ''}` : d.competitionIndex !== undefined ? `competition index ${d.competitionIndex}` : null,
    d.yoyChange !== undefined ? `YoY ${fmtPct(d.yoyChange)}` : null,
    d.bidLow !== undefined || d.bidHigh !== undefined ? `bid ${d.bidLow ?? '?'}–${d.bidHigh ?? '?'}${d.currency ? ` ${d.currency}` : ''}` : null,
  ].filter(Boolean);
  return `Google Keyword Planner${d.location ? ` (${d.location})` : ''}: ${parts.join(' · ') || 'no metrics in the export'}`;
}

export const formatPercent = fmtPct;

/** Downloadable template. The first line says plainly that the figures are invented. */
export const EXAMPLE_CSV = [
  'EXAMPLE DATA - fictional figures for testing the import. Not real Keyword Planner research.',
  'Keyword,Currency,Avg. monthly searches,Three month change,YoY change,Competition,Competition (indexed value),Top of page bid (low range),Top of page bid (high range)',
  'youtube seo,USD,1000,10%,25%,Medium,55,0.80,2.40',
  'youtube seo agency,USD,500,5%,18%,Low,32,1.10,4.20',
  'youtube channel growth,USD,2400,15%,40%,High,78,0.35,1.60',
].join('\r\n') + '\r\n';

/* ---------- matching rows to the library ---------- */

export type PlannerPreviewRow = {
  line: number;
  keyword: string;
  status: 'new' | 'existing' | 'duplicate-in-file' | 'invalid';
  data: PlannerRow['data'];
  problems: string[];
  /** For "existing": the record it matches and the Keyword Planner metrics that would change. */
  existing?: { id: string; keyword: string; location?: string };
  changes?: string[];
};

const place = (s?: string) => (s ? normalizeKeyword(s) : '');

/**
 * The library record a Keyword Planner row belongs to: the same keyword
 * researched for the same place, else the same keyword with no place at all.
 * A record for a different place is never merged into — the row becomes a new
 * record — and an unknown place is never guessed.
 */
export function plannerMatch(lib: KeywordLibrary, keyword: string, location?: string) {
  const k = normalizeKeyword(keyword);
  const same = lib.keywords.filter((x) => normalizeKeyword(x.keyword) === k);
  const loc = place(location);
  const placeless = (x: Keyword) => !x.location && !x.country && !x.planner?.location;
  if (loc) return same.find((x) => [x.planner?.location, x.location, x.country].some((p) => place(p) === loc)) ?? same.find(placeless);
  return same.find(placeless);
}

export function classifyPlanner(rows: { line: number; values: Record<string, string> }[], location: string | undefined, lib: KeywordLibrary): PlannerPreviewRow[] {
  const seen = new Map<string, number>();
  return rows.map(({ line, values }) => {
    const r = plannerRow(line, values, location);
    const base: PlannerPreviewRow = { line: r.line, keyword: r.keyword, status: 'new', data: r.data, problems: r.problems };
    if (r.problems.length) return { ...base, status: 'invalid' };
    const key = `${normalizeKeyword(r.keyword)}::${place(r.data.location)}`;
    if (seen.has(key)) return { ...base, status: 'duplicate-in-file', problems: [`Same keyword as line ${seen.get(key)}`] };
    seen.set(key, r.line);
    const match = plannerMatch(lib, r.keyword, r.data.location);
    if (!match) return base;
    const old = match.planner ?? ({} as Partial<PlannerData>);
    const changes = (Object.keys(r.data) as (keyof PlannerRow['data'])[]).filter((f) => r.data[f] !== old[f]);
    return { ...base, status: 'existing', existing: { id: match.id, keyword: match.keyword, location: match.location ?? match.country }, changes };
  });
}

