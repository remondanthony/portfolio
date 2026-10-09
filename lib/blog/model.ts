/**
 * The blog's content model.
 *
 * Each article is one MDX file in content/blog/, named after its slug, that
 * exports its metadata as `export const post = { ... }`. This file defines
 * that shape and checks it at build time, so a missing description or a
 * misspelled category stops the build with a clear message instead of
 * shipping a page with half its SEO missing.
 *
 * Fields fall into three groups:
 *
 *   Published   title, description, excerpt, dates, category, tags, image —
 *               rendered on the page and in metadata.
 *   Linking     related, caseStudies, services — the internal links an
 *               article carries. Real routes only; see links.ts.
 *   Planning    primaryKeyword, secondaryKeywords, searchIntent — the brief
 *               the article was written to. Never rendered, never emitted as
 *               meta keywords; kept with the article for SEO review.
 */

import type { CaseStudyKey, ServiceKey } from './links';
import { ctaProblems, type CtaOverride } from './cta';

export const CATEGORIES = [
  'Website Development',
  'Technical SEO',
  'Automation',
  'AI & AI Agents',
  'Web Technology',
] as const;
export type Category = (typeof CATEGORIES)[number];

/**
 * Authors are entries here, not free text, so a byline and its structured
 * data always agree. Only Vioniche exists for now: no individual names or
 * credentials are claimed until someone chooses to sign their work.
 */
export const AUTHORS = {
  vioniche: { name: 'Vioniche', type: 'Organization' as const },
};
export type AuthorKey = keyof typeof AUTHORS;

export type SearchIntent = 'informational' | 'commercial' | 'transactional' | 'navigational';

export type PostMeta = {
  title: string;
  /** Meta description and the article's standfirst. Aim for 140–160 characters. */
  description: string;
  /** Card text on the blog index. Shorter than the description. */
  excerpt: string;
  /** ISO dates, YYYY-MM-DD. */
  published: string;
  updated?: string;
  author: AuthorKey;
  category: Category;
  tags: string[];
  /** Required once published. Lives in public/blog/<slug>/. */
  image?: { src: string; alt: string; width: number; height: number };
  /** Only for an article first published elsewhere. Defaults to its own URL. */
  canonical?: string;
  /** Drafts are never built in production, listed, or added to the sitemap. */
  draft?: boolean;

  related?: string[];
  caseStudies?: CaseStudyKey[];
  services?: ServiceKey[];

  /** The popup CTA. Omit for the default; see lib/blog/cta.ts. */
  cta?: CtaOverride;

  primaryKeyword?: string;
  secondaryKeywords?: string[];
  searchIntent?: SearchIntent;
};

export type Post = PostMeta & {
  slug: string;
  url: string;
  readingMinutes: number;
  wordCount: number;
};

export const DATE = /^\d{4}-\d{2}-\d{2}$/;
export const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/**
 * Every rule an article must meet, as a list. The build (validate, below)
 * and the admin CMS both use this, so the editor can never accept an article
 * the build would reject.
 */
export function problems(slug: string, meta: unknown): string[] {
  const m = meta as Partial<PostMeta> | undefined;
  if (!m || typeof m !== 'object') return ['missing `export const post = { ... }`'];

  const problems: string[] = [];
  const need = (ok: unknown, msg: string) => { if (!ok) problems.push(msg); };

  need(SLUG.test(slug), 'file name must be a lowercase, hyphenated slug');
  need(m.title?.trim(), 'title is required');
  need(m.description?.trim(), 'description is required');
  need(m.excerpt?.trim(), 'excerpt is required');
  need(m.published && DATE.test(m.published), 'published must be YYYY-MM-DD');
  need(!m.updated || DATE.test(m.updated), 'updated must be YYYY-MM-DD');
  need(!m.updated || !m.published || m.updated >= m.published, 'updated cannot be before published');
  need(m.author && m.author in AUTHORS, `author must be one of: ${Object.keys(AUTHORS).join(', ')}`);
  need(m.category && (CATEGORIES as readonly string[]).includes(m.category), `category must be one of: ${CATEGORIES.join(', ')}`);
  need(Array.isArray(m.tags), 'tags must be an array');
  if (!m.draft) {
    need(m.image?.src && m.image.alt?.trim() && m.image.width && m.image.height,
      'a published article needs image { src, alt, width, height }');
  }

  problems.push(...ctaProblems(m.cta));

  return problems;
}

/** Throws with the file name and every problem found, not just the first. */
export function validate(slug: string, meta: unknown): PostMeta {
  const found = problems(slug, meta);
  if (found.length) throw new Error(`content/blog/${slug}.mdx:\n  - ${found.join('\n  - ')}`);
  return meta as PostMeta;
}
