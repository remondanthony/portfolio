import { CATEGORIES } from '@/lib/blog/model';
import type { EditorData } from './types';

/**
 * SEO readiness: a plain checklist of what a well-prepared article has.
 * Not a score and not a prediction — just whether the pieces are in place.
 * Advisory only: the server's Check (lib/cms/article.ts runChecks) remains
 * the authority on what can be saved and published.
 *
 * Runs in the browser on every keystroke, so it is a pure function of the
 * editor's fields with no network calls.
 */

export type ReadyItem = { ok: boolean; label: string; note?: string };

const INTERNAL_LINK = /\]\((\/(?!\/)[^)]*|https:\/\/www\.vioniche\.com[^)]*)\)/;

export function readiness(d: EditorData, hasUpload: boolean): ReadyItem[] {
  const title = d.title.trim();
  const desc = d.description.trim().length;
  const body = d.body;
  const hasImage = hasUpload || Boolean(d.image.src.trim());
  const keyword = d.primaryKeyword.trim().toLowerCase();
  const canonical = d.canonical.trim();
  let canonicalOk = !canonical;
  if (canonical) { try { canonicalOk = new URL(canonical).protocol === 'https:'; } catch {} }

  return [
    { ok: Boolean(title) && title.length <= 60, label: 'Title', note: !title ? 'Missing' : title.length > 60 ? `${title.length} characters — results show about 60` : undefined },
    { ok: desc >= 140 && desc <= 160, label: 'Meta description', note: !desc ? 'Missing' : desc < 140 || desc > 160 ? `${desc} characters — aim for 140–160` : undefined },
    { ok: Boolean(d.excerpt.trim()), label: 'Excerpt', note: d.excerpt.trim() ? undefined : 'Missing' },
    {
      ok: /^##\s/m.test(body) && !/^#\s/m.test(body),
      label: 'Heading structure',
      note: /^#\s/m.test(body) ? 'A "#" heading — the title is the only H1; start sections at ##' : !/^##\s/m.test(body) ? 'No ## section headings' : undefined,
    },
    { ok: canonicalOk, label: 'Canonical', note: canonical ? (canonicalOk ? undefined : 'Must be a full https:// address') : undefined },
    { ok: hasImage, label: 'Featured image', note: hasImage ? undefined : 'Required before publishing' },
    { ok: hasImage && Boolean(d.image.alt.trim()), label: 'Image ALT text', note: hasImage && !d.image.alt.trim() ? 'Describe what the image shows' : undefined },
    { ok: (CATEGORIES as readonly string[]).includes(d.category), label: 'Category' },
    { ok: d.tags.length > 0, label: 'Tags', note: d.tags.length ? undefined : 'None yet' },
    {
      ok: Boolean(keyword) && (title.toLowerCase().includes(keyword) || d.description.toLowerCase().includes(keyword)),
      label: 'Primary keyword',
      note: !keyword ? 'Not set' : 'Not in the title or description',
    },
    {
      ok: INTERNAL_LINK.test(body) || d.services.length > 0 || d.caseStudies.length > 0 || d.related.length > 0,
      label: 'Internal links',
      note: 'No links to other Vioniche pages yet',
    },
    { ok: d.related.length > 0 || d.caseStudies.length > 0, label: 'Related content', note: 'No related article or case study chosen' },
  ].map((i) => (i.ok ? { ok: true, label: i.label } : i));
}
