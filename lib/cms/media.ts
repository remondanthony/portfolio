import type { Entry } from './catalog';

/**
 * Where each CMS image is used. Read from the articles themselves on every
 * request, so it is never out of date and needs nothing stored.
 *
 * An image counts as used when its public path (/blog/<folder>/<file>)
 * appears in an article:
 *   featured   meta.image.src
 *   in article anywhere else in the file — <Figure src>, Markdown ![](…),
 *              a link to it, the CTA override's image — any form that
 *              names the path, including a full https://… URL
 *
 * Matching the path rather than parsing each syntax means a reference in a
 * form added later is still seen. It can over-report (a path quoted in
 * prose counts as a use), which is the safe direction: "Unused" is only
 * shown when no article mentions the image at all.
 */
export type ImageUsage = {
  /** Articles whose featured image this is. */
  featured: string[];
  /** Articles that use it anywhere other than the featured image. */
  used: string[];
};

const REF = /\/blog\/([a-z0-9]+(?:-[a-z0-9]+)*)\/([a-z0-9]+(?:-[a-z0-9]+)*\.(?:jpg|png|webp))(?![a-z0-9.-])/g;

/** Image paths an article mentions, as /blog/<folder>/<file>. */
export function referencedImages(entry: Pick<Entry, 'source' | 'meta'>): { featured?: string; all: Set<string> } {
  const all = new Set<string>();
  for (const m of entry.source.matchAll(REF)) all.add(`/blog/${m[1]}/${m[2]}`);
  const src = entry.meta.image?.src;
  return { featured: typeof src === 'string' ? src.replace(/^https?:\/\/[^/]+/, '') : undefined, all };
}

/** Usage for each image src (/blog/<folder>/<file>). */
export function imageUsage(srcs: string[], entries: Entry[]): Record<string, ImageUsage> {
  const out: Record<string, ImageUsage> = Object.fromEntries(srcs.map((s) => [s, { featured: [], used: [] }]));
  for (const e of entries) {
    const { featured, all } = referencedImages(e);
    if (featured && out[featured]) out[featured].featured.push(e.slug);
    // The featured path can also appear in the body; count that as a body use
    // only when it occurs more than in the image meta itself.
    for (const src of all) {
      if (!out[src]) continue;
      if (src === featured && occurrences(e.source, src) <= 1) continue;
      out[src].used.push(e.slug);
    }
  }
  return out;
}

const occurrences = (text: string, needle: string) => text.split(needle).length - 1;
