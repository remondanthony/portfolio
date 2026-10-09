import fs from 'node:fs';
import path from 'node:path';
import { cache, type ComponentType } from 'react';
import { validate, type Post } from './model';
import { measure } from './measure';

/**
 * Reads the articles in content/blog/.
 *
 * Runs only on the server, at build time: every blog route is statically
 * generated, so none of this — and none of the MDX — reaches the browser as
 * JavaScript.
 *
 * Files whose names start with "_" are notes for writers (the template), not
 * articles. Drafts are visible in `next dev`, so they can be reviewed in
 * place, and absent from a production build: not listed, not routed, not in
 * the sitemap.
 */

const DIR = path.join(process.cwd(), 'content', 'blog');
const SHOW_DRAFTS = process.env.NODE_ENV === 'development';

type Module = { default: ComponentType; post: unknown };

const files = () =>
  fs.existsSync(DIR)
    ? fs.readdirSync(DIR).filter((f) => f.endsWith('.mdx') && !f.startsWith('_')).map((f) => f.slice(0, -4))
    : [];

const load = cache(async (slug: string): Promise<{ post: Post; Content: ComponentType } | null> => {
  const file = path.join(DIR, `${slug}.mdx`);
  if (slug.startsWith('_') || !fs.existsSync(file)) return null;

  const mod: Module = await import(`../../content/blog/${slug}.mdx`);
  const meta = validate(slug, mod.post);
  if (meta.draft && !SHOW_DRAFTS) return null;

  return {
    post: { ...meta, slug, url: `/blog/${slug}`, ...measure(fs.readFileSync(file, 'utf8')) },
    Content: mod.default,
  };
});

/** Newest first. Published articles only, plus drafts in development. */
export const getPosts = cache(async (): Promise<Post[]> => {
  const loaded = await Promise.all(files().map(load));
  return loaded
    .filter((x): x is NonNullable<typeof x> => x !== null)
    .map((x) => x.post)
    .sort((a, b) => b.published.localeCompare(a.published) || a.title.localeCompare(b.title));
});

export const getPost = load;

/**
 * Up to `n` articles to read next: the ones the author chose first, then the
 * newest in the same category. Never the article itself.
 */
export async function getRelated(post: Post, n = 3): Promise<Post[]> {
  const all = (await getPosts()).filter((p) => p.slug !== post.slug);
  const chosen = (post.related ?? [])
    .map((s) => all.find((p) => p.slug === s))
    .filter((p): p is Post => Boolean(p));
  const sameCategory = all.filter((p) => p.category === post.category && !chosen.includes(p));
  return [...chosen, ...sameCategory].slice(0, n);
}
