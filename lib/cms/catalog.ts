import { measure } from '@/lib/blog/measure';
import type { Post, PostMeta } from '@/lib/blog/model';
import { parseArticle } from './mdx-file';
import type { Store } from './store';

/**
 * Every article in the store, parsed. A file that does not parse is still
 * listed, with its error, so it can be found and fixed rather than vanishing.
 */
export type Entry = {
  slug: string;
  version: string;
  source: string;
  meta: Partial<PostMeta>;
  body: string;
  error?: string;
};

export async function catalog(store: Store): Promise<Entry[]> {
  const files = await store.list();
  return files
    .map((f): Entry => {
      try {
        const { meta, body } = parseArticle(f.source);
        return { slug: f.slug, version: f.version, source: f.source, meta, body };
      } catch (e) {
        return { slug: f.slug, version: f.version, source: f.source, meta: {}, body: '', error: String((e as Error).message) };
      }
    })
    .sort((a, b) => (b.meta.updated ?? b.meta.published ?? '').localeCompare(a.meta.updated ?? a.meta.published ?? ''));
}

export const asPost = (slug: string, meta: PostMeta, source: string): Post => ({
  ...meta, slug, url: `/blog/${slug}`, ...measure(source),
});

/** Same choice as the public site's getRelated: the author's picks, then the same category; published only. */
export function relatedFor(post: Post, entries: Entry[], n = 3): Post[] {
  const all = entries
    .filter((e) => !e.error && !e.meta.draft && e.slug !== post.slug && e.meta.title)
    .map((e) => asPost(e.slug, e.meta as PostMeta, e.source));
  const chosen = (post.related ?? []).map((s) => all.find((p) => p.slug === s)).filter((p): p is Post => Boolean(p));
  return [...chosen, ...all.filter((p) => p.category === post.category && !chosen.includes(p))].slice(0, n);
}

/** What the editor needs to know about other articles — never their bodies or sources. */
export const catalogItems = (entries: Entry[], except?: string) =>
  entries
    .filter((e) => !e.error && e.slug !== except)
    .map((e) => ({
      slug: e.slug,
      title: e.meta.title ?? e.slug,
      draft: Boolean(e.meta.draft),
      category: e.meta.category,
      tags: e.meta.tags ?? [],
      primaryKeyword: e.meta.primaryKeyword,
      description: e.meta.description,
    }));
