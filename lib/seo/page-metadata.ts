import type { Metadata } from 'next';
import data from '@/content/seo/pages.json';
import { SITE_ORIGIN, pagesFileProblems, seoPage, type PageSeo, type PagesSeoFile, type SeoPageKey } from './content';

/**
 * CMS SEO overrides for the code-built pages, merged into each page's own
 * metadata at build time.
 *
 * The file is imported, not fetched: it is bundled into the static build, so
 * the public site makes no request for it and nothing about the CMS reaches
 * the browser beyond the meta tags themselves. A CMS save commits the file
 * and Vercel rebuilds — the same path as an article.
 *
 * With no overrides saved, a page's metadata is returned unchanged: every
 * title, description and canonical written in code stays exactly as it is.
 * A malformed file stops the build with a clear message, as an article does.
 */
const file = data as unknown as PagesSeoFile;
const problems = pagesFileProblems(file);
if (problems.length) throw new Error(`content/seo/pages.json:\n  - ${problems.join('\n  - ')}`);

export const pageSeo = (key: SeoPageKey): PageSeo => file.pages[key] ?? {};

/** Whether the page asked to be left out of search (and so out of the sitemap). */
export function excludedFromSitemap(key: SeoPageKey) {
  const s = pageSeo(key);
  return Boolean(s.noindex) || (Boolean(s.canonical) && s.canonical !== `${SITE_ORIGIN}${seoPage(key).path === '/' ? '/' : seoPage(key).path}`);
}

const plainTitle = (t: Metadata['title']) => (typeof t === 'string' ? t : t && typeof t === 'object' && 'absolute' in t ? t.absolute : undefined);

export function withPageSeo(key: SeoPageKey, base: Metadata): Metadata {
  const s = pageSeo(key);
  const title = s.seoTitle?.trim() || undefined;
  const description = s.metaDescription?.trim() || undefined;
  const ogTitle = s.ogTitle?.trim() || title;
  const ogDescription = s.ogDescription?.trim() || description;
  const image = s.ogImage;
  if (!title && !description && !s.canonical && !s.noindex && !s.nofollow && !ogTitle && !ogDescription && !image) return base;

  const out: Metadata = { ...base };
  if (title) out.title = title;
  if (description) out.description = description;
  if (s.canonical) out.alternates = { ...base.alternates, canonical: s.canonical };
  if (s.noindex || s.nofollow) out.robots = { index: !s.noindex, follow: !s.nofollow };

  if (ogTitle || ogDescription || image || s.canonical || title || description) {
    const og: NonNullable<Metadata['openGraph']> = base.openGraph ?? { type: 'website', url: seoPage(key).path, siteName: 'Vioniche' };
    out.openGraph = {
      ...og,
      title: ogTitle ?? og.title ?? plainTitle(out.title),
      description: ogDescription ?? og.description ?? out.description ?? undefined,
      ...(s.canonical && { url: s.canonical }),
      ...(image && { images: [{ url: image }] }),
    };
    const tw: NonNullable<Metadata['twitter']> = base.twitter ?? { card: 'summary', site: '@vionicheweb' };
    out.twitter = {
      ...tw,
      ...(image && { card: 'summary_large_image' as const, images: [image] }),
      title: ogTitle ?? tw.title ?? plainTitle(out.title),
      description: ogDescription ?? tw.description ?? out.description ?? undefined,
    } as Metadata['twitter'];
  }
  return out;
}
