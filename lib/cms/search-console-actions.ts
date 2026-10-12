'use server';

import { getSession } from '@/lib/admin/session';
import { keywordProblems, mergeResearch, normalizeKeyword } from '@/lib/seo/keywords';
import {
  buildReport, canRead, isDay, PERMISSIONS, previousPeriod, propertyMatches, resolvePeriod, type Report,
} from '@/lib/seo/search-console';
import {
  beginFlow, deleteConnection, GoogleError, oauthConfig, readConnection, revoke, writeConnection, type Connection,
} from './google-oauth';
import { authorizeProject } from './project-access';
import type { Project } from './projects';
import { cacheKey, cached, fetchRaw, forgetProject, listSites, markSynced, store as remember, syncAllowed } from './search-console-api';
import { loadLibrary, projectContent } from './seo-data';
import { newId, now, withLibrary, type SeoResult } from './seo-write';

/**
 * Google Search Console, for a project that has it (Vioniche only).
 *
 * Every action: the session, then the project ID against the server-side
 * list and its searchConsole feature (Born21 is refused), then that project's
 * own connection cookie. Tokens never leave the server; results carry only
 * what the dashboard shows. Nothing here writes keyword data except
 * addSearchConsoleQueries, which the admin triggers explicitly.
 */

type Fail = { ok: false; message: string; reconnect?: boolean };

async function gate(projectId: unknown): Promise<{ ok: true; project: Project; conn: Connection | null } | Fail> {
  const access = await authorizeProject(projectId, 'searchConsole', { needStore: false });
  if (!access.ok) return access;
  return { ok: true, project: access.project, conn: await readConnection(access.project.id) };
}

/** Records the outcome on the connection, so the panel can show the last error. */
async function fail(conn: Connection, e: unknown): Promise<Fail> {
  const message = e instanceof GoogleError ? e.message : 'Search Console could not be read. Try again in a moment.';
  await writeConnection({ ...conn, lastError: { at: now(), message } }).catch(() => {});
  return { ok: false, message, reconnect: e instanceof GoogleError && e.kind === 'revoked' };
}

/** Starts Google's consent screen. Returns the URL to open; it is built here, never taken from the browser. */
export async function connectSearchConsole(projectId: unknown): Promise<{ ok: true; url: string } | Fail> {
  const g = await gate(projectId);
  if (!g.ok) return g;
  const config = oauthConfig();
  if ('problem' in config) return { ok: false, message: config.problem };
  const session = await getSession();
  const url = session && (await beginFlow(g.project.id, session.userId, config));
  if (!url) return { ok: false, message: 'Could not start the Google connection. Sign in again and retry.' };
  return { ok: true, url };
}

export type PropertyChoice = { siteUrl: string; permission: string; matchesProject: boolean; usable: boolean; reason?: string };

/** The Search Console properties the connected Google account can see, marked by whether they are this project's. */
export async function searchConsoleProperties(projectId: unknown): Promise<{ ok: true; properties: PropertyChoice[]; selected?: string } | Fail> {
  const g = await gate(projectId);
  if (!g.ok) return g;
  if (!g.conn) return { ok: false, message: 'Google Search Console is not connected.' };
  const hosts = g.project.searchConsole?.hosts ?? [];
  try {
    const sites = await listSites(g.conn.refreshToken);
    const properties = sites.map((s): PropertyChoice => {
      const matchesProject = propertyMatches(s.siteUrl, hosts);
      const readable = canRead(s);
      return {
        siteUrl: s.siteUrl, permission: PERMISSIONS[s.permissionLevel] ?? s.permissionLevel, matchesProject, usable: matchesProject && readable,
        ...(!matchesProject ? { reason: `Not a ${g.project.name} property` } : !readable ? { reason: 'This account is not verified for it' } : {}),
      };
    });
    if (g.conn.lastError) await writeConnection({ ...g.conn, lastError: undefined });
    return { ok: true, properties, ...(g.conn.property && { selected: g.conn.property }) };
  } catch (e) {
    return fail(g.conn, e);
  }
}

/**
 * Chooses the project's property. Accepted only if Google lists it for this
 * account right now, with read access, and it is on the project's own site.
 */
export async function selectSearchConsoleProperty(projectId: unknown, siteUrl: unknown): Promise<{ ok: true; message: string; property: string } | Fail> {
  const g = await gate(projectId);
  if (!g.ok) return g;
  if (!g.conn) return { ok: false, message: 'Google Search Console is not connected.' };
  if (typeof siteUrl !== 'string' || siteUrl.length > 300) return { ok: false, message: 'Choose a property from the list.' };
  try {
    const site = (await listSites(g.conn.refreshToken)).find((s) => s.siteUrl === siteUrl);
    if (!site) return { ok: false, message: 'That property is not available to the connected Google account. Refresh the list and choose again.' };
    if (!propertyMatches(site.siteUrl, g.project.searchConsole?.hosts ?? [])) return { ok: false, message: `That property is not ${g.project.name}'s website. Choose a ${g.project.name} property.` };
    if (!canRead(site)) return { ok: false, message: 'The connected Google account is not verified for that property, so its data cannot be read. Ask a property owner to add the account in Search Console.' };
    if (site.siteUrl !== g.conn.property) forgetProject(g.project.id);
    await writeConnection({ ...g.conn, property: site.siteUrl, lastError: undefined });
    return { ok: true, message: `${g.project.name} is now using ${site.siteUrl}.`, property: site.siteUrl };
  } catch (e) {
    return fail(g.conn, e);
  }
}

/**
 * Sync now: reads the performance data for the period (at most nine
 * Search Console requests), builds the report, keeps it in server memory.
 * A repeat within a minute is answered from that cache.
 */
export async function syncSearchConsole(projectId: unknown, input: unknown): Promise<{ ok: true; report: Report; message?: string } | Fail> {
  const g = await gate(projectId);
  if (!g.ok) return g;
  if (!g.conn) return { ok: false, message: 'Google Search Console is not connected.' };
  if (!g.conn.property) return { ok: false, message: `Choose ${g.project.name}'s Search Console property first.` };
  const i = (input ?? {}) as { preset?: unknown; start?: unknown; end?: unknown };
  const period = resolvePeriod({ preset: i.preset, start: i.start, end: i.end });
  if ('error' in period) return { ok: false, message: period.error };
  const previous = previousPeriod(period);
  const key = cacheKey(g.project.id, g.conn.property, period);
  if (!syncAllowed(g.project.id, g.conn.property)) {
    const hit = cached<Report>(key);
    if (hit) return { ok: true, report: hit, message: 'Synced less than a minute ago — showing that result.' };
    return { ok: false, message: 'Synced less than a minute ago. Wait a moment, then sync again.' };
  }
  try {
    const raw = await fetchRaw(g.conn.refreshToken, g.conn.property, period, previous);
    const access = await authorizeProject(g.project.id, 'searchConsole', { needStore: false });
    const st = access.ok ? access.store : null;
    const [lib, content] = await Promise.all([st ? loadLibrary(st).catch(() => null) : null, projectContent(g.project, st).catch(() => ({ items: [] }))]);
    const report = buildReport(raw, {
      property: g.conn.property, period, previous, hosts: g.project.searchConsole?.hosts ?? [],
      keywords: lib?.data.keywords ?? [], clusters: lib?.data.clusters ?? [], items: content.items, syncedAt: now(),
    });
    remember(key, report);
    markSynced(g.project.id, g.conn.property);
    await writeConnection({ ...g.conn, lastSync: report.syncedAt, lastError: undefined });
    const empty = report.totals.impressions === 0 && report.queries.length === 0;
    return { ok: true, report, ...(empty && { message: 'Search Console has no performance data for this property in this period.' }) };
  } catch (e) {
    return fail(g.conn, e);
  }
}

/** Disconnects: revokes the grant at Google, removes the connection, forgets cached data. */
export async function disconnectSearchConsole(projectId: unknown): Promise<{ ok: true; message: string } | Fail> {
  const g = await gate(projectId);
  if (!g.ok) return g;
  if (g.conn) await revoke(g.conn.refreshToken);
  await deleteConnection(g.project.id);
  forgetProject(g.project.id);
  return { ok: true, message: `Google Search Console disconnected from ${g.project.name}. Access was revoked at Google.` };
}

/**
 * Adds chosen Search Console queries to the keyword library — only when the
 * admin selects them. New keywords: source "google-search-console", status
 * idea, no figures (impressions are not search volume). A query already in
 * the library is left exactly as it is.
 */
export async function addSearchConsoleQueries(projectId: unknown, queries: unknown, meta: unknown): Promise<SeoResult> {
  const g = await gate(projectId);
  if (!g.ok) return g;
  if (!g.conn?.property) return { ok: false, message: 'Google Search Console is not connected.' };
  const m = (meta ?? {}) as { start?: unknown; end?: unknown };
  if (!isDay(m.start) || !isDay(m.end) || m.start > m.end) return { ok: false, message: 'Sync again, then add the queries.' };
  if (!Array.isArray(queries) || queries.length < 1 || queries.length > 200) return { ok: false, message: 'Choose between 1 and 200 queries.' };
  const clean = [...new Map(queries.filter((q): q is string => typeof q === 'string' && q.length <= 120 && !/[\n\r\t<>]/.test(q))
    .map((q) => q.trim().replace(/\s+/g, ' ')).filter(Boolean).map((q) => [normalizeKeyword(q), q])).values()]
    .filter((q) => !keywordProblems({ keyword: q, type: 'secondary', source: 'google-search-console', status: 'idea' }).length);
  if (!clean.length) return { ok: false, message: 'None of those queries can be saved as keywords.' };
  const property = g.conn.property;
  return withLibrary(g.project.id, `add ${clean.length} Search Console quer${clean.length === 1 ? 'y' : 'ies'} (${property})`, (lib) => {
    const at = now();
    const event = { provider: 'google-search-console' as const, at, summary: `Seen in Google Search Console (${property}, ${m.start} – ${m.end}); added from the Search Console dashboard` };
    const have = new Set(lib.keywords.map((k) => normalizeKeyword(k.keyword)));
    let added = 0, skipped = 0;
    for (const q of clean) {
      if (have.has(normalizeKeyword(q))) { skipped++; continue; }
      lib.keywords.push(mergeResearch({ id: newId('kw'), keyword: q, type: 'secondary', status: 'idea', source: 'google-search-console', createdAt: at, updatedAt: at }, {}, event));
      added++;
    }
    if (!added) return { ok: false, message: 'Every chosen query is already in the keyword library. Nothing was changed.' };
    return { ok: true, message: `Added ${added} Search Console quer${added === 1 ? 'y' : 'ies'} to the keyword library as ideas${skipped ? ` (${skipped} already there, left unchanged)` : ''}. No figures were stored — impressions are not search volume.` };
  });
}
