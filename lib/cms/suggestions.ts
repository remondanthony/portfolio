import { CASE_STUDIES, SERVICES } from '@/lib/blog/links';
import type { EditorData } from './types';

/**
 * Internal-link suggestions for the article being written.
 *
 * Deterministic and local: the article's title, keywords, tags and category
 * are compared with the titles and descriptions of what actually exists — the
 * published articles in the catalog, the case studies and the service
 * destinations in lib/blog/links.ts. Nothing is invented and nothing is
 * inserted unless the admin chooses it.
 */

export type CatalogItem = {
  slug: string;
  title: string;
  draft: boolean;
  category?: string;
  tags?: string[];
  primaryKeyword?: string;
  description?: string;
};

export type LinkSuggestion = { title: string; href: string; kind: 'Article' | 'Case study' | 'Vioniche'; reason: string };

const STOP = new Set(['the', 'and', 'for', 'you', 'your', 'are', 'our', 'can', 'how', 'why', 'its', 'was', 'not', 'but',
  'all', 'any', 'has', 'get', 'out', 'new', 'one', 'use', 'who', 'way', 'about', 'after', 'also', 'from', 'have', 'into', 'more', 'most', 'that', 'than', 'their', 'them',
  'then', 'there', 'these', 'they', 'this', 'what', 'when', 'where', 'which', 'while', 'with', 'your', 'yours', 'will',
  'should', 'could', 'would', 'every', 'just', 'need', 'needs', 'make', 'makes', 'built', 'build']);

const words = (...parts: (string | undefined)[]) =>
  new Set(parts.join(' ').toLowerCase().split(/[^a-z0-9]+/).filter((w) => w.length >= 3 && !STOP.has(w)));

export function suggestLinks(d: EditorData, catalog: CatalogItem[], max = 6): LinkSuggestion[] {
  const mine = words(d.title, d.primaryKeyword, d.secondaryKeywords.join(' '), d.tags.join(' '), d.category);
  const linked = (href: string) => d.body.includes(`](${href})`);
  const shared = (other: Set<string>) => [...mine].filter((w) => other.has(w));

  const scored: (LinkSuggestion & { score: number })[] = [];

  for (const a of catalog) {
    // Drafts are not public; the article cannot link to itself.
    if (a.draft || a.slug === d.slug || a.slug === d.originalSlug) continue;
    const href = `/blog/${a.slug}`;
    if (linked(href) || d.related.includes(a.slug)) continue;
    const common = shared(words(a.title, a.primaryKeyword, a.tags?.join(' '), a.description));
    const sameCategory = Boolean(a.category && a.category === d.category);
    const score = common.length + (sameCategory ? 2 : 0);
    if (score > 0) {
      scored.push({ title: a.title, href, kind: 'Article', score,
        reason: [sameCategory && 'Same category', common.length && `Shares: ${common.slice(0, 3).join(', ')}`].filter(Boolean).join(' · ') });
    }
  }

  type Dest = { href: string; title: string; text: string; kind: LinkSuggestion['kind']; chosen: boolean };
  const fixed: Dest[] = [
    ...Object.entries(CASE_STUDIES).map(([k, c]): Dest => ({ ...c, kind: 'Case study', chosen: d.caseStudies.includes(k) })),
    ...Object.entries(SERVICES).map(([k, s]): Dest => ({ ...s, kind: 'Vioniche', chosen: d.services.includes(k) })),
  ];
  const general: LinkSuggestion[] = [];
  for (const { chosen, kind, ...dest } of fixed) {
    if (chosen || linked(dest.href)) continue;
    const common = shared(words(dest.title, dest.text));
    const s = { title: dest.title, href: dest.href, kind };
    if (common.length) scored.push({ ...s, score: common.length, reason: `Shares: ${common.slice(0, 3).join(', ')}` });
    else general.push({ ...s, reason: 'General Vioniche page' });
  }

  const best = scored.sort((a, b) => b.score - a.score).slice(0, max).map(({ score: _score, ...s }) => s);
  // Always offer something useful, but say plainly when it is not a close match.
  return best.length >= 3 ? best : [...best, ...general].slice(0, Math.max(3, best.length));
}
