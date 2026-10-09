import { AUTHORS, CATEGORIES, SLUG, problems, type PostMeta } from '@/lib/blog/model';
import { CASE_STUDIES, SERVICES } from '@/lib/blog/links';
import { SITE_URL } from '@/lib/site';
import { parseArticle } from './mdx-file';
import { bodyProblems, compileProblem } from './safety';
import type { Check, EditorData, Intent } from './types';

/**
 * Converting between the editor's fields and the blog's PostMeta, and the
 * checks run before anything is saved.
 *
 * Errors come first from the blog model itself (problems()) — the same rules
 * the build enforces — so the CMS cannot save a file that would stop the
 * site deploying. A draft has to meet the draft rules, because drafts are
 * validated at build time too; publishing has to meet the published ones.
 */

const today = () => new Date().toISOString().slice(0, 10);
const list = (v: unknown) => (Array.isArray(v) ? v.map(String).map((s) => s.trim()).filter(Boolean) : []);

export const blankArticle = (): EditorData => ({
  originalSlug: null, baseVersion: null, wasPublished: false,
  slug: '', title: '', description: '', excerpt: '', published: today(), updated: '',
  author: Object.keys(AUTHORS)[0], category: CATEGORIES[0], tags: [],
  image: { src: '', alt: '', width: 0, height: 0 }, canonical: '',
  related: [], caseStudies: [], services: [],
  primaryKeyword: '', secondaryKeywords: [], searchIntent: 'informational', cta: null,
  body: '## First section\n\nStart writing here.\n',
});

export function fromSource(slug: string, source: string, version: string): EditorData {
  const { meta: m, body } = parseArticle(source);
  return {
    originalSlug: slug, baseVersion: version, wasPublished: !m.draft,
    slug, title: m.title ?? '', description: m.description ?? '', excerpt: m.excerpt ?? '',
    published: m.published ?? today(), updated: m.updated ?? '',
    author: m.author ?? Object.keys(AUTHORS)[0], category: m.category ?? CATEGORIES[0], tags: list(m.tags),
    image: { src: m.image?.src ?? '', alt: m.image?.alt ?? '', width: m.image?.width ?? 0, height: m.image?.height ?? 0 },
    canonical: m.canonical ?? '', related: list(m.related), caseStudies: list(m.caseStudies), services: list(m.services),
    primaryKeyword: m.primaryKeyword ?? '', secondaryKeywords: list(m.secondaryKeywords), searchIntent: m.searchIntent ?? '',
    cta: m.cta && typeof m.cta === 'object' ? (m.cta as Record<string, string>) : null,
    body,
  };
}

/** Editor fields → PostMeta. Strings are trimmed; unknown link keys are dropped rather than written. */
export function toMeta(d: EditorData, intent: Intent): PostMeta {
  const img = d.image;
  return {
    title: d.title.trim(),
    description: d.description.trim(),
    excerpt: d.excerpt.trim(),
    published: d.published.trim(),
    updated: d.updated.trim() || undefined,
    author: d.author as PostMeta['author'],
    category: d.category as PostMeta['category'],
    tags: list(d.tags),
    image: img.src.trim() ? { src: img.src.trim(), alt: img.alt.trim(), width: Number(img.width) || 0, height: Number(img.height) || 0 } : undefined,
    canonical: d.canonical.trim() || undefined,
    draft: intent === 'draft' ? true : undefined,
    related: list(d.related).filter((s) => SLUG.test(s)),
    caseStudies: list(d.caseStudies).filter((k) => k in CASE_STUDIES) as PostMeta['caseStudies'],
    services: list(d.services).filter((k) => k in SERVICES) as PostMeta['services'],
    primaryKeyword: d.primaryKeyword.trim() || undefined,
    secondaryKeywords: list(d.secondaryKeywords),
    searchIntent: (['informational', 'commercial', 'transactional', 'navigational'].includes(d.searchIntent)
      ? d.searchIntent : undefined) as PostMeta['searchIntent'],
    cta: d.cta && Object.keys(d.cta).length ? (d.cta as PostMeta['cta']) : undefined,
  };
}

const IMAGE_SRC = /^\/[a-z0-9/_.-]+\.(jpe?g|png|webp|avif|gif)$/i;

export async function runChecks(
  d: EditorData,
  intent: Intent,
  ctx: { existingSlugs: string[]; hasUpload: boolean },
): Promise<Check[]> {
  const out: Check[] = [];
  const pass = (label: string) => out.push({ level: 'pass', label });
  const warn = (label: string) => out.push({ level: 'warn', label });
  const fail = (label: string) => out.push({ level: 'error', label });

  const slug = d.slug.trim();
  const meta = toMeta(d, intent);
  // An upload supplies src, width and height on save; check the rest as if it had.
  const probe = ctx.hasUpload && meta.image === undefined
    ? { ...meta, image: { src: '/blog/upload.jpg', alt: d.image.alt.trim(), width: 1, height: 1 } }
    : ctx.hasUpload && meta.image ? { ...meta, image: { ...meta.image, width: meta.image.width || 1, height: meta.image.height || 1 } }
    : meta;

  // Slug
  if (!SLUG.test(slug)) fail('Slug must be lowercase words separated by hyphens');
  else if (slug !== d.originalSlug && ctx.existingSlugs.includes(slug)) fail(`An article with the slug "${slug}" already exists`);
  else if (d.originalSlug && slug !== d.originalSlug && d.wasPublished) fail('A published article keeps its slug — changing it would break its URL and any links to it');
  else pass('Slug valid');

  // The blog model's own rules, worded for the editor.
  for (const p of problems(slug || 'x', probe)) fail(p.charAt(0).toUpperCase() + p.slice(1));

  if (meta.title) pass('Title present');
  if (meta.title.length > 60) warn(`Title is ${meta.title.length} characters — search results usually show about 60`);

  const dl = meta.description.length;
  if (dl) {
    if (dl < 140 || dl > 160) warn(`Description is ${dl} characters — aim for 140–160`);
    else pass(`Description length good (${dl})`);
  }
  if (meta.excerpt && meta.excerpt.length > dl && dl) warn('Excerpt is longer than the description');
  if (meta.category) pass('Category valid');

  // Image
  const img = probe.image;
  if (img) {
    if (!IMAGE_SRC.test(img.src) || img.src.includes('..')) fail('Image path must be a site image like /blog/slug/cover.jpg');
    else pass('Featured image present');
    if (img.alt) pass('Image alt text present'); else fail('Featured image needs alt text');
  } else if (intent === 'draft') warn('No featured image yet — required before publishing');

  // Canonical
  if (meta.canonical) {
    let ok = false;
    try { ok = new URL(meta.canonical).protocol === 'https:'; } catch {}
    if (!ok) fail('Canonical URL must be a full https:// address');
    else if (meta.canonical !== `${SITE_URL}/blog/${slug}`) warn('Canonical points elsewhere — only right for articles first published on another site');
    else pass('Canonical valid');
  } else pass('Canonical: defaults to the article’s own URL');

  // Brief
  if (meta.primaryKeyword) {
    pass('Primary keyword present');
    const k = meta.primaryKeyword.toLowerCase();
    if (!meta.title.toLowerCase().includes(k) && !meta.description.toLowerCase().includes(k)) {
      warn('Primary keyword appears in neither the title nor the description');
    }
  } else warn('No primary keyword set');

  // Body
  const body = d.body.trim();
  if (!body) fail('The article body is empty');
  const safety = bodyProblems(body);
  safety.forEach(fail);
  if (!safety.length && body) {
    const err = await compileProblem(body);
    if (err) fail(err); else pass('MDX valid');
  }
  if (/^#\s/m.test(body)) warn('A "#" heading will show as H2 — the title is the only H1. Start sections at ##');
  if (body && !/^##\s/m.test(body)) warn('No ## section headings');

  // Internal links
  const internal = /\]\((\/(?!\/)[^)]*)\)/.test(body) || /\]\(https:\/\/www\.vioniche\.com/.test(body);
  const linked = internal || (meta.related?.length ?? 0) > 0 || (meta.caseStudies?.length ?? 0) > 0 || (meta.services?.length ?? 0) > 0;
  if (!linked) warn('No internal links');
  else pass('Internal links present');
  const missing = (meta.related ?? []).filter((s) => !ctx.existingSlugs.includes(s));
  if (missing.length) warn(`Related article not found: ${missing.join(', ')}`);

  // Most serious first, so the editor reads top-down.
  const rank = { error: 0, warn: 1, pass: 2 } as const;
  return out.sort((a, b) => rank[a.level] - rank[b.level]);
}

export const blocking = (checks: Check[]) => checks.some((c) => c.level === 'error');
