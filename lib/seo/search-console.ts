/**
 * Google Search Console performance data: reporting periods, validation of
 * what the API returns, and the analysis the CMS shows.
 *
 * Terms are Search Console's own and are kept exact:
 * - clicks: clicks from Google Search results to the site;
 * - impressions: times a result from the site was shown — not search volume;
 * - CTR: clicks ÷ impressions;
 * - average position: the average topmost position of the site's results —
 *   lower is better, and it is not keyword difficulty.
 *
 * Search Console finalises data with a delay of about two to three days, so
 * every preset period ends three days ago and only final data is requested.
 * Some queries are anonymised by Google, so per-query rows do not add up to
 * the totals.
 *
 * Pure and browser-safe: no requests are made here.
 */
import { findCannibalisation, keywordUsage, type SeoItem } from './content';
import { normalizeKeyword, type Cluster, type Keyword } from './keywords';

/* ---------- periods ---------- */

export const PRESETS = { '7d': 'Last 7 days', '28d': 'Last 28 days', '3m': 'Last 3 months' } as const;
export type Preset = keyof typeof PRESETS;
const PRESET_DAYS: Record<Preset, number> = { '7d': 7, '28d': 28, '3m': 90 };

/** Days between the last day requested and today: the usual Search Console reporting delay. */
export const DATA_DELAY_DAYS = 3;
/** Search Console keeps about 16 months of performance data. */
export const HISTORY_DAYS = 486;

export type Period = { start: string; end: string; days: number; label: string };

const DATE = /^\d{4}-\d{2}-\d{2}$/;
const DAY = 86_400_000;
const toDate = (s: string) => new Date(`${s}T00:00:00Z`);
export const isoDay = (d: Date) => d.toISOString().slice(0, 10);
const addDays = (s: string, n: number) => isoDay(new Date(toDate(s).getTime() + n * DAY));
const span = (start: string, end: string) => Math.round((toDate(end).getTime() - toDate(start).getTime()) / DAY) + 1;

/** A real calendar date in YYYY-MM-DD form (2026-02-30 is not). */
export function isDay(s: unknown): s is string {
  if (typeof s !== 'string' || !DATE.test(s)) return false;
  const d = toDate(s);
  return !Number.isNaN(d.getTime()) && isoDay(d) === s;
}

/** The last day a preset period includes. */
export const latestFinalDay = (today: Date = new Date()) => addDays(isoDay(today), -DATA_DELAY_DAYS);

/**
 * The period for a preset, or a custom range checked in full: real dates,
 * start before end, nothing in the future, nothing older than Search Console
 * keeps. Returns the reason when it is not usable.
 */
export function resolvePeriod(input: { preset?: unknown; start?: unknown; end?: unknown }, today: Date = new Date()): Period | { error: string } {
  const todayIso = isoDay(today);
  if (input.preset !== 'custom') {
    const preset: Preset = typeof input.preset === 'string' && input.preset in PRESETS ? (input.preset as Preset) : '28d';
    const end = latestFinalDay(today);
    const start = addDays(end, -(PRESET_DAYS[preset] - 1));
    return { start, end, days: PRESET_DAYS[preset], label: PRESETS[preset] };
  }
  if (!isDay(input.start) || !isDay(input.end)) return { error: 'Enter the custom range as two valid dates (YYYY-MM-DD).' };
  const { start, end } = input as { start: string; end: string };
  if (start > end) return { error: 'The start date must be on or before the end date.' };
  if (end >= todayIso) return { error: 'The end date must be before today — Search Console has no data for today yet.' };
  if (start < addDays(todayIso, -HISTORY_DAYS)) return { error: 'Search Console keeps about 16 months of data. Choose a later start date.' };
  return { start, end, days: span(start, end), label: 'Custom range' };
}

/** The period of the same length immediately before — or null if Search Console no longer has it. */
export function previousPeriod(p: Period, today: Date = new Date()): Period | null {
  const end = addDays(p.start, -1);
  const start = addDays(end, -(p.days - 1));
  if (start < addDays(isoDay(today), -HISTORY_DAYS)) return null;
  return { start, end, days: p.days, label: 'Previous period' };
}

/** True if the period reaches into the days Search Console may still be finalising. */
export const mayBeIncomplete = (p: Period, today: Date = new Date()) => p.end > latestFinalDay(today);

/* ---------- API rows ---------- */

export const DIMENSIONS = ['query', 'page', 'date', 'country', 'device', 'searchAppearance'] as const;
export type Dimension = (typeof DIMENSIONS)[number];

export type Metrics = { clicks: number; impressions: number; ctr: number; position: number };
export type Row = Metrics & { keys: string[] };

const finite = (v: unknown, min: number, max: number) => typeof v === 'number' && Number.isFinite(v) && v >= min && v <= max;

/**
 * Rows from a searchAnalytics.query response, each checked: the expected
 * number of keys as short strings, and metrics in range. Returns null if the
 * response is not the shape the API documents — it is never half-used.
 */
export function parseRows(body: unknown, dimensions: number, max = 25_000): Row[] | null {
  if (!body || typeof body !== 'object') return null;
  const rows = (body as { rows?: unknown }).rows;
  if (rows === undefined) return [];
  if (!Array.isArray(rows) || rows.length > max) return null;
  const out: Row[] = [];
  for (const r of rows as Record<string, unknown>[]) {
    if (!r || typeof r !== 'object') return null;
    const keys = r.keys ?? [];
    if (!Array.isArray(keys) || keys.length !== dimensions || keys.some((k) => typeof k !== 'string' || k.length > 2048)) return null;
    if (!finite(r.clicks, 0, 1e12) || !finite(r.impressions, 0, 1e12) || !finite(r.ctr, 0, 1) || !finite(r.position, 0, 1e4)) return null;
    out.push({ keys: keys as string[], clicks: r.clicks as number, impressions: r.impressions as number, ctr: r.ctr as number, position: r.position as number });
  }
  return out;
}

/** Totals from a no-dimension query: one row, or zeros when Search Console has nothing for the period. */
export function totalsOf(rows: Row[]): Metrics {
  if (!rows.length) return { clicks: 0, impressions: 0, ctr: 0, position: 0 };
  const { clicks, impressions, ctr, position } = rows[0];
  return { clicks, impressions, ctr, position };
}

/* ---------- comparison ---------- */

export type Change = { current: number; previous: number; change: number; percent: number | null };

const pct = (cur: number, prev: number) => (prev === 0 ? null : ((cur - prev) / prev) * 100);

export type Comparison = {
  clicks: Change;
  impressions: Change;
  /** CTR in percent; `points` is the percentage-point change, `percent` the relative change. */
  ctr: { current: number; previous: number; points: number; percent: number | null };
  /** `improvement` > 0 means the average position number went down — a better ranking. */
  position: { current: number; previous: number; improvement: number; available: boolean };
};

export function compare(cur: Metrics, prev: Metrics): Comparison {
  const ch = (a: number, b: number): Change => ({ current: a, previous: b, change: a - b, percent: pct(a, b) });
  return {
    clicks: ch(cur.clicks, prev.clicks),
    impressions: ch(cur.impressions, prev.impressions),
    ctr: { current: cur.ctr * 100, previous: prev.ctr * 100, points: (cur.ctr - prev.ctr) * 100, percent: pct(cur.ctr, prev.ctr) },
    // With no impressions there is no position to compare.
    position: { current: cur.position, previous: prev.position, improvement: prev.position - cur.position, available: cur.impressions > 0 && prev.impressions > 0 },
  };
}

/** "Improved by 4.4 positions (14.2 → 9.8)" — lower is better. */
export function describePosition(p: Comparison['position']): string {
  if (!p.available) return 'Not enough data in both periods to compare average position.';
  const d = Math.abs(p.improvement);
  const arrow = `${p.previous.toFixed(1)} → ${p.current.toFixed(1)}`;
  if (d < 0.05) return `No change (${arrow})`;
  return p.improvement > 0 ? `Improved by ${d.toFixed(1)} position${d === 1 ? '' : 's'} (${arrow})` : `Declined by ${d.toFixed(1)} position${d === 1 ? '' : 's'} (${arrow})`;
}

/* ---------- query and page tables ---------- */

export type QueryRow = Metrics & { query: string };
export type PageRow = Metrics & { page: string };

export const queryRows = (rows: Row[]): QueryRow[] => rows.map(({ keys, ...m }) => ({ query: keys[0], ...m }));
export const pageRows = (rows: Row[]): PageRow[] => rows.map(({ keys, ...m }) => ({ page: keys[0], ...m }));

/* ---------- opportunities (not guarantees) ---------- */

export type Opportunities = {
  /** Average position 4–10: on page one, below the top three. */
  positions4to10: QueryRow[];
  /** Average position 11–20: usually page two. */
  positions11to20: QueryRow[];
  /** Many impressions, CTR below half the site's CTR for the period. */
  lowCtr: QueryRow[];
  lowCtrRule: { minImpressions: number; maxCtr: number };
};

export function opportunities(queries: QueryRow[], siteCtr: number, limit = 25): Opportunities {
  const byImpr = [...queries].sort((a, b) => b.impressions - a.impressions);
  const sortedImpr = queries.map((q) => q.impressions).sort((a, b) => a - b);
  const p75 = sortedImpr.length ? sortedImpr[Math.floor(sortedImpr.length * 0.75)] : 0;
  const minImpressions = Math.max(100, p75);
  const maxCtr = siteCtr / 2;
  return {
    positions4to10: byImpr.filter((q) => q.position >= 4 && q.position <= 10).slice(0, limit),
    positions11to20: byImpr.filter((q) => q.position > 10 && q.position <= 20).slice(0, limit),
    lowCtr: siteCtr > 0 ? byImpr.filter((q) => q.impressions >= minImpressions && q.ctr < maxCtr).slice(0, limit) : [],
    lowCtrRule: { minImpressions, maxCtr },
  };
}

/* ---------- query → page ---------- */

export type QueryPages = {
  query: string;
  impressions: number;
  clicks: number;
  pages: (Metrics & { page: string })[];
  /** The page with the most impressions (visibility) and the one with the most clicks. */
  topVisibility: string;
  topClicks: string | null;
  /** More than one page with a meaningful share of this query's impressions. */
  multiplePages: boolean;
  /** Visibility and clicks go to different pages. */
  clickMismatch: boolean;
};

/**
 * Groups query+page rows by query. A query counts as reaching multiple
 * pages when at least two pages each have 10 or more impressions and 10% or
 * more of the query's impressions — a signal to review, not proof.
 */
export function queryPages(rows: Row[], limit = 200): QueryPages[] {
  const by = new Map<string, (Metrics & { page: string })[]>();
  for (const r of rows) {
    const [query, page] = r.keys;
    const list = by.get(query) ?? [];
    list.push({ page, clicks: r.clicks, impressions: r.impressions, ctr: r.ctr, position: r.position });
    by.set(query, list);
  }
  const out: QueryPages[] = [];
  for (const [query, list] of by) {
    const pages = list.sort((a, b) => b.impressions - a.impressions || b.clicks - a.clicks);
    const impressions = pages.reduce((s, p) => s + p.impressions, 0);
    const clicks = pages.reduce((s, p) => s + p.clicks, 0);
    const topClick = [...pages].sort((a, b) => b.clicks - a.clicks)[0];
    const meaningful = pages.filter((p) => p.impressions >= 10 && p.impressions >= impressions * 0.1);
    out.push({
      query, impressions, clicks, pages,
      topVisibility: pages[0].page,
      topClicks: topClick && topClick.clicks > 0 ? topClick.page : null,
      multiplePages: meaningful.length >= 2,
      clickMismatch: Boolean(topClick && topClick.clicks > 0 && topClick.page !== pages[0].page),
    });
  }
  return out.sort((a, b) => b.impressions - a.impressions).slice(0, limit);
}

export const MULTI_PAGE_NOTE = 'Search Console shows this query receiving visibility across multiple pages. Review for possible cannibalization.';

/* ---------- keyword library ---------- */

export type LibraryMatch = { id: string; keyword: string; cluster?: string; clusterName?: string; type: Keyword['type'] };

/** Search Console queries that are already keywords in the library, by the library's own normalisation. */
export function matchLibrary(queries: string[], keywords: Keyword[], clusters: Cluster[] = []): Record<string, LibraryMatch> {
  const index = new Map<string, Keyword>();
  for (const k of keywords) if (!index.has(normalizeKeyword(k.keyword))) index.set(normalizeKeyword(k.keyword), k);
  const out: Record<string, LibraryMatch> = {};
  for (const q of queries) {
    const k = index.get(normalizeKeyword(q));
    const cl = k?.cluster ? clusters.find((c) => c.id === k.cluster) : undefined;
    if (k) out[q] = { id: k.id, keyword: k.keyword, type: k.type, ...(k.cluster && { cluster: k.cluster }), ...(cl && { clusterName: cl.name }) };
  }
  return out;
}

/* ---------- properties ---------- */

export type Property = { siteUrl: string; permissionLevel: string };
export const PERMISSIONS: Record<string, string> = {
  siteOwner: 'Owner', siteFullUser: 'Full user', siteRestrictedUser: 'Restricted user', siteUnverifiedUser: 'Unverified — no data access',
};

/** The sites list from sites.list, checked; null if the response is not that shape. */
export function parseSites(body: unknown): Property[] | null {
  if (!body || typeof body !== 'object') return null;
  const list = (body as { siteEntry?: unknown }).siteEntry;
  if (list === undefined) return [];
  if (!Array.isArray(list) || list.length > 1000) return null;
  const out: Property[] = [];
  for (const s of list as Record<string, unknown>[]) {
    if (!s || typeof s.siteUrl !== 'string' || s.siteUrl.length > 300 || typeof s.permissionLevel !== 'string') return null;
    out.push({ siteUrl: s.siteUrl, permissionLevel: s.permissionLevel });
  }
  return out;
}

/** The host a property covers: sc-domain:example.com, or a URL-prefix property's host. */
export function propertyHost(siteUrl: string): string | null {
  if (siteUrl.startsWith('sc-domain:')) {
    const h = siteUrl.slice('sc-domain:'.length).toLowerCase();
    return /^[a-z0-9.-]+$/.test(h) ? h : null;
  }
  try {
    const u = new URL(siteUrl);
    return u.protocol === 'https:' || u.protocol === 'http:' ? u.hostname.toLowerCase() : null;
  } catch {
    return null;
  }
}

/** Whether a property belongs to a project's site (by host; a domain property covers its www host too). */
export function propertyMatches(siteUrl: string, hosts: string[]): boolean {
  const h = propertyHost(siteUrl);
  if (!h) return false;
  const set = hosts.map((x) => x.toLowerCase());
  if (siteUrl.startsWith('sc-domain:')) return set.some((x) => x === h || x === `www.${h}`);
  return set.includes(h);
}

/** Data can be read for a property only with a verified permission. */
export const canRead = (p: Property) => p.permissionLevel !== 'siteUnverifiedUser' && p.permissionLevel in PERMISSIONS;

/** A page URL as a path when it is on the project's site; otherwise the URL itself. */
export function pagePath(url: string, hosts: string[]): string {
  try {
    const u = new URL(url);
    return hosts.includes(u.hostname.toLowerCase()) ? `${u.pathname}${u.search}` || '/' : url;
  } catch {
    return url;
  }
}

/* ---------- the report ---------- */

export type KeyRow = Metrics & { key: string };
export type Assignment = { name: string; path: string; role: 'primary' | 'secondary' | 'related' };

export type ReportQuery = QueryRow & { library?: LibraryMatch };
export type ReportQueryPages = Omit<QueryPages, 'pages' | 'topVisibility' | 'topClicks'> & {
  pages: (Metrics & { path: string })[];
  topVisibility: string;
  topClicks: string | null;
  library?: LibraryMatch;
  /** Where the CMS has this keyword assigned (pages.json / article front matter). */
  assigned: Assignment[];
  /** The keyword is assigned as primary to a page Search Console does not show most for it. */
  assignmentMismatch: boolean;
  /** The CMS's own cannibalisation check also flags this keyword (two pages share it as primary). */
  cmsCannibalisation: boolean;
};

export type Report = {
  property: string;
  period: Period;
  previous: Period | null;
  mayBeIncomplete: boolean;
  syncedAt: string;
  totals: Metrics;
  previousTotals: Metrics | null;
  comparison: Comparison | null;
  queries: ReportQuery[];
  pages: (PageRow & { path: string; assigned: Assignment[] })[];
  dates: KeyRow[];
  countries: KeyRow[];
  devices: KeyRow[];
  appearances: KeyRow[];
  opportunities: Opportunities;
  queryPages: ReportQueryPages[];
  /** Queries reaching several pages — supporting evidence for possible cannibalisation, never proof. */
  multiPage: ReportQueryPages[];
  /** Queries with some visibility that are not in the keyword library yet. Nothing is added automatically. */
  discoveries: QueryRow[];
  counts: { queries: number; pages: number; queryPageRows: number; libraryMatches: number };
};

const keyRows = (rows: Row[]): KeyRow[] => rows.map(({ keys, ...m }) => ({ key: keys[0], ...m }));

/**
 * Builds what the dashboard shows from one sync's rows, the project's keyword
 * library and its pages. Reads only — it changes no keyword, page or file.
 */
export function buildReport(raw: Record<string, Row[]>, ctx: {
  property: string; period: Period; previous: Period | null; hosts: string[]; keywords: Keyword[]; clusters: Cluster[]; items: SeoItem[]; syncedAt: string; today?: Date;
}): Report {
  const totals = totalsOf(raw.totals ?? []);
  const previousTotals = ctx.previous ? totalsOf(raw.previousTotals ?? []) : null;
  const allQueries = queryRows(raw.queries ?? []);
  const library = matchLibrary(allQueries.map((q) => q.query), ctx.keywords, ctx.clusters);
  const usage = keywordUsage(ctx.items);
  const cannibal = new Set(findCannibalisation(ctx.items).map((c) => normalizeKeyword(c.keyword)));
  const path = (u: string) => pagePath(u, ctx.hosts);
  const assignedFor = (q: string): Assignment[] => (usage.get(normalizeKeyword(q)) ?? []).map((u) => ({ name: u.item.name, path: u.item.path, role: u.role }));
  const byPath = new Map<string, Assignment[]>();
  for (const [, list] of usage) for (const u of list) {
    const a = byPath.get(u.item.path) ?? [];
    if (u.role === 'primary' && u.item.seo.primaryKeyword) a.push({ name: u.item.seo.primaryKeyword, path: u.item.path, role: 'primary' });
    byPath.set(u.item.path, a);
  }
  const qp = queryPages(raw.queryPages ?? [], 300).map((q): ReportQueryPages => {
    const assigned = assignedFor(q.query);
    const primary = assigned.filter((a) => a.role === 'primary').map((a) => a.path);
    const top = path(q.topVisibility);
    return {
      ...q,
      pages: q.pages.slice(0, 10).map(({ page, ...m }) => ({ path: path(page), ...m })),
      topVisibility: top,
      topClicks: q.topClicks ? path(q.topClicks) : null,
      ...(library[q.query] && { library: library[q.query] }),
      assigned,
      assignmentMismatch: primary.length > 0 && !primary.includes(top),
      cmsCannibalisation: cannibal.has(normalizeKeyword(q.query)),
    };
  });
  const sorted = [...allQueries].sort((a, b) => b.clicks - a.clicks || b.impressions - a.impressions);
  return {
    property: ctx.property,
    period: ctx.period,
    previous: ctx.previous,
    mayBeIncomplete: mayBeIncomplete(ctx.period, ctx.today),
    syncedAt: ctx.syncedAt,
    totals,
    previousTotals,
    comparison: previousTotals ? compare(totals, previousTotals) : null,
    queries: sorted.slice(0, 250).map((q) => ({ ...q, ...(library[q.query] && { library: library[q.query] }) })),
    pages: pageRows(raw.pages ?? []).sort((a, b) => b.clicks - a.clicks || b.impressions - a.impressions).slice(0, 100)
      .map((p) => ({ ...p, path: path(p.page), assigned: byPath.get(path(p.page)) ?? [] })),
    dates: keyRows(raw.dates ?? []).sort((a, b) => a.key.localeCompare(b.key)),
    countries: keyRows(raw.countries ?? []).sort((a, b) => b.clicks - a.clicks || b.impressions - a.impressions),
    devices: keyRows(raw.devices ?? []).sort((a, b) => b.clicks - a.clicks),
    appearances: keyRows(raw.appearances ?? []).sort((a, b) => b.clicks - a.clicks),
    opportunities: opportunities(allQueries, totals.ctr),
    queryPages: qp.slice(0, 100),
    multiPage: qp.filter((q) => q.multiplePages).slice(0, 50),
    discoveries: [...allQueries].filter((q) => !library[q.query] && q.impressions >= 10).sort((a, b) => b.impressions - a.impressions).slice(0, 50),
    counts: { queries: allQueries.length, pages: (raw.pages ?? []).length, queryPageRows: (raw.queryPages ?? []).length, libraryMatches: Object.keys(library).length },
  };
}
