import { headers } from 'next/headers';
import { SITE_ORIGIN, SEO_PAGES, pagesFileProblems, readHtml, type ContentSeo, type PageSeo, type PagesSeoFile, type SeoItem, type SeoPageKey } from '@/lib/seo/content';
import { emptyLibrary, libraryProblems, type KeywordLibrary } from '@/lib/seo/keywords';
import { catalog, type Entry } from './catalog';
import type { Project } from './projects';
import { SEO_DATA_FILES, type Store } from './store';

/**
 * Server-side reading of the SEO data: the keyword library, the code-built
 * pages' settings, and every piece of content as one list the SEO screens
 * share. Writes go through lib/cms/seo-actions.ts.
 */

export type Loaded<T> = { data: T; version: string | null; error?: string };

export async function loadLibrary(store: Store): Promise<Loaded<KeywordLibrary>> {
  const f = await store.readData(SEO_DATA_FILES.keywords);
  if (!f) return { data: emptyLibrary(), version: null };
  try {
    const data = JSON.parse(f.content) as KeywordLibrary;
    const p = libraryProblems(data);
    if (p.length) return { data: emptyLibrary(), version: f.version, error: `content/seo/keywords.json is not valid: ${p[0]}` };
    return { data, version: f.version };
  } catch {
    return { data: emptyLibrary(), version: f.version, error: 'content/seo/keywords.json is not valid JSON' };
  }
}

export async function loadPagesSeo(store: Store): Promise<Loaded<PagesSeoFile>> {
  const f = await store.readData(SEO_DATA_FILES.pages);
  const empty: PagesSeoFile = { version: 1, pages: {} };
  if (!f) return { data: empty, version: null };
  try {
    const data = JSON.parse(f.content) as PagesSeoFile;
    const p = pagesFileProblems(data);
    if (p.length) return { data: empty, version: f.version, error: `content/seo/pages.json is not valid: ${p[0]}` };
    return { data, version: f.version };
  } catch {
    return { data: empty, version: f.version, error: 'content/seo/pages.json is not valid JSON' };
  }
}

const pick = (m: Partial<ContentSeo>): ContentSeo => ({
  primaryKeyword: m.primaryKeyword, secondaryKeywords: m.secondaryKeywords, relatedKeywords: m.relatedKeywords,
  searchIntent: m.searchIntent, targetAudience: m.targetAudience, targetLocation: m.targetLocation, cluster: m.cluster,
  keywordNotes: m.keywordNotes, seoTitle: m.seoTitle, ogTitle: m.ogTitle, ogDescription: m.ogDescription, ogImage: m.ogImage,
  noindex: m.noindex, nofollow: m.nofollow,
});

/** Every page and article, as the SEO tools see them. */
export function seoItems(entries: Entry[], pages: PagesSeoFile): SeoItem[] {
  const pageItems = SEO_PAGES.map((p): SeoItem => {
    const s: PageSeo = pages.pages[p.key] ?? {};
    return {
      kind: 'page', id: p.key, name: p.name, path: p.path,
      status: s.noindex ? 'Live · noindex' : 'Live',
      live: !s.noindex,
      seo: pick(s),
      // Every code-built page sets a title and description in code; an override only replaces it.
      hasTitle: true, hasDescription: true,
    };
  });
  const articles = entries.filter((e) => !e.error).map((e): SeoItem => {
    const draft = Boolean(e.meta.draft);
    return {
      kind: 'article', id: e.slug, name: e.meta.title || e.slug, path: `/blog/${e.slug}`,
      status: draft ? 'Draft' : e.meta.noindex ? 'Published · noindex' : 'Published',
      live: !draft && !e.meta.noindex,
      seo: pick(e.meta),
      hasTitle: Boolean(e.meta.title?.trim()), hasDescription: Boolean(e.meta.description?.trim()),
    };
  });
  return [...pageItems, ...articles];
}

/**
 * The pages and articles a project's SEO tools work on. Only a project with
 * page SEO (Vioniche — the site this app builds) has any; for another
 * project nothing is read, and its keyword tools work without them.
 */
export async function projectContent(project: Project, store: Store | null): Promise<{ entries: Entry[]; pages: Loaded<PagesSeoFile>; items: SeoItem[] }> {
  if (!project.features.pageSeo || !store || store.project !== project.id) return { entries: [], pages: { data: { version: 1, pages: {} }, version: null }, items: [] };
  const [entries, pages] = await Promise.all([catalog(store), loadPagesSeo(store)]);
  return { entries, pages, items: seoItems(entries, pages.data) };
}

export const pageKey = (k: string) => SEO_PAGES.find((p) => p.key === k)?.key as SeoPageKey | undefined;

/**
 * A code-built page's rendered HTML, for its checklist (H1, body text,
 * images, internal links). Production reads the live site; development reads
 * this dev server — only ever a fixed origin and a registered path, never a
 * host taken from the request in production.
 */
export async function renderedPage(path: string): Promise<ReturnType<typeof readHtml> | null> {
  if (!SEO_PAGES.some((p) => p.path === path)) return null;
  let origin = SITE_ORIGIN;
  if (process.env.NODE_ENV === 'development') {
    const host = (await headers()).get('host') ?? '';
    if (!/^(localhost|127\.0\.0\.1)(:\d{2,5})?$/.test(host)) return null;
    origin = `http://${host}`;
  }
  try {
    const res = await fetch(`${origin}${path}`, { cache: 'no-store', redirect: 'manual', signal: AbortSignal.timeout(8000) });
    if (!res.ok) return null;
    const html = await res.text();
    return html.length > 3_000_000 ? null : readHtml(html);
  } catch {
    return null;
  }
}

/** The article editor's SEO context. An unreadable library just means no suggestions. */
export async function editorSeo(store: Store | null, entries: Entry[]): Promise<import('@/lib/seo/content').EditorSeo> {
  if (!store) return { keywords: [], clusters: [], items: [] };
  const [lib, pages] = await Promise.all([loadLibrary(store), loadPagesSeo(store)]);
  return {
    keywords: lib.data.keywords.filter((k) => k.status !== 'archived').map((k) => ({ keyword: k.keyword, location: k.location })),
    clusters: lib.data.clusters.map((c) => ({ id: c.id, name: c.name })),
    items: seoItems(entries, pages.data),
  };
}

/** Research settings; a missing or unreadable file means the free defaults. */
export async function loadSettings(store: Store | null): Promise<Loaded<import('@/lib/seo/settings').ResearchSettings>> {
  const { defaultSettings, normalizeSettings } = await import('@/lib/seo/settings');
  if (!store) return { data: defaultSettings(), version: null };
  const f = await store.readData(SEO_DATA_FILES.settings);
  if (!f) return { data: defaultSettings(), version: null };
  try {
    // Read leniently: an older file (e.g. one naming the removed Ahrefs provider) falls back to defaults.
    return { data: normalizeSettings(JSON.parse(f.content)), version: f.version };
  } catch {
    return { data: defaultSettings(), version: f.version, error: 'content/seo/settings.json is not valid JSON' };
  }
}
