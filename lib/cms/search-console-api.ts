import {
  parseRows, parseSites, type Dimension, type Period, type Property, type Row,
} from '@/lib/seo/search-console';
import { accessToken, endpoints, GoogleError } from './google-oauth';
import type { ProjectId } from './projects';

/**
 * The Search Console API, as documented by Google — two methods only:
 *   GET  {api}/sites                                         sites.list
 *   POST {api}/sites/{siteUrl}/searchAnalytics/query         searchanalytics.query
 * The host is fixed (lib/cms/google-oauth.ts endpoints()); the only part of
 * a URL that varies is the property, which is URL-encoded and has already
 * been checked against the account's own property list.
 *
 * Server only, never 'use server'.
 */

async function call(refresh: string, path: string, init: { method: 'GET' | 'POST'; body?: unknown }, retried = false): Promise<unknown> {
  const token = await accessToken(refresh, retried);
  let res: Response;
  try {
    res = await fetch(`${endpoints().api}${path}`, {
      method: init.method,
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/json', ...(init.body !== undefined && { 'Content-Type': 'application/json' }) },
      body: init.body === undefined ? undefined : JSON.stringify(init.body),
      cache: 'no-store',
      redirect: 'error',
      signal: AbortSignal.timeout(20_000),
    });
  } catch {
    throw new GoogleError('Search Console could not be reached. Try again in a moment.', 'temporary');
  }
  // An access token can lapse early (revoked session, clock skew): refresh once, then give up.
  if (res.status === 401 && !retried) return call(refresh, path, init, true);
  if (res.status === 401) throw new GoogleError('The Google authorization has expired or was revoked. Connect Google Search Console again.', 'revoked', 401);
  if (res.status === 403) throw new GoogleError('This Google account does not have permission to read that Search Console property. Ask an owner of the property to add the account in Search Console → Settings → Users and permissions.', 'permission', 403);
  if (res.status === 404) throw new GoogleError('Search Console does not have that property for this Google account.', 'not-found', 404);
  if (res.status === 429) throw new GoogleError('Search Console is limiting requests right now (quota). Try again in a few minutes.', 'rate-limit', 429);
  if (res.status >= 500) throw new GoogleError('Search Console had a temporary problem. Try again in a moment.', 'temporary', res.status);
  if (!res.ok) throw new GoogleError(`Search Console refused the request (${res.status}).`, 'temporary', res.status);
  try {
    return await res.json();
  } catch {
    throw new GoogleError('Search Console returned a response the CMS could not read.', 'invalid-response', res.status);
  }
}

export async function listSites(refresh: string): Promise<Property[]> {
  const sites = parseSites(await call(refresh, '/sites', { method: 'GET' }));
  if (!sites) throw new GoogleError('Search Console returned a property list the CMS could not read.', 'invalid-response');
  return sites.sort((a, b) => a.siteUrl.localeCompare(b.siteUrl));
}

/** One searchAnalytics.query request body. Final data only, web search only. */
export function queryBody(period: Pick<Period, 'start' | 'end'>, dimensions: Dimension[], rowLimit: number) {
  return { startDate: period.start, endDate: period.end, dimensions, type: 'web', dataState: 'final', rowLimit, startRow: 0 };
}

export async function analytics(refresh: string, siteUrl: string, period: Pick<Period, 'start' | 'end'>, dimensions: Dimension[], rowLimit: number): Promise<Row[]> {
  const body = await call(refresh, `/sites/${encodeURIComponent(siteUrl)}/searchAnalytics/query`, { method: 'POST', body: queryBody(period, dimensions, rowLimit) });
  const rows = parseRows(body, dimensions.length, rowLimit);
  if (!rows) throw new GoogleError('Search Console returned performance data the CMS could not read.', 'invalid-response');
  return rows;
}

/** Every request a sync makes, in one list — at most this many per sync. */
export const SYNC_REQUESTS: { name: string; dimensions: Dimension[]; rowLimit: number; previous?: boolean }[] = [
  { name: 'totals', dimensions: [], rowLimit: 1 },
  { name: 'previousTotals', dimensions: [], rowLimit: 1, previous: true },
  { name: 'queries', dimensions: ['query'], rowLimit: 1000 },
  { name: 'pages', dimensions: ['page'], rowLimit: 500 },
  { name: 'queryPages', dimensions: ['query', 'page'], rowLimit: 5000 },
  { name: 'dates', dimensions: ['date'], rowLimit: 500 },
  { name: 'countries', dimensions: ['country'], rowLimit: 50 },
  { name: 'devices', dimensions: ['device'], rowLimit: 10 },
  // Search appearance cannot be combined with other dimensions, so it is its own request.
  { name: 'appearances', dimensions: ['searchAppearance'], rowLimit: 50 },
];

/** Runs the sync's requests, three at a time. `previous` is null when Search Console no longer holds that period. */
export async function fetchRaw(refresh: string, siteUrl: string, period: Period, previous: Period | null): Promise<Record<string, Row[]>> {
  const out: Record<string, Row[]> = {};
  const jobs = SYNC_REQUESTS.filter((r) => !r.previous || previous);
  for (let i = 0; i < jobs.length; i += 3) {
    const batch = jobs.slice(i, i + 3);
    const results = await Promise.all(batch.map((j) => analytics(refresh, siteUrl, j.previous ? previous! : period, j.dimensions, j.rowLimit)));
    batch.forEach((j, n) => { out[j.name] = results[n]; });
  }
  if (!previous) out.previousTotals = [];
  return out;
}

/* ---------- server memory cache ---------- */

/**
 * Finished reports, per project, property and period, for an hour — so
 * reopening the dashboard does not call Google again. Memory only: a new
 * server instance starts empty and the dashboard asks for a sync.
 */
const CACHE_MS = 60 * 60_000;
const MIN_SYNC_MS = 60_000;
const cache = new Map<string, { at: number; value: unknown }>();
const lastSync = new Map<string, number>();

export const cacheKey = (project: ProjectId, siteUrl: string, period: Pick<Period, 'start' | 'end'>) => `${project}\u0000${siteUrl}\u0000${period.start}\u0000${period.end}`;

export function cached<T>(key: string): T | null {
  const hit = cache.get(key);
  if (!hit) return null;
  if (Date.now() - hit.at > CACHE_MS) { cache.delete(key); return null; }
  return hit.value as T;
}
export function store(key: string, value: unknown) {
  if (cache.size > 200) cache.delete(cache.keys().next().value!);
  cache.set(key, { at: Date.now(), value });
}

/**
 * Sync now reaches Google at most once a minute per project and property
 * after a successful sync; a faster repeat is served from the cache. A
 * failed sync does not count, so it can be retried.
 */
export function syncAllowed(project: ProjectId, siteUrl: string) {
  return Date.now() - (lastSync.get(`${project}\u0000${siteUrl}`) ?? 0) >= MIN_SYNC_MS;
}
export const markSynced = (project: ProjectId, siteUrl: string) => lastSync.set(`${project}\u0000${siteUrl}`, Date.now());

/** Drops everything cached for a project (on disconnect or a property change). */
export function forgetProject(project: ProjectId) {
  for (const k of [...cache.keys()]) if (k.startsWith(`${project}\u0000`)) cache.delete(k);
  for (const k of [...lastSync.keys()]) if (k.startsWith(`${project}\u0000`)) lastSync.delete(k);
}
