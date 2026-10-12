'use server';

import { assertSession } from '@/lib/admin/session';
import {
  KEYWORD_TYPES, STATUSES, mergeResearch, normalizeKeyword, type Keyword, type KeywordLibrary, type KeywordType, type Status, type TrendsData,
} from '@/lib/seo/keywords';
import { PROVIDERS, settingsProblems, type Provider, type ResearchSettings } from '@/lib/seo/settings';
import { GEO, TRENDS_MAX_TERMS, TRENDS_RANGES, type TrendsRange } from '@/lib/seo/trends';
import { IDEA_LANGUAGES, IDEA_REGIONS, MAX_IDEAS, isLanguage, isRegion, parseIdeas, seedProblems, type Idea } from '@/lib/seo/ideas';
import { loadLibrary, loadSettings } from './seo-data';
import { authorizeProject } from './project-access';
import { failed, json, newId, now, withLibrary, type SeoResult } from './seo-write';
import { SEO_DATA_FILES } from './store';

/**
 * Research providers: the preferred provider, and saving Google Trends
 * research into the existing keyword library. Every action names its
 * project and checks the session and the project itself
 * (lib/cms/project-access.ts). No external service is called from here.
 */

/* ---------- settings ---------- */

export async function saveResearchSettings(project: unknown, raw: Partial<ResearchSettings>): Promise<SeoResult> {
  const access = await authorizeProject(project, 'keywords');
  if (!access.ok) return access;
  const { store } = access;
  try {
    const current = await loadSettings(store);
    const next: ResearchSettings = {
      version: 1,
      provider: (raw?.provider ?? current.data.provider) as Provider,
      trendsGeo: typeof raw?.trendsGeo === 'string' ? raw.trendsGeo : current.data.trendsGeo,
      updatedAt: now(),
    };
    const p = settingsProblems(next);
    if (p.length) return { ok: false, message: 'Not saved.', problems: p };
    const commit = await store.commit([{ path: SEO_DATA_FILES.settings, content: json(next) }],
      `Keywords: research provider set to ${PROVIDERS[next.provider].label}\n\nVia the Vioniche CMS (${access.project.name}).`);
    return { ok: true, message: `Research provider: ${PROVIDERS[next.provider].label} (${PROVIDERS[next.provider].mode}). Your keywords, clusters and assignments are unchanged.`, commit };
  } catch (e) {
    return failed(e);
  }
}

const cleanTerms = (list: unknown, max: number) =>
  (Array.isArray(list) ? list : []).map((t) => (typeof t === 'string' ? t.trim().replace(/\s+/g, ' ') : '')).filter(Boolean).slice(0, max + 1);

/* ---------- saving research into the library ---------- */

type SaveOptions = { type?: string; status?: string; cluster?: string };

function options(o: SaveOptions | undefined, lib: KeywordLibrary) {
  const type = (KEYWORD_TYPES as readonly string[]).includes(o?.type ?? '') ? (o!.type as KeywordType) : 'secondary';
  const status = (o?.status ?? '') in STATUSES ? (o!.status as Status) : 'idea';
  const cluster = o?.cluster && lib.clusters.some((c) => c.id === o.cluster) ? o.cluster : undefined;
  return { type, status, cluster };
}

/**
 * The library record a researched keyword belongs to: the same keyword for
 * the same country, else the same keyword with no place set. Null = new.
 */
function findRecord(lib: KeywordLibrary, keyword: string, country: string) {
  const k = normalizeKeyword(keyword);
  const same = lib.keywords.filter((x) => normalizeKeyword(x.keyword) === k);
  return same.find((x) => x.country?.toUpperCase() === country || x.location?.toUpperCase().endsWith(country))
    ?? same.find((x) => !x.country && !x.location) ?? null;
}

function upsert(lib: KeywordLibrary, keyword: string, country: string, source: Keyword['source'], o: ReturnType<typeof options>, patch: Parameters<typeof mergeResearch>[1], event: Parameters<typeof mergeResearch>[2], intent?: Keyword['intent']) {
  const existing = findRecord(lib, keyword, country);
  if (existing) {
    const i = lib.keywords.indexOf(existing);
    // Research adds provider data; the record's own fields — cluster, type, notes — are kept.
    lib.keywords[i] = mergeResearch({ ...existing, cluster: existing.cluster ?? o.cluster }, patch, event);
    return 'updated' as const;
  }
  const base: Keyword = {
    id: newId('kw'), keyword, type: o.type, source, status: o.status, createdAt: event.at, updatedAt: event.at,
    ...(country && { country }), ...(o.cluster && { cluster: o.cluster }), ...(intent && { intent }),
  };
  lib.keywords.push(mergeResearch(base, patch, event));
  return 'added' as const;
}

/** Saves Google Trends interest (from an imported Trends CSV) and, optionally, related or rising queries as keyword ideas. */
export async function saveTrendsResults(
  project: unknown,
  terms: unknown,
  meta: unknown,
  related: unknown,
  opts?: SaveOptions,
): Promise<SeoResult> {
  await assertSession();
  const m = meta as { geo?: unknown; range?: unknown; comparedWith?: unknown };
  const geo = typeof m?.geo === 'string' ? m.geo.toUpperCase() : '';
  const range = typeof m?.range === 'string' && m.range.length <= 40 ? m.range : '';
  if (!GEO.test(geo)) return { ok: false, message: 'The place must be worldwide or a code like IN or US-NY.' };
  if (!range) return { ok: false, message: 'Choose the time range the export covers.' };
  const comparedWith = cleanTerms(m?.comparedWith, TRENDS_MAX_TERMS);
  const scores = (Array.isArray(terms) ? terms : []).slice(0, TRENDS_MAX_TERMS + 1) as { keyword?: unknown; average?: unknown; peak?: unknown; latest?: unknown }[];
  const ideas = (Array.isArray(related) ? related : []).slice(0, 101) as { keyword?: unknown; note?: unknown }[];
  if (scores.length > TRENDS_MAX_TERMS || ideas.length > 100) return { ok: false, message: 'Too many rows.' };
  const pct = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) && v >= 0 && v <= 100 ? Math.round(v) : null);
  const word = (v: unknown) => (typeof v === 'string' && v.trim() && v.length <= 120 && !/[<>\n,]/.test(v) ? v.trim().replace(/\s+/g, ' ') : null);
  const cleanScores = scores.map((s) => ({ keyword: word(s.keyword), average: pct(s.average), peak: pct(s.peak), latest: pct(s.latest) }));
  if (cleanScores.some((s) => !s.keyword || s.average === null || s.peak === null || s.latest === null)) return { ok: false, message: 'Interest values must be Google Trends scores between 0 and 100.' };
  const cleanIdeas = ideas.map((i) => ({ keyword: word(i.keyword), note: typeof i.note === 'string' ? i.note.slice(0, 200).replace(/[<>]/g, '') : '' }));
  if (cleanIdeas.some((i) => !i.keyword)) return { ok: false, message: 'A related query is not a valid keyword.' };
  if (!cleanScores.length && !cleanIdeas.length) return { ok: false, message: 'Choose at least one term or query to save.' };

  const place = geo || 'worldwide';
  const label = TRENDS_RANGES[range as TrendsRange] ?? range;
  const country = geo.slice(0, 2);
  return withLibrary(project, `save ${cleanScores.length + cleanIdeas.length} keyword${cleanScores.length + cleanIdeas.length === 1 ? '' : 's'} from Google Trends (${place})`, (lib) => {
    const o = options(opts, lib);
    const at = now();
    let added = 0, updated = 0;
    for (const s of cleanScores) {
      const trends: TrendsData = { geo, range: label, average: s.average!, peak: s.peak!, latest: s.latest!, comparedWith: comparedWith.length ? comparedWith : [s.keyword!], importedAt: at };
      const event = { provider: 'google-trends' as const, at, summary: `Google Trends (${place}, ${label}): average interest ${s.average}/100, peak ${s.peak} — relative to ${trends.comparedWith.join(', ')}` };
      if (upsert(lib, s.keyword!, country, 'google-trends', o, { trends }, event) === 'added') added++; else updated++;
    }
    for (const i of cleanIdeas) {
      const event = { provider: 'google-trends' as const, at, summary: `Google Trends related query (${place}, ${label})${i.note ? `: ${i.note}` : ''}` };
      if (upsert(lib, i.keyword!, country, 'google-trends', o, {}, event) === 'added') added++; else updated++;
    }
    return { ok: true, message: `Saved to the keyword library: ${added} new, ${updated} updated with Google Trends data. Trends scores are relative interest, not search volume.` };
  });
}

export async function researchSettings(project: unknown): Promise<ResearchSettings | null> {
  const access = await authorizeProject(project, 'keywords');
  return access.ok ? (await loadSettings(access.store)).data : null;
}

/* ---------- Keyword Ideas (Google suggestions, captured by the admin) ---------- */

export type CheckedIdea = Idea & { existing?: { keyword: string; planner: boolean; trends: boolean; cluster: boolean } };

/**
 * Cleans a pasted list of Google suggestions and marks which are already in
 * the keyword library. Reads only the library; nothing is fetched from Google
 * or anywhere else, and nothing is written.
 */
export async function checkKeywordIdeas(project: unknown, text: unknown, seed: unknown, region: unknown, language: unknown)
  : Promise<{ ok: true; ideas: CheckedIdea[]; duplicates: number; truncated: boolean } | { ok: false; message: string }> {
  const access = await authorizeProject(project, 'keywords');
  if (!access.ok) return access;
  const sp = seedProblems(seed);
  if (sp.length) return { ok: false, message: sp[0] };
  if (!isRegion(region)) return { ok: false, message: 'Choose a suggestion region from the list.' };
  if (!isLanguage(language)) return { ok: false, message: 'Choose a language from the list.' };
  const parsed = parseIdeas(text);
  if (!parsed.ideas.length) return { ok: false, message: 'No keyword suggestions were found in the pasted text. Paste one suggestion per line.' };
  const lib = (await loadLibrary(access.store)).data;
  const index = new Map(lib.keywords.map((k) => [normalizeKeyword(k.keyword), k]));
  return {
    ok: true,
    duplicates: parsed.duplicates,
    truncated: parsed.truncated,
    ideas: parsed.ideas.map((i) => {
      const k = index.get(normalizeKeyword(i.keyword));
      return k ? { ...i, existing: { keyword: k.keyword, planner: Boolean(k.planner), trends: Boolean(k.trends), cluster: Boolean(k.cluster) } } : i;
    }),
  };
}

/**
 * Saves chosen ideas in one commit. New keywords get the source
 * "google-autocomplete" and a research-history entry naming the seed, region
 * and language. A keyword already in the library only gains that history
 * entry — its figures, Keyword Planner and Google Trends data, cluster,
 * intent, notes and page assignments are not touched. No location is set
 * on new keywords: a suggestion region is not a research location, and a
 * later Keyword Planner import can then merge into the same record.
 */
export async function saveKeywordIdeas(project: unknown, keywords: unknown, meta: unknown, opts?: { type?: string }): Promise<SeoResult> {
  await assertSession();
  const m = (meta ?? {}) as { seed?: unknown; region?: unknown; language?: unknown };
  const sp = seedProblems(m.seed);
  if (sp.length) return { ok: false, message: sp[0] };
  if (!isRegion(m.region) || !isLanguage(m.language)) return { ok: false, message: 'Choose a suggestion region and language from the lists.' };
  if (!Array.isArray(keywords) || keywords.length > MAX_IDEAS) return { ok: false, message: `Choose between 1 and ${MAX_IDEAS} ideas.` };
  const parsed = parseIdeas(keywords.filter((k) => typeof k === 'string').join('\n'));
  const valid = parsed.ideas.filter((i) => !i.problems.length);
  if (!valid.length) return { ok: false, message: 'Choose at least one valid keyword idea to save.' };
  const seed = (m.seed as string).trim().replace(/\s+/g, ' ');
  const region = IDEA_REGIONS[m.region], language = IDEA_LANGUAGES[m.language];
  const type = (KEYWORD_TYPES as readonly string[]).includes(opts?.type ?? '') ? (opts!.type as KeywordType) : 'secondary';
  return withLibrary(project, `save ${valid.length} keyword idea${valid.length === 1 ? '' : 's'} (Google Autocomplete, ${region}, ${language})`, (lib) => {
    const at = now();
    const event = { provider: 'google-autocomplete' as const, at, summary: `Google Autocomplete suggestion for "${seed}" (suggestion region ${region}, ${language}) — captured in Keyword Ideas` };
    let added = 0, confirmed = 0;
    for (const i of valid) {
      const key = normalizeKeyword(i.keyword);
      const matches = lib.keywords.filter((k) => normalizeKeyword(k.keyword) === key);
      if (matches.length) {
        for (const k of matches) lib.keywords[lib.keywords.indexOf(k)] = mergeResearch(k, {}, event);
        confirmed++;
        continue;
      }
      lib.keywords.push(mergeResearch({ id: newId('kw'), keyword: i.keyword, type, status: 'idea', source: 'google-autocomplete', createdAt: at, updatedAt: at }, {}, event));
      added++;
    }
    return { ok: true, message: `Saved to the keyword library: ${added} new keyword idea${added === 1 ? '' : 's'}${confirmed ? `, ${confirmed} already there (discovery added to their history; nothing else changed)` : ''}.` };
  });
}
