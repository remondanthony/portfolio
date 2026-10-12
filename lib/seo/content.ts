/**
 * SEO for content: the fields a page or article carries, the pages the CMS
 * can manage, cannibalisation, and the checklist.
 *
 * Two kinds of content carry these fields:
 *   - Articles keep them in their own MDX metadata (content/blog/*.mdx).
 *   - The code-built pages (home, blog index, services, case study) keep
 *     them in content/seo/pages.json. Their titles, descriptions and
 *     canonicals stay in code as defaults; the file holds optional overrides
 *     that are merged in at build time (lib/seo/page-metadata.ts).
 *
 * Nothing here changes a URL, a canonical or a page's text by itself. The
 * checklist is guidance — it never inserts a keyword anywhere.
 *
 * Pure and browser-safe.
 */
import { INTENTS, normalizeKeyword, type Intent } from './keywords';

export const SITE_ORIGIN = 'https://www.vioniche.com';

/** The keyword brief and SEO overrides one piece of content can carry. */
export type ContentSeo = {
  primaryKeyword?: string;
  secondaryKeywords?: string[];
  relatedKeywords?: string[];
  searchIntent?: Intent;
  targetAudience?: string;
  targetLocation?: string;
  /** A cluster id from the keyword library. */
  cluster?: string;
  keywordNotes?: string;
  /** Used as the document title exactly as written (no " | Vioniche" added). */
  seoTitle?: string;
  ogTitle?: string;
  ogDescription?: string;
  /** A site image path, e.g. /blog/slug/cover.jpg. */
  ogImage?: string;
  noindex?: boolean;
  nofollow?: boolean;
};

/** Code-built pages: also a meta description and canonical override. */
export type PageSeo = ContentSeo & {
  metaDescription?: string;
  /** Full https://www.vioniche.com/… address. Leave empty to keep the page's own. */
  canonical?: string;
  updatedAt?: string;
};

export type PagesSeoFile = { version: 1; pages: Record<string, PageSeo> };

/**
 * The pages the CMS can manage SEO for. Keys are stable; paths are the
 * pages' real routes. Adding a page here also needs its metadata wrapped in
 * withPageSeo() — see lib/seo/page-metadata.ts.
 */
export const SEO_PAGES = [
  { key: 'home', path: '/', name: 'Homepage' },
  { key: 'blog', path: '/blog', name: 'Blog index' },
  { key: 'web-development', path: '/services/web-development', name: 'Web Development' },
  { key: 'seo', path: '/services/seo', name: 'SEO services' },
  { key: 'automation', path: '/services/automation', name: 'Automation' },
  { key: 'ai-automation', path: '/services/ai-automation', name: 'AI Automation' },
  { key: 'born21', path: '/case-studies/born21', name: 'Born21 case study' },
] as const;
export type SeoPageKey = (typeof SEO_PAGES)[number]['key'];
export const isSeoPageKey = (k: string): k is SeoPageKey => SEO_PAGES.some((p) => p.key === k);
export const seoPage = (k: SeoPageKey) => SEO_PAGES.find((p) => p.key === k)!;

const IMAGE_PATH = /^\/[a-z0-9/_.-]+\.(?:jpe?g|png|webp|avif)$/i;
const CLUSTER_ID = /^[a-z0-9_-]{4,40}$/;

/** Rules for the shared fields; `where` prefixes each message. */
export function contentSeoProblems(s: unknown, where = ''): string[] {
  if (s === undefined) return [];
  const m = s as Record<string, unknown>;
  if (!m || typeof m !== 'object') return [`${where}SEO settings must be an object`];
  const out: string[] = [];
  const text = (k: string, max: number) => {
    const v = m[k];
    if (v !== undefined && (typeof v !== 'string' || v.length > max || /[<>]/.test(v))) out.push(`${where}${k} must be text of ${max} characters or fewer, without < >`);
  };
  const list = (k: string) => {
    const v = m[k];
    if (v === undefined) return;
    if (!Array.isArray(v) || v.length > 30 || v.some((x) => typeof x !== 'string' || !x.trim() || x.length > 120 || /[<>]/.test(x))) {
      out.push(`${where}${k} must be a list of up to 30 keywords, each 120 characters or fewer`);
    }
  };
  text('primaryKeyword', 120);
  list('secondaryKeywords');
  list('relatedKeywords');
  if (m.searchIntent !== undefined && !(INTENTS as readonly unknown[]).includes(m.searchIntent)) out.push(`${where}searchIntent must be one of: ${INTENTS.join(', ')}`);
  text('targetAudience', 200);
  text('targetLocation', 120);
  if (m.cluster !== undefined && (typeof m.cluster !== 'string' || !CLUSTER_ID.test(m.cluster))) out.push(`${where}cluster must be a cluster id`);
  text('keywordNotes', 1000);
  text('seoTitle', 120);
  text('ogTitle', 120);
  text('ogDescription', 300);
  if (m.ogImage !== undefined && (typeof m.ogImage !== 'string' || !IMAGE_PATH.test(m.ogImage) || m.ogImage.includes('..'))) {
    out.push(`${where}ogImage must be a site image path like /blog/slug/cover.jpg`);
  }
  for (const k of ['noindex', 'nofollow']) if (m[k] !== undefined && typeof m[k] !== 'boolean') out.push(`${where}${k} must be true or false`);
  return out;
}

/** A canonical override may only name a page on this site. */
export function canonicalProblem(canonical: unknown): string | null {
  if (canonical === undefined) return null;
  if (typeof canonical !== 'string') return 'canonical must be text';
  try {
    const u = new URL(canonical);
    if (u.origin !== SITE_ORIGIN || u.hash || u.username) return `canonical must be a ${SITE_ORIGIN}/… address`;
  } catch {
    return 'canonical must be a full https:// address';
  }
  return null;
}

export function pagesFileProblems(file: unknown): string[] {
  const f = file as Partial<PagesSeoFile> | null;
  if (!f || typeof f !== 'object' || f.version !== 1 || !f.pages || typeof f.pages !== 'object' || Array.isArray(f.pages)) {
    return ['content/seo/pages.json must be { "version": 1, "pages": {} }'];
  }
  const out: string[] = [];
  for (const [key, p] of Object.entries(f.pages)) {
    if (!isSeoPageKey(key)) { out.push(`pages.${key}: not a page the CMS manages`); continue; }
    out.push(...contentSeoProblems(p, `pages.${key}.`));
    const pp = p as PageSeo;
    if (pp.metaDescription !== undefined && (typeof pp.metaDescription !== 'string' || pp.metaDescription.length > 300 || /[<>]/.test(pp.metaDescription))) {
      out.push(`pages.${key}.metaDescription must be text of 300 characters or fewer`);
    }
    const c = canonicalProblem(pp.canonical);
    if (c) out.push(`pages.${key}.${c}`);
  }
  return out;
}

/* ---------- cannibalisation ---------- */

/** One piece of content, as the SEO tools see it. */
export type SeoItem = {
  kind: 'page' | 'article';
  /** Page key or article slug. */
  id: string;
  name: string;
  path: string;
  /** "Published", "Draft", "Noindex"… */
  status: string;
  /** Only live, indexable content can compete in search. */
  live: boolean;
  seo: ContentSeo;
  hasTitle: boolean;
  hasDescription: boolean;
};

export type Cannibalisation = { keyword: string; items: SeoItem[]; live: number };

/**
 * Content sharing a primary keyword. Reported, never fixed: two pages may be
 * meant to target the same phrase for a while (a draft replacing an old
 * page), so the CMS only warns.
 */
export function findCannibalisation(items: SeoItem[]): Cannibalisation[] {
  const by = new Map<string, SeoItem[]>();
  for (const it of items) {
    const k = it.seo.primaryKeyword ? normalizeKeyword(it.seo.primaryKeyword) : '';
    if (!k) continue;
    by.set(k, [...(by.get(k) ?? []), it]);
  }
  return [...by.entries()]
    .filter(([, list]) => list.length > 1)
    .map(([, list]) => ({ keyword: list[0].seo.primaryKeyword!.trim(), items: list, live: list.filter((i) => i.live).length }))
    .sort((a, b) => b.live - a.live || a.keyword.localeCompare(b.keyword));
}

/** Other content already using `keyword` as its primary keyword. */
export function primaryConflicts(keyword: string, items: SeoItem[], self: { kind: SeoItem['kind']; id: string | null }) {
  const k = normalizeKeyword(keyword);
  if (!k) return [];
  return items.filter((i) => !(i.kind === self.kind && i.id === self.id) && i.seo.primaryKeyword && normalizeKeyword(i.seo.primaryKeyword) === k);
}

/** Where each keyword text is used, and in which role. */
export type Usage = { item: SeoItem; role: 'primary' | 'secondary' | 'related' };
export function keywordUsage(items: SeoItem[]): Map<string, Usage[]> {
  const out = new Map<string, Usage[]>();
  const add = (kw: string | undefined, item: SeoItem, role: Usage['role']) => {
    const k = kw ? normalizeKeyword(kw) : '';
    if (!k) return;
    out.set(k, [...(out.get(k) ?? []), { item, role }]);
  };
  for (const it of items) {
    add(it.seo.primaryKeyword, it, 'primary');
    it.seo.secondaryKeywords?.forEach((k) => add(k, it, 'secondary'));
    it.seo.relatedKeywords?.forEach((k) => add(k, it, 'related'));
  }
  return out;
}

/* ---------- the checklist ---------- */

export type ChecklistInput = {
  primaryKeyword?: string;
  /** The title search engines will see (SEO title, or the page's own). */
  title: string;
  h1: string;
  /** Visible body text, without markup. */
  text: string;
  metaDescription: string;
  /** The page's path, e.g. /blog/my-article. */
  path: string;
  internalLinks: number;
  images: number;
  imagesMissingAlt: number;
};

export type ChecklistItem = { ok: boolean; label: string; note?: string };

const SMALL = new Set(['a', 'an', 'the', 'and', 'or', 'for', 'to', 'of', 'in', 'on', 'with', 'by', 'at', 'from', 'your', 'our', 'is', 'are']);
const significant = (s: string) => normalizeKeyword(s).split(/[^a-z0-9]+/).filter((w) => w.length > 1 && !SMALL.has(w));
const phraseIn = (phrase: string, text: string) => normalizeKeyword(text).includes(normalizeKeyword(phrase));
const wordsIn = (phrase: string, text: string) => {
  const t = new Set(normalizeKeyword(text).split(/[^a-z0-9]+/));
  const w = significant(phrase);
  return w.length > 0 && w.every((x) => t.has(x));
};

/**
 * The eight checks, worded as guidance. "Appears naturally" passes on any
 * genuine use and warns only when the phrase is repeated so often it would
 * read as stuffing — the CMS never asks for more repetitions.
 */
export function seoChecklist(c: ChecklistInput): ChecklistItem[] {
  const kw = c.primaryKeyword?.trim() ?? '';
  const words = c.text.split(/\s+/).filter(Boolean).length;
  const occurrences = kw ? normalizeKeyword(c.text).split(normalizeKeyword(kw)).length - 1 : 0;
  // Uses per 100 words. Above ~3 the copy usually reads as repetitive.
  const density = words ? (occurrences * significant(kw).length * 100) / words : 0;
  const slug = c.path.split('/').filter(Boolean).pop() ?? '';
  const slugWords = new Set(slug.split('-'));
  const kwWords = significant(kw);
  const slugMatches = kwWords.filter((w) => slugWords.has(w)).length;

  const inTitle = kw && (phraseIn(kw, c.title) ? 'exact' : wordsIn(kw, c.title) ? 'words' : '');
  const inH1 = kw && (phraseIn(kw, c.h1) ? 'exact' : wordsIn(kw, c.h1) ? 'words' : '');
  const desc = c.metaDescription.trim().length;

  return [
    { ok: Boolean(kw), label: 'Primary keyword exists', note: kw ? undefined : 'Choose one from the keyword library or type it in' },
    { ok: Boolean(inTitle), label: 'Primary keyword appears in SEO title', note: !kw ? undefined : !inTitle ? 'Not in the title' : inTitle === 'words' ? 'Its words are there, not the exact phrase — fine if it reads better' : undefined },
    { ok: Boolean(inH1), label: 'Primary keyword appears in H1', note: !kw ? undefined : !inH1 ? 'Not in the main heading' : inH1 === 'words' ? 'Its words are there, not the exact phrase' : undefined },
    {
      ok: Boolean(kw) && occurrences > 0 && density <= 3,
      label: 'Primary keyword appears naturally in content',
      note: !kw ? undefined : occurrences === 0 ? (wordsIn(kw, c.text) ? 'Its words appear, but never together' : 'Not in the body text yet') : density > 3 ? `Used ${occurrences} times in ${words} words — this may read as keyword stuffing` : undefined,
    },
    { ok: desc > 0, label: 'Meta description exists', note: !desc ? 'Missing' : desc < 70 ? `${desc} characters — fairly short` : desc > 160 ? `${desc} characters — likely cut off in results` : undefined },
    {
      ok: /^[a-z0-9-]*$/.test(slug) && slug.length <= 75 && (!kwWords.length || c.path === '/' || slugMatches > 0),
      label: 'URL/slug is optimized',
      note: slug.length > 75 ? 'Long URL' : !/^[a-z0-9-]*$/.test(slug) ? 'Use lowercase words and hyphens' : kwWords.length && c.path !== '/' && !slugMatches ? 'The URL shares no words with the keyword — existing URLs are never changed automatically' : undefined,
    },
    { ok: c.internalLinks > 0, label: 'Internal links exist', note: c.internalLinks ? undefined : 'No links to other Vioniche pages' },
    { ok: c.imagesMissingAlt === 0, label: 'Image alt text exists', note: c.images === 0 ? 'No images' : c.imagesMissingAlt ? `${c.imagesMissingAlt} of ${c.images} images have no alt text` : undefined },
  ].map((i) => (i.ok && i.note === undefined ? { ok: true, label: i.label } : i));
}

/** Markdown/MDX body → plain text, headings, images and internal links, for the checklist. */
export function readMarkdown(body: string) {
  const images: { alt: string }[] = [];
  for (const m of body.matchAll(/!\[([^\]]*)\]\([^)]*\)/g)) images.push({ alt: m[1].trim() });
  for (const m of body.matchAll(/<Figure\b([^>]*)\/?>/g)) images.push({ alt: (m[1].match(/\balt=["']([^"']*)["']/)?.[1] ?? '').trim() });
  // A link, not an image: ![alt](/x.jpg) is not a link to another page.
  const internalLinks = [...body.matchAll(/(?<!!)\[[^\]]*\]\((\/(?!\/)[^)\s]*|https:\/\/www\.vioniche\.com[^)\s]*)\)/g)].length;
  const text = body
    .replace(/<[^>]+>/g, ' ')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/[#>*_`~|-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return { text, images: images.length, imagesMissingAlt: images.filter((i) => !i.alt).length, internalLinks };
}

/** Rendered HTML (one of our own pages) → the same facts. Regex is enough for HTML this site generates. */
export function readHtml(html: string) {
  const main = html.match(/<main\b[^>]*>([\s\S]*?)<\/main>/i)?.[1] ?? html;
  const clean = (s: string) => s.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/gi, ' ').replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&').replace(/&#x27;|&#39;|&rsquo;|&lsquo;/g, "'").replace(/&quot;|&ldquo;|&rdquo;/g, '"').replace(/&mdash;/g, '—').replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ').trim();
  const imgs = [...main.matchAll(/<img\b[^>]*>/gi)].map((m) => m[0]);
  return {
    title: clean(html.match(/<title>([\s\S]*?)<\/title>/i)?.[1] ?? ''),
    description: (html.match(/<meta name="description" content="([^"]*)"/i)?.[1] ?? '').replace(/&amp;/g, '&').replace(/&#x27;/g, "'").replace(/&quot;/g, '"'),
    canonical: html.match(/<link rel="canonical" href="([^"]*)"/i)?.[1] ?? '',
    robots: html.match(/<meta name="robots" content="([^"]*)"/i)?.[1] ?? '',
    h1: clean(html.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i)?.[1] ?? ''),
    text: clean(main),
    images: imgs.length,
    // alt="" is a deliberate decorative image, not a missing one.
    imagesMissingAlt: imgs.filter((t) => !/\balt=/i.test(t)).length,
    internalLinks: [...main.matchAll(/<a\b[^>]*href="(\/(?!\/)[^"]*|https:\/\/www\.vioniche\.com[^"]*)"/gi)].length,
  };
}

/* ---------- related content (link suggestions) ---------- */

export type Related = { item: SeoItem; score: number; reasons: string[] };

const phrases = (s: ContentSeo) =>
  new Set([s.primaryKeyword, ...(s.secondaryKeywords ?? []), ...(s.relatedKeywords ?? [])].filter(Boolean).map((k) => normalizeKeyword(k!)));

/**
 * Other live content worth linking to from `self`, by shared topic cluster,
 * shared keyword phrases, and shared significant words in the keywords.
 * Suggestions only: nothing is inserted anywhere.
 */
export function relatedByKeywords(self: Pick<SeoItem, 'kind' | 'id' | 'seo'>, items: SeoItem[], max = 6): Related[] {
  const mine = phrases(self.seo);
  const myWords = new Set([...mine].flatMap(significant));
  const out: Related[] = [];
  for (const it of items) {
    if ((it.kind === self.kind && it.id === self.id) || !it.live) continue;
    const reasons: string[] = [];
    let score = 0;
    if (self.seo.cluster && it.seo.cluster === self.seo.cluster) { score += 3; reasons.push('Same topic cluster'); }
    const theirs = phrases(it.seo);
    const sharedPhrases = [...mine].filter((p) => theirs.has(p));
    if (sharedPhrases.length) { score += 3 * sharedPhrases.length; reasons.push(`Shares keyword: ${sharedPhrases.slice(0, 2).join(', ')}`); }
    const theirPrimary = it.seo.primaryKeyword ? normalizeKeyword(it.seo.primaryKeyword) : '';
    if (theirPrimary && mine.has(theirPrimary) && !sharedPhrases.includes(theirPrimary)) { score += 2; reasons.push('Its primary keyword is in your brief'); }
    const words = [...new Set([...theirs].flatMap(significant))].filter((w) => myWords.has(w));
    if (!sharedPhrases.length && words.length >= 2) { score += words.length; reasons.push(`Shared terms: ${words.slice(0, 3).join(', ')}`); }
    if (score > 0) out.push({ item: it, score, reasons });
  }
  return out.sort((a, b) => b.score - a.score || a.item.name.localeCompare(b.item.name)).slice(0, max);
}

/** Where a piece of content's SEO is edited in the CMS. */
export const editHref = (i: Pick<SeoItem, 'kind' | 'id'>) => (i.kind === 'page' ? `/admin/seo/pages/${i.id}` : `/admin/blog/${i.id}/edit`);

/** What the article editor gets to work with: the library and every other piece of content. */
export type EditorSeo = {
  keywords: { keyword: string; location?: string }[];
  clusters: { id: string; name: string }[];
  items: SeoItem[];
};
