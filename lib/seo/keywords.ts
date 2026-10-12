/**
 * The keyword library: what a keyword record is, and the rules it must meet.
 *
 * Keywords are researched outside the CMS (Google Keyword Planner, Search
 * Console, Ahrefs, Semrush…) and entered or imported here. The library is one
 * JSON file in the repository, content/seo/keywords.json, written by the CMS
 * through the same GitHub commit path as articles — there is no database.
 *
 * A keyword record says what was researched. Which page or article targets it,
 * and in what role, is recorded on that content item (its primaryKeyword,
 * secondaryKeywords and relatedKeywords), and matched back here by keyword
 * text. So deleting a record never breaks a page, and a page can name a
 * keyword before it has been researched.
 *
 * Every metric is optional: Keyword Planner does not always give one, and an
 * empty field is better than a guessed number.
 *
 * Pure and browser-safe: no server imports.
 */

export const KEYWORD_TYPES = ['primary', 'secondary', 'related'] as const;
export type KeywordType = (typeof KEYWORD_TYPES)[number];

/** The same four intents the blog model uses. */
export const INTENTS = ['informational', 'commercial', 'transactional', 'navigational'] as const;
export type Intent = (typeof INTENTS)[number];

export const SOURCES = {
  'google-keyword-planner': 'Google Keyword Planner',
  'google-search-console': 'Google Search Console',
  'google-trends': 'Google Trends',
  'google-autocomplete': 'Google Autocomplete',
  ahrefs: 'Ahrefs',
  semrush: 'Semrush',
  manual: 'Manual',
  other: 'Other',
} as const;
export type Source = keyof typeof SOURCES;

export const COMPETITION = ['low', 'medium', 'high'] as const;
export type Competition = (typeof COMPETITION)[number];

export const STATUSES = {
  idea: 'Idea',
  planned: 'Planned',
  targeted: 'Targeted',
  archived: 'Archived',
} as const;
export type Status = keyof typeof STATUSES;

export type Keyword = {
  id: string;
  keyword: string;
  /** The role it was researched for. Each page records its own role too. */
  type: KeywordType;
  intent?: Intent;
  country?: string;
  /** City, region or "New York, USA" — whatever the research was scoped to. */
  location?: string;
  /** Average monthly searches, when an exact figure is known. */
  volume?: number;
  /** When only a range is known, e.g. Keyword Planner's "1K – 10K". */
  volumeRange?: string;
  /** 0–100, as Ahrefs and Semrush report it. */
  difficulty?: number;
  cpc?: number;
  competition?: Competition;
  source: Source;
  status: Status;
  /** A cluster id. */
  cluster?: string;
  notes?: string;
  /**
   * Google Trends data, kept apart from the fields above so its origin is
   * never in doubt: a relative 0–100 interest index, not a volume.
   */
  trends?: TrendsData;
  /** Google Keyword Planner metrics from the Keyword Planner import, kept apart from the fields above. */
  planner?: PlannerData;
  /** What research was done on this keyword, newest first (at most 20). */
  history?: ResearchEvent[];
  createdAt: string;
  updatedAt: string;
};

/**
 * From a Google Trends export. Interest is Google's normalised 0–100 index,
 * relative to the peak among the terms compared in that one export — it is
 * not search volume and cannot be compared across exports.
 */
export type TrendsData = {
  /** '' = worldwide; otherwise ISO country code, optionally with region ("US-NY"). */
  geo: string;
  range: string;
  average: number;
  peak: number;
  latest: number;
  comparedWith: string[];
  importedAt: string;
};

/**
 * From a Google Keyword Planner "keyword ideas" export. Competition is
 * Google's advertiser competition (Low/Medium/High, index 0–100) — it is not
 * an SEO keyword-difficulty score. Bids are Google's top-of-page bid range in
 * the export's currency. Changes are percentages (+25 = up 25%).
 */
export type PlannerData = {
  volume?: number;
  /** When Keyword Planner only gives a range, e.g. "1K – 10K". */
  volumeRange?: string;
  competition?: Competition;
  competitionIndex?: number;
  threeMonthChange?: number;
  yoyChange?: number;
  bidLow?: number;
  bidHigh?: number;
  currency?: string;
  /** As given by the file or by the person importing; absent when unknown. */
  location?: string;
  importedAt: string;
};

export type ResearchEvent = { provider: Source; at: string; summary: string };

export type Cluster = {
  id: string;
  name: string;
  /** The keyword text the cluster is built around. */
  primaryKeyword?: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
};

export type KeywordLibrary = { version: 1; keywords: Keyword[]; clusters: Cluster[] };

export const emptyLibrary = (): KeywordLibrary => ({ version: 1, keywords: [], clusters: [] });

/** The library is one file; this keeps it well inside what GitHub's contents API returns. */
export const MAX_KEYWORDS = 2500;
export const MAX_CLUSTERS = 200;

/** Case, spacing and surrounding punctuation never make two keywords different. */
export const normalizeKeyword = (s: string) =>
  s.normalize('NFKC').toLowerCase().replace(/[\s ]+/g, ' ').replace(/^[\s"'“”‘’.,;:!?-]+|[\s"'“”‘’.,;:!?-]+$/g, '').trim();

/** The place a keyword was researched for: its location, or else its country. */
const normLoc = (k: Pick<Keyword, 'country' | 'location'>) => normalizeKeyword(k.location || k.country || '');

/**
 * The same keyword researched for the same place is a duplicate. The same
 * keyword for a different location is a different research record (Keyword
 * Planner reports per location), so both may exist.
 */
export const duplicateKey = (k: Pick<Keyword, 'keyword' | 'country' | 'location'>) => `${normalizeKeyword(k.keyword)}::${normLoc(k)}`;

const ID = /^[a-z0-9_-]{4,40}$/;

const isEnum = <T extends string>(list: readonly T[] | Record<T, unknown>, v: unknown): v is T =>
  typeof v === 'string' && (Array.isArray(list) ? list.includes(v as T) : Object.prototype.hasOwnProperty.call(list, v));

/** Everything a keyword record must satisfy, as readable messages. */
export function keywordProblems(k: Partial<Keyword>, clusters: Pick<Cluster, 'id'>[] = []): string[] {
  const out: string[] = [];
  const kw = typeof k.keyword === 'string' ? k.keyword.trim() : '';
  if (!kw) out.push('Keyword is required');
  else if (kw.length > 120) out.push('Keyword must be 120 characters or fewer');
  else if (/[\n\r\t<>]/.test(kw)) out.push('Keyword cannot contain line breaks, tabs or < >');
  // A spreadsheet would treat these as a formula (CSV formula injection).
  else if (/^[=+\-@]/.test(kw)) out.push('Keyword cannot start with =, +, - or @');
  if (!isEnum(KEYWORD_TYPES, k.type)) out.push(`Type must be one of: ${KEYWORD_TYPES.join(', ')}`);
  if (k.intent !== undefined && !isEnum(INTENTS, k.intent)) out.push(`Search intent must be one of: ${INTENTS.join(', ')}`);
  if (!isEnum(SOURCES, k.source)) out.push('Source is not one of the supported sources');
  if (!isEnum(STATUSES, k.status)) out.push('Status is not valid');
  if (k.competition !== undefined && !isEnum(COMPETITION, k.competition)) out.push('Competition must be low, medium or high');
  const num = (v: unknown, name: string, min: number, max: number, int = false) => {
    if (v === undefined) return;
    if (typeof v !== 'number' || !Number.isFinite(v) || v < min || v > max || (int && !Number.isInteger(v))) {
      out.push(`${name} must be ${int ? 'a whole number' : 'a number'} from ${min} to ${max}`);
    }
  };
  num(k.volume, 'Search volume', 0, 1_000_000_000, true);
  num(k.difficulty, 'Keyword difficulty', 0, 100);
  num(k.cpc, 'CPC', 0, 100_000);
  const text = (v: unknown, name: string, max: number) => {
    if (v === undefined) return;
    if (typeof v !== 'string' || v.length > max || /[<>]/.test(v)) out.push(`${name} must be text of ${max} characters or fewer, without < >`);
  };
  text(k.country, 'Country', 60);
  text(k.location, 'Location', 100);
  text(k.volumeRange, 'Volume range', 40);
  text(k.notes, 'Notes', 1000);
  if (k.cluster !== undefined && !clusters.some((c) => c.id === k.cluster)) out.push('Cluster does not exist');
  out.push(...providerProblems(k));
  if (k.id !== undefined && !ID.test(k.id)) out.push('Invalid id');
  return out;
}

const GEO = /^([A-Z]{2}(-[A-Z0-9]{1,3})?)?$/;
const okText = (v: unknown, max: number) => v === undefined || (typeof v === 'string' && v.length <= max && !/[<>]/.test(v));

/** The Trends block and history must be well-formed too; they arrive from imported files. */
function providerProblems(k: Partial<Keyword>): string[] {
  const out: string[] = [];
  const p = k.planner;
  if (p !== undefined) {
    const n = (v: unknown, min: number, max: number) => v === undefined || (typeof v === 'number' && Number.isFinite(v) && v >= min && v <= max);
    if (!p || typeof p !== 'object' || typeof p.importedAt !== 'string'
      || !n(p.volume, 0, 1e10) || !n(p.competitionIndex, 0, 100) || !n(p.threeMonthChange, -100, 1e6) || !n(p.yoyChange, -100, 1e6)
      || !n(p.bidLow, 0, 1e7) || !n(p.bidHigh, 0, 1e7)
      || (p.competition !== undefined && !(COMPETITION as readonly string[]).includes(p.competition))
      || (p.currency !== undefined && !/^[A-Z]{3}$/.test(p.currency))
      || !okText(p.volumeRange, 40) || !okText(p.location, 100)) {
      out.push('Keyword Planner data is not well-formed');
    }
  }
  const t = k.trends;
  if (t !== undefined) {
    if (!t || typeof t !== 'object' || !GEO.test(t.geo ?? 'x') || !okText(t.range, 40) || typeof t.importedAt !== 'string'
      || ![t.average, t.peak, t.latest].every((n) => typeof n === 'number' && n >= 0 && n <= 100)
      || !Array.isArray(t.comparedWith) || t.comparedWith.length > 5 || t.comparedWith.some((c) => !okText(c, 120))) {
      out.push('Google Trends data is not well-formed');
    }
  }
  if (k.history !== undefined && (!Array.isArray(k.history) || k.history.length > 20
    || k.history.some((h) => !h || !(h.provider in SOURCES) || typeof h.at !== 'string' || !okText(h.summary, 300)))) {
    out.push('Research history is not well-formed');
  }
  return out;
}

/**
 * Adds research data to a record without losing anything: the record's own
 * fields are untouched, new Trends data replaces the previous Trends data,
 * and the event goes to the top of the history.
 */
export function mergeResearch(k: Keyword, patch: { trends?: TrendsData; planner?: PlannerData }, event: ResearchEvent): Keyword {
  const next: Keyword = { ...k, updatedAt: event.at, history: [event, ...(k.history ?? [])].slice(0, 20) };
  if (patch.trends) next.trends = patch.trends;
  if (patch.planner) {
    // Only the metrics the new export provides replace earlier Keyword Planner
    // values; a metric missing from this export never erases an earlier one.
    const provided = Object.fromEntries(Object.entries(patch.planner).filter(([, v]) => v !== undefined)) as PlannerData;
    // A range and an exact volume describe the same thing; the newer one wins.
    const old = { ...(k.planner ?? {}) } as Partial<PlannerData>;
    if (provided.volume !== undefined) delete old.volumeRange;
    if (provided.volumeRange !== undefined) delete old.volume;
    next.planner = { ...old, ...provided };
  }
  return next;
}

export function clusterProblems(c: Partial<Cluster>): string[] {
  const out: string[] = [];
  const name = typeof c.name === 'string' ? c.name.trim() : '';
  if (!name) out.push('Cluster name is required');
  else if (name.length > 80 || /[<>]/.test(name)) out.push('Cluster name must be 80 characters or fewer, without < >');
  if (c.primaryKeyword !== undefined && (typeof c.primaryKeyword !== 'string' || c.primaryKeyword.length > 120)) out.push('Primary keyword must be 120 characters or fewer');
  if (c.description !== undefined && (typeof c.description !== 'string' || c.description.length > 500)) out.push('Description must be 500 characters or fewer');
  return out;
}

/** Checks a whole library file — used by the build and by every CMS write. */
export function libraryProblems(lib: unknown): string[] {
  const l = lib as Partial<KeywordLibrary> | null;
  if (!l || typeof l !== 'object' || l.version !== 1 || !Array.isArray(l.keywords) || !Array.isArray(l.clusters)) {
    return ['content/seo/keywords.json must be { "version": 1, "keywords": [], "clusters": [] }'];
  }
  const out: string[] = [];
  if (l.keywords.length > MAX_KEYWORDS) out.push(`At most ${MAX_KEYWORDS} keywords`);
  if (l.clusters.length > MAX_CLUSTERS) out.push(`At most ${MAX_CLUSTERS} clusters`);
  const ids = new Set<string>();
  for (const c of l.clusters) {
    clusterProblems(c).forEach((p) => out.push(`Cluster "${c?.name ?? '?'}": ${p}`));
    if (!ID.test(c?.id ?? '') || ids.has(c.id)) out.push(`Cluster "${c?.name ?? '?'}": missing or duplicate id`);
    ids.add(c?.id);
  }
  const seen = new Set<string>();
  for (const k of l.keywords) {
    keywordProblems(k, l.clusters).forEach((p) => out.push(`Keyword "${k?.keyword ?? '?'}": ${p}`));
    if (!k?.id || ids.has(k.id)) out.push(`Keyword "${k?.keyword ?? '?'}": missing or duplicate id`);
    ids.add(k?.id);
    const dup = typeof k?.keyword === 'string' ? duplicateKey(k) : '';
    if (dup && seen.has(dup)) out.push(`Keyword "${k.keyword}" appears twice for the same location`);
    seen.add(dup);
  }
  return out.slice(0, 20);
}

/* ---------- reading untrusted input (forms, CSV rows) into a clean record ---------- */

const str = (v: unknown, max: number) => (typeof v === 'string' ? v.replace(/[\u0000-\u001f\u007f]/g, ' ').trim().slice(0, max) : '');
const opt = (s: string) => (s ? s : undefined);

/** "1,234" → 1234; "$1.20" → 1.2; "" → undefined. Never guesses. */
export function parseNumber(v: unknown): number | undefined {
  if (typeof v === 'number') return Number.isFinite(v) ? v : undefined;
  const s = str(v, 40).replace(/[$€£₹¥,\s%]/g, '');
  if (!s || !/^-?\d+(\.\d+)?$/.test(s)) return undefined;
  return Number(s);
}

const INTENT_ALIASES: Record<string, Intent> = {
  informational: 'informational', info: 'informational', i: 'informational',
  commercial: 'commercial', c: 'commercial', investigation: 'commercial', 'commercial investigation': 'commercial',
  transactional: 'transactional', t: 'transactional', transaction: 'transactional',
  navigational: 'navigational', n: 'navigational', navigation: 'navigational',
};
/** Accepts "Commercial", Semrush's "C" or "C, I" (first one wins). */
export function parseIntent(v: unknown): Intent | undefined {
  const s = str(v, 60).toLowerCase().split(/[,/;]/)[0]?.trim() ?? '';
  return INTENT_ALIASES[s];
}

export function parseCompetition(v: unknown): Competition | undefined {
  const s = str(v, 20).toLowerCase();
  return (COMPETITION as readonly string[]).includes(s) ? (s as Competition) : undefined;
}

const SOURCE_ALIASES: Record<string, Source> = {
  'google keyword planner': 'google-keyword-planner', 'keyword planner': 'google-keyword-planner', gkp: 'google-keyword-planner',
  'google search console': 'google-search-console', 'search console': 'google-search-console', gsc: 'google-search-console',
  ahrefs: 'ahrefs', semrush: 'semrush', manual: 'manual', other: 'other',
};
export function parseSource(v: unknown): Source | undefined {
  const s = str(v, 60).toLowerCase();
  return (s in SOURCES ? (s as Source) : undefined) ?? SOURCE_ALIASES[s];
}

export type KeywordInput = Omit<Keyword, 'id' | 'createdAt' | 'updatedAt' | 'trends' | 'planner' | 'history'>;

/**
 * Untrusted fields (a form or a CSV row) → a candidate record. Unknown or
 * unparseable optional values are dropped, not guessed; keywordProblems()
 * then decides whether the result is valid.
 */
export function toKeywordInput(raw: Record<string, unknown>, defaults: Partial<KeywordInput> = {}): KeywordInput {
  const type = str(raw.type, 20).toLowerCase();
  const status = str(raw.status, 20).toLowerCase();
  const volumeRaw = str(raw.volume, 40);
  const volume = parseNumber(volumeRaw);
  const out: KeywordInput = {
    keyword: str(raw.keyword, 200).replace(/\s+/g, ' '),
    type: (KEYWORD_TYPES as readonly string[]).includes(type) ? (type as KeywordType) : defaults.type ?? 'secondary',
    intent: parseIntent(raw.intent) ?? defaults.intent,
    // Exports often use lower-case codes ("in"); a two-letter code is stored upper-case.
    country: opt(str(raw.country, 80).replace(/^[a-z]{2}$/i, (c) => c.toUpperCase())) ?? defaults.country,
    location: opt(str(raw.location, 120)) ?? defaults.location,
    volume: volume !== undefined && Number.isInteger(volume) && volume >= 0 ? volume : undefined,
    // Keyword Planner without an active campaign reports ranges like "1K – 10K".
    volumeRange: opt(str(raw.volumeRange, 40)) ?? (volume === undefined && /\d/.test(volumeRaw) ? volumeRaw.slice(0, 40) : undefined),
    difficulty: parseNumber(raw.difficulty),
    cpc: parseNumber(raw.cpc),
    competition: parseCompetition(raw.competition),
    source: parseSource(raw.source) ?? defaults.source ?? 'manual',
    status: status in STATUSES ? (status as Status) : defaults.status ?? 'idea',
    cluster: opt(str(raw.cluster, 40)) ?? defaults.cluster,
    notes: opt(str(raw.notes, 2000)),
  };
  // Drop undefined keys so stored JSON stays tidy.
  return Object.fromEntries(Object.entries(out).filter(([, v]) => v !== undefined)) as KeywordInput;
}
