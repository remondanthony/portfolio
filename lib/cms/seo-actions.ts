'use server';

import { assertSession } from '@/lib/admin/session';
import { changed, failed, json, newId, now, withLibrary, type SeoResult } from './seo-write';
import { authorizeProject } from './project-access';
import { problems, SLUG } from '@/lib/blog/model';
import {
  canonicalProblem, contentSeoProblems, isSeoPageKey, primaryConflicts, seoPage,
  type PageSeo, type SeoItem,
} from '@/lib/seo/content';
import {
  clusterProblems, duplicateKey, keywordProblems, mergeResearch, normalizeKeyword, toKeywordInput,
  type Cluster, type Keyword, type KeywordInput, type KeywordLibrary, type PlannerData,
} from '@/lib/seo/keywords';
import { MAX_IMPORT_ROWS } from '@/lib/seo/csv';
import { classifyPlanner, plannerSummary, type PlannerPreviewRow } from '@/lib/seo/planner';
import { catalog } from './catalog';
import { parseArticle, serializeArticle } from './mdx-file';
import { loadLibrary, loadPagesSeo, seoItems } from './seo-data';
import { articlePath, SEO_DATA_FILES, versionOf } from './store';

/**
 * Keyword library, clusters, keyword assignment and page SEO.
 *
 * Every action names its project first. It checks the session and the
 * project (lib/cms/project-access.ts) itself, validates everything it is given
 * on the server (the browser's own checks are only a convenience), and writes
 * one commit through the same store as articles. Edits are checked against
 * what the admin saw: a record changed elsewhere since the page loaded is
 * refused, never overwritten. Nothing here changes an article's text, a URL
 * or a canonical unless that is exactly what the admin submitted.
 */

export type { SeoResult } from './seo-write';

/* ---------- keywords ---------- */

export async function saveKeyword(project: unknown, raw: Record<string, unknown>, ref: { id?: string; updatedAt?: string }): Promise<SeoResult> {
  ref = ref && typeof ref === 'object' ? ref : {};
  const input = toKeywordInput(raw && typeof raw === 'object' ? raw : {});
  return withLibrary(project, ref.id ? `update “${input.keyword}”` : `add “${input.keyword}”`, (lib) => {
    const p = keywordProblems(input, lib.clusters);
    if (p.length) return { ok: false, message: 'Not saved — fix these first.', problems: p };
    const dup = lib.keywords.find((k) => duplicateKey(k) === duplicateKey(input) && k.id !== ref.id);
    if (dup) return { ok: false, message: `“${dup.keyword}”${dup.location ? ` (${dup.location})` : ''} is already in the library. Edit that record instead.` };
    if (ref.id) {
      const i = lib.keywords.findIndex((k) => k.id === ref.id);
      if (i < 0) return { ok: false, conflict: true, message: 'That keyword no longer exists. Reload the list.' };
      if (lib.keywords[i].updatedAt !== ref.updatedAt) return { ok: false, conflict: true, message: changed };
      // The form edits the record's own fields; research data and history are carried over untouched.
      const old = lib.keywords[i];
      lib.keywords[i] = tidy({ ...input, trends: old.trends, planner: old.planner, history: old.history, id: ref.id, createdAt: old.createdAt, updatedAt: now() }) as Keyword;
      return { ok: true, message: `Updated “${input.keyword}”.` };
    }
    const t = now();
    lib.keywords.push({ ...input, id: newId('kw'), createdAt: t, updatedAt: t });
    return { ok: true, message: `Added “${input.keyword}”.` };
  });
}

export async function deleteKeyword(project: unknown, id: string, updatedAt: string): Promise<SeoResult> {
  return withLibrary(project, 'delete keyword', (lib) => {
    const k = lib.keywords.find((x) => x.id === id);
    if (!k) return { ok: false, conflict: true, message: 'That keyword no longer exists. Reload the list.' };
    if (k.updatedAt !== updatedAt) return { ok: false, conflict: true, message: changed };
    lib.keywords = lib.keywords.filter((x) => x.id !== id);
    return { ok: true, message: `Deleted “${k.keyword}” from the library. Pages and articles that name it are unchanged.` };
  });
}

/* ---------- clusters ---------- */

export async function saveCluster(project: unknown, raw: Record<string, unknown>, ref: { id?: string; updatedAt?: string }): Promise<SeoResult> {
  ref = ref && typeof ref === 'object' ? ref : {};
  raw = raw && typeof raw === 'object' ? raw : {};
  const s = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
  const input = { name: s(raw.name, 120), primaryKeyword: s(raw.primaryKeyword, 200) || undefined, description: s(raw.description, 600) || undefined };
  return withLibrary(project, ref.id ? `update cluster “${input.name}”` : `add cluster “${input.name}”`, (lib) => {
    const p = clusterProblems(input);
    if (p.length) return { ok: false, message: 'Not saved — fix these first.', problems: p };
    if (lib.clusters.some((c) => c.id !== ref.id && normalizeKeyword(c.name) === normalizeKeyword(input.name))) {
      return { ok: false, message: `A cluster named “${input.name}” already exists.` };
    }
    const clean = Object.fromEntries(Object.entries(input).filter(([, v]) => v !== undefined)) as Pick<Cluster, 'name' | 'primaryKeyword' | 'description'>;
    if (ref.id) {
      const i = lib.clusters.findIndex((c) => c.id === ref.id);
      if (i < 0) return { ok: false, conflict: true, message: 'That cluster no longer exists. Reload the page.' };
      if (lib.clusters[i].updatedAt !== ref.updatedAt) return { ok: false, conflict: true, message: changed };
      lib.clusters[i] = { ...clean, id: ref.id, createdAt: lib.clusters[i].createdAt, updatedAt: now() };
      return { ok: true, message: `Updated cluster “${input.name}”.` };
    }
    const t = now();
    lib.clusters.push({ ...clean, id: newId('cl'), createdAt: t, updatedAt: t });
    return { ok: true, message: `Added cluster “${input.name}”.` };
  });
}

/** Removes the cluster; its keywords stay, without a cluster. */
export async function deleteCluster(project: unknown, id: string, updatedAt: string): Promise<SeoResult> {
  return withLibrary(project, 'delete cluster', (lib) => {
    const c = lib.clusters.find((x) => x.id === id);
    if (!c) return { ok: false, conflict: true, message: 'That cluster no longer exists. Reload the page.' };
    if (c.updatedAt !== updatedAt) return { ok: false, conflict: true, message: changed };
    lib.clusters = lib.clusters.filter((x) => x.id !== id);
    let n = 0;
    lib.keywords = lib.keywords.map((k) => (k.cluster === id ? (n++, { ...k, cluster: undefined, updatedAt: now() }) : k));
    return { ok: true, message: `Deleted cluster “${c.name}”. ${n} keyword${n === 1 ? '' : 's'} kept, now without a cluster.` };
  });
}

/** Puts keywords into a cluster (or none), by id. */
export async function setKeywordCluster(project: unknown, ids: string[], clusterId: string | null): Promise<SeoResult> {
  return withLibrary(project, clusterId ? 'assign keywords to a cluster' : 'remove keywords from a cluster', (lib) => {
    if (clusterId && !lib.clusters.some((c) => c.id === clusterId)) return { ok: false, conflict: true, message: 'That cluster no longer exists.' };
    const set = new Set(ids.slice(0, MAX_IMPORT_ROWS));
    let n = 0;
    lib.keywords = lib.keywords.map((k) => (set.has(k.id) ? (n++, { ...k, cluster: clusterId ?? undefined, updatedAt: now() }) : k));
    if (!n) return { ok: false, message: 'None of those keywords exist any more. Reload the list.' };
    return { ok: true, message: `${n} keyword${n === 1 ? '' : 's'} updated.` };
  });
}

/* ---------- CSV import ---------- */

export type ImportRowResult = {
  line: number;
  keyword: string;
  status: 'new' | 'existing' | 'duplicate-in-file' | 'invalid';
  problems?: string[];
  /** For "existing": the record it matches and the fields that would change. */
  existingId?: string;
  changes?: string[];
};

type ImportDefaults = { source?: string; type?: string; status?: string; country?: string; location?: string; cluster?: string };

function classify(rows: { line: number; values: Record<string, string> }[], defaults: ImportDefaults, lib: KeywordLibrary) {
  const d = toKeywordInput(defaults as Record<string, unknown>);
  const base: Partial<KeywordInput> = {
    source: d.source, type: d.type, status: d.status, country: defaults.country ? d.country : undefined,
    location: defaults.location ? d.location : undefined, cluster: defaults.cluster ? d.cluster : undefined,
  };
  const seen = new Map<string, number>();
  return rows.slice(0, MAX_IMPORT_ROWS).map(({ line, values }) => {
    const input = toKeywordInput(values, base);
    const p = keywordProblems(input, lib.clusters);
    const result: ImportRowResult & { input: KeywordInput } = { line: Number(line) || 0, keyword: input.keyword, status: 'new', input };
    if (p.length) return { ...result, status: 'invalid' as const, problems: p };
    const key = duplicateKey(input);
    if (seen.has(key)) return { ...result, status: 'duplicate-in-file' as const, problems: [`Same keyword as line ${seen.get(key)}`] };
    seen.set(key, result.line);
    const existing = lib.keywords.find((k) => duplicateKey(k) === key);
    if (existing) {
      // Only what the file itself says can change an existing record — never the
      // import's defaults — and an existing cluster is kept.
      const fromFile = toKeywordInput(values);
      const has = (col: string) => typeof values[col] === 'string' && values[col].trim() !== '';
      const fields = ['type', 'intent', 'volume', 'volumeRange', 'difficulty', 'cpc', 'competition', 'status', 'notes'] as const;
      const changes: string[] = fields.filter((f) => has(f === 'volumeRange' ? 'volume' : f) && fromFile[f] !== undefined && fromFile[f] !== existing[f]);
      if (!existing.cluster && input.cluster) changes.push('cluster');
      if (has('source') && fromFile.source !== existing.source) changes.push('source');
      return { ...result, status: 'existing' as const, existingId: existing.id, changes };
    }
    return result;
  });
}

export async function previewImport(project: unknown, rows: { line: number; values: Record<string, string> }[], defaults: ImportDefaults)
  : Promise<{ ok: true; rows: ImportRowResult[] } | { ok: false; message: string }> {
  const access = await authorizeProject(project, 'keywords');
  if (!access.ok) return access;
  const { store } = access;
  if (!Array.isArray(rows)) return { ok: false, message: 'No rows to import.' };
  if (rows.length > MAX_IMPORT_ROWS) return { ok: false, message: `At most ${MAX_IMPORT_ROWS} rows per import.` };
  const loaded = await loadLibrary(store);
  if (loaded.error) return { ok: false, message: loaded.error };
  return { ok: true, rows: classify(rows, defaults, loaded.data).map(({ input: _input, ...r }) => r) };
}

/**
 * Imports the new rows. Rows matching an existing keyword are skipped unless
 * their line number is in `updateLines` — an explicit, per-row confirmation —
 * and then only the fields the file actually provides are updated. The rows
 * are classified again here; the preview is never trusted.
 */
export async function confirmImport(project: unknown, rows: { line: number; values: Record<string, string> }[], defaults: ImportDefaults, updateLines: number[]): Promise<SeoResult> {
  await assertSession();
  if (!Array.isArray(rows) || rows.length > MAX_IMPORT_ROWS) return { ok: false, message: `At most ${MAX_IMPORT_ROWS} rows per import.` };
  const update = new Set(Array.isArray(updateLines) ? updateLines.map(Number) : []);
  return withLibrary(project, `import from ${defaults.source ? toKeywordInput({ source: defaults.source }).source : 'CSV'}`, (lib) => {
    const classified = classify(rows, defaults, lib);
    const t = now();
    let added = 0, updated = 0, skipped = 0, invalid = 0;
    for (const r of classified) {
      if (r.status === 'invalid' || r.status === 'duplicate-in-file') { invalid += r.status === 'invalid' ? 1 : 0; skipped += r.status === 'duplicate-in-file' ? 1 : 0; continue; }
      if (r.status === 'existing') {
        if (!update.has(r.line) || !r.changes?.length) { skipped++; continue; }
        const i = lib.keywords.findIndex((k) => k.id === r.existingId);
        const patch = Object.fromEntries(r.changes.map((f) => [f, r.input[f as keyof KeywordInput]]));
        lib.keywords[i] = { ...lib.keywords[i], ...patch, updatedAt: t };
        updated++;
        continue;
      }
      lib.keywords.push({ ...r.input, id: newId('kw'), createdAt: t, updatedAt: t });
      added++;
    }
    if (!added && !updated) return { ok: false, message: 'Nothing to import: every row was invalid, a duplicate, or already in the library.' };
    const summary = `Imported ${added} new keyword${added === 1 ? '' : 's'}${updated ? `, updated ${updated}` : ''}. Skipped ${skipped} duplicate${skipped === 1 ? '' : 's'}${invalid ? ` and ${invalid} invalid row${invalid === 1 ? '' : 's'}` : ''}.`;
    return { ok: true, message: summary };
  });
}

/* ---------- assigning keywords to content ---------- */

type Target = { kind: 'page' | 'article'; id: string };
type Role = 'primary' | 'secondary' | 'related';

function applyRole(seo: { primaryKeyword?: string; secondaryKeywords?: string[]; relatedKeywords?: string[] }, keyword: string, role: Role | null) {
  const k = normalizeKeyword(keyword);
  const without = (list?: string[]) => (list ?? []).filter((x) => normalizeKeyword(x) !== k);
  const next = {
    primaryKeyword: seo.primaryKeyword && normalizeKeyword(seo.primaryKeyword) === k ? undefined : seo.primaryKeyword,
    secondaryKeywords: without(seo.secondaryKeywords),
    relatedKeywords: without(seo.relatedKeywords),
  };
  if (role === 'primary') next.primaryKeyword = keyword;
  if (role === 'secondary') next.secondaryKeywords.push(keyword);
  if (role === 'related') next.relatedKeywords.push(keyword);
  return next;
}

/**
 * Gives a piece of content a keyword in a role — or, with role null, takes it
 * away. Only the keyword lists change. Making it someone's primary keyword
 * when another page already targets it needs `confirmed` (cannibalisation).
 * `version` is what the admin saw: the article file's version, or the page
 * entry's updatedAt ('' if it had none).
 */
export async function assignKeyword(project: unknown, keyword: string, target: Target, role: Role | null, version: string, confirmed = false): Promise<SeoResult> {
  const access = await authorizeProject(project, 'pageSeo');
  if (!access.ok) return access;
  const { store } = access;
  // Checked as sent: a line break, tab or markup means the request was not made by the CMS's own form.
  if (typeof keyword !== 'string' || /[<>\n\r\t]/.test(keyword)) return { ok: false, message: 'That is not a valid keyword.' };
  const kw = keyword.trim().replace(/\s+/g, ' ');
  if (!kw || kw.length > 120) return { ok: false, message: 'That is not a valid keyword.' };
  if (role !== null && !['primary', 'secondary', 'related'].includes(role)) return { ok: false, message: 'Unknown role.' };
  if (!target || (target.kind !== 'page' && target.kind !== 'article')) return { ok: false, message: 'Unknown page.' };

  try {
    const [entries, pages] = await Promise.all([catalog(store), loadPagesSeo(store)]);
    if (pages.error) return { ok: false, message: pages.error };
    const items = seoItems(entries, pages.data);
    if (role === 'primary' && !confirmed) {
      const others = primaryConflicts(kw, items, target);
      if (others.length) {
        return { ok: false, needsConfirm: true, message: `This keyword is already being targeted by another page: ${others.map((o) => `${o.name} (${o.path})`).join(', ')}. Assigning it again may cause keyword cannibalization.` };
      }
    }
    const verb = role ? `assign “${kw}” as ${role} keyword` : `remove keyword “${kw}”`;

    if (target.kind === 'page') {
      if (!isSeoPageKey(target.id)) return { ok: false, message: 'Unknown page.' };
      const current: PageSeo = pages.data.pages[target.id] ?? {};
      if ((current.updatedAt ?? '') !== (version ?? '')) return { ok: false, conflict: true, message: changed };
      const file = structuredClone(pages.data);
      const stamp = now();
      file.pages[target.id] = tidy({ ...current, ...applyRole(current, kw, role), updatedAt: stamp });
      const commit = await store.commit([{ path: SEO_DATA_FILES.pages, content: json(file) }], `Page SEO: ${seoPage(target.id).name} — ${verb}\n\nVia the Vioniche CMS.`);
      return { ok: true, message: role ? `“${kw}” is now a ${role} keyword of ${seoPage(target.id).name}.` : `Removed “${kw}” from ${seoPage(target.id).name}.`, commit, version: stamp };
    }

    if (!SLUG.test(target.id)) return { ok: false, message: 'Unknown article.' };
    const entry = entries.find((e) => e.slug === target.id);
    if (!entry || entry.error) return { ok: false, message: 'That article does not exist or cannot be read.' };
    if (entry.version !== version) return { ok: false, conflict: true, message: changed };
    const { meta, body, preamble } = parseArticle(entry.source);
    // Only the three keyword fields change; everything else in the file is kept as it is.
    const next: Record<string, unknown> = { ...meta, ...applyRole(meta, kw, role) };
    for (const f of ['primaryKeyword', 'secondaryKeywords', 'relatedKeywords']) {
      const v = next[f];
      if (v === undefined || (Array.isArray(v) && v.length === 0)) delete next[f];
    }
    const bad = problems(target.id, next);
    if (bad.length) return { ok: false, message: 'Not saved.', problems: bad };
    const content = serializeArticle(next as Parameters<typeof serializeArticle>[0], body, preamble);
    const commit = await store.commit([{ path: articlePath(target.id), content }], `SEO: ${meta.title ?? target.id} — ${verb}\n\nVia the Vioniche CMS.`);
    return { ok: true, message: role ? `“${kw}” is now a ${role} keyword of “${meta.title}”.` : `Removed “${kw}” from “${meta.title}”.`, commit, version: versionOf(content) };
  } catch (e) {
    return failed(e);
  }
}

/** Drops empty lists and strings so stored data stays tidy. */
function tidy<T extends Record<string, unknown>>(o: T): T {
  return Object.fromEntries(Object.entries(o).filter(([, v]) => v !== undefined && v !== '' && !(Array.isArray(v) && v.length === 0))) as T;
}

/* ---------- page SEO ---------- */

const PAGE_FIELDS = ['primaryKeyword', 'secondaryKeywords', 'relatedKeywords', 'searchIntent', 'targetAudience', 'targetLocation', 'cluster',
  'keywordNotes', 'seoTitle', 'metaDescription', 'canonical', 'ogTitle', 'ogDescription', 'ogImage', 'noindex', 'nofollow'] as const;

/**
 * Saves a code-built page's SEO settings. Only what is submitted is stored;
 * an empty field means "use the page's own value from code". A canonical
 * must stay on www.vioniche.com.
 */
export async function savePageSeo(project: unknown, key: string, raw: Record<string, unknown>, updatedAt: string, confirmed = false): Promise<SeoResult> {
  const access = await authorizeProject(project, 'pageSeo');
  if (!access.ok) return access;
  const { store } = access;
  if (!isSeoPageKey(key)) return { ok: false, message: 'Unknown page.' };

  const str = (v: unknown, max: number) => (typeof v === 'string' ? v.replace(/[\u0000-\u001f]/g, ' ').trim().slice(0, max) : '');
  const list = (v: unknown) => (Array.isArray(v) ? v : typeof v === 'string' ? v.split(',') : []).map((x) => str(x, 200)).filter(Boolean).slice(0, 31);
  const next: PageSeo = tidy({
    primaryKeyword: str(raw.primaryKeyword, 200),
    secondaryKeywords: list(raw.secondaryKeywords),
    relatedKeywords: list(raw.relatedKeywords),
    searchIntent: str(raw.searchIntent, 20) as PageSeo['searchIntent'],
    targetAudience: str(raw.targetAudience, 300),
    targetLocation: str(raw.targetLocation, 200),
    cluster: str(raw.cluster, 60),
    keywordNotes: str(raw.keywordNotes, 1500),
    seoTitle: str(raw.seoTitle, 200),
    metaDescription: str(raw.metaDescription, 400),
    canonical: str(raw.canonical, 500),
    ogTitle: str(raw.ogTitle, 200),
    ogDescription: str(raw.ogDescription, 400),
    ogImage: str(raw.ogImage, 300),
    noindex: raw.noindex === true || undefined,
    nofollow: raw.nofollow === true || undefined,
  } as Record<string, unknown>) as PageSeo;
  for (const k of Object.keys(next)) if (!(PAGE_FIELDS as readonly string[]).includes(k)) delete (next as Record<string, unknown>)[k];

  const p = [...contentSeoProblems(next)];
  const c = canonicalProblem(next.canonical);
  if (c) p.push(c);
  if (next.metaDescription && next.metaDescription.length > 300) p.push('metaDescription must be 300 characters or fewer');
  if (p.length) return { ok: false, message: 'Not saved — fix these first.', problems: p };

  try {
    const [entries, pages, lib] = await Promise.all([catalog(store), loadPagesSeo(store), loadLibrary(store)]);
    if (pages.error) return { ok: false, message: pages.error };
    if (next.cluster && !lib.data.clusters.some((x) => x.id === next.cluster)) return { ok: false, message: 'That cluster does not exist.' };
    const current = pages.data.pages[key] ?? {};
    if ((current.updatedAt ?? '') !== (updatedAt ?? '')) return { ok: false, conflict: true, message: changed };
    // Ask once, when the primary keyword is new or changed; the editor keeps showing the warning.
    const unchanged = Boolean(current.primaryKeyword) && normalizeKeyword(current.primaryKeyword!) === normalizeKeyword(next.primaryKeyword ?? '');
    if (next.primaryKeyword && !confirmed && !unchanged) {
      const others = primaryConflicts(next.primaryKeyword, seoItems(entries, pages.data), { kind: 'page', id: key });
      if (others.length) {
        return { ok: false, needsConfirm: true, message: `This keyword is already being targeted by another page: ${others.map((o: SeoItem) => `${o.name} (${o.path})`).join(', ')}. Save anyway?` };
      }
    }
    const file = structuredClone(pages.data);
    const stamp = now();
    if (Object.keys(next).length) file.pages[key] = { ...next, updatedAt: stamp };
    else delete file.pages[key];
    const commit = await store.commit([{ path: SEO_DATA_FILES.pages, content: json(file) }], `Page SEO: ${seoPage(key).name}\n\nVia the Vioniche CMS.`);
    return {
      ok: true,
      commit,
      version: Object.keys(next).length ? stamp : '',
      message: store.kind === 'github'
        ? 'Saved to GitHub. The page’s metadata updates when the Vercel deployment finishes.'
        : 'Saved locally. The dev server picks it up on the next request.',
    };
  } catch (e) {
    return failed(e);
  }
}

export type { Keyword };

/* ---------- Google Keyword Planner import ---------- */

export type PlannerOptions = { location?: string; type?: string; status?: string; cluster?: string; duplicates?: 'skip' | 'update' };
export type { PlannerPreviewRow } from '@/lib/seo/planner';

const MAX_CELL = 300;
/** Rows arrive from the browser: only plain strings, shortened, are accepted. */
function plannerInput(rows: unknown): { line: number; values: Record<string, string> }[] | null {
  if (!Array.isArray(rows) || rows.length > MAX_IMPORT_ROWS) return null;
  const out: { line: number; values: Record<string, string> }[] = [];
  for (const r of rows as { line?: unknown; values?: unknown }[]) {
    if (!r || typeof r !== 'object' || !r.values || typeof r.values !== 'object' || Array.isArray(r.values)) return null;
    const values = Object.fromEntries(Object.entries(r.values as Record<string, unknown>).slice(0, 20)
      .filter(([, v]) => typeof v === 'string').map(([k, v]) => [k.slice(0, 40), (v as string).slice(0, MAX_CELL)]));
    out.push({ line: Number(r.line) || 0, values });
  }
  return out;
}

export async function previewPlannerImport(project: unknown, rows: unknown, opts: PlannerOptions): Promise<{ ok: true; rows: PlannerPreviewRow[] } | { ok: false; message: string }> {
  const access = await authorizeProject(project, 'keywords');
  if (!access.ok) return access;
  const { store } = access;
  const input = plannerInput(rows);
  if (!input) return { ok: false, message: `The file must have between 1 and ${MAX_IMPORT_ROWS} rows.` };
  const loaded = await loadLibrary(store);
  if (loaded.error) return { ok: false, message: loaded.error };
  return { ok: true, rows: classifyPlanner(input, typeof opts?.location === 'string' ? opts.location : undefined, loaded.data) };
}

/**
 * Imports the selected rows in one commit. New keywords are created with
 * source "google-keyword-planner". Keywords already in the library change
 * only when `duplicates` is "update" and the row is selected — and then only
 * their Keyword Planner metrics: name, cluster, intent, notes, type, page
 * assignments, Google Trends data and history all stay. Rows are classified
 * again here; the preview is never trusted.
 */
export async function confirmPlannerImport(project: unknown, rows: unknown, opts: PlannerOptions, selectedLines: unknown): Promise<SeoResult> {
  await assertSession();
  const input = plannerInput(rows);
  if (!input) return { ok: false, message: `The file must have between 1 and ${MAX_IMPORT_ROWS} rows.` };
  const selected = new Set(Array.isArray(selectedLines) ? selectedLines.slice(0, MAX_IMPORT_ROWS).map(Number) : []);
  const location = typeof opts?.location === 'string' && opts.location.trim() ? opts.location.trim().slice(0, 100) : undefined;
  return withLibrary(project, `import from Google Keyword Planner${location ? ` (${location})` : ''}`, (lib) => {
    const type = (['primary', 'secondary', 'related'] as const).find((t) => t === opts?.type) ?? 'secondary';
    const status = (['idea', 'planned', 'targeted', 'archived'] as const).find((s) => s === opts?.status) ?? 'idea';
    const cluster = opts?.cluster && lib.clusters.some((c) => c.id === opts.cluster) ? opts.cluster : undefined;
    const update = opts?.duplicates === 'update';
    const t = now();
    let added = 0, updated = 0, skipped = 0, invalid = 0;
    for (const r of classifyPlanner(input, location, lib)) {
      if (r.status === 'invalid') { invalid++; continue; }
      if (r.status === 'duplicate-in-file' || !selected.has(r.line)) { skipped++; continue; }
      const planner: PlannerData = { ...r.data, importedAt: t };
      const event = { provider: 'google-keyword-planner' as const, at: t, summary: plannerSummary(r.data) };
      if (r.status === 'existing') {
        if (!update) { skipped++; continue; }
        const i = lib.keywords.findIndex((k) => k.id === r.existing!.id);
        lib.keywords[i] = mergeResearch(lib.keywords[i], { planner }, event);
        updated++;
        continue;
      }
      lib.keywords.push(mergeResearch({
        id: newId('kw'), keyword: r.keyword, type, status, source: 'google-keyword-planner', createdAt: t, updatedAt: t,
        ...(r.data.location && r.data.location.toLowerCase() !== 'global' && { location: r.data.location }), ...(cluster && { cluster }),
      }, { planner }, event));
      added++;
    }
    if (!added && !updated) return { ok: false, message: 'Nothing to import: no selected row was new, or chosen for update.' };
    return {
      ok: true,
      message: `Imported from Google Keyword Planner: ${added} new, ${updated} updated. Skipped ${skipped}${invalid ? `, ${invalid} invalid` : ''}. Clusters, page assignments and Google Trends data are unchanged.`,
    };
  });
}
