import type { MetadataRoute } from 'next';
import { getPosts } from '@/lib/blog/posts';
import { SITE_URL } from '@/lib/site';

/**
 * Served at https://www.vioniche.com/sitemap.xml.
 *
 * The homepage is one page. Work, Services, Process, About and Contact are
 * sections of it reached by #hash, and a hash is not a separate URL to a
 * crawler, so none of them are listed. /api/contact is a form endpoint, not a
 * page. Add an entry here only when a real route is added under app/.
 *
 * lastModified is a fixed date, not new Date(): a timestamp that moves on
 * every deploy tells Google the page changed when it didn't, and Google learns
 * to ignore it. Bump it when the page's content actually changes. Articles
 * carry their own dates, so they need no bumping here.
 *
 * getPosts() returns published articles only in a production build; drafts
 * never reach the sitemap.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const posts = await getPosts();
  const newest = posts[0];

  return [
    {
      url: `${SITE_URL}/`,
      lastModified: new Date('2026-08-07'),
      changeFrequency: 'monthly',
      priority: 1,
    },
    {
      // No trailing slash: matches the page's canonical exactly.
      url: `${SITE_URL}/case-studies/born21`,
      lastModified: new Date('2026-10-09'),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/blog`,
      // The index changes when an article is published or revised.
      lastModified: new Date(newest ? (newest.updated ?? newest.published) : '2026-10-09'),
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    ...posts
      .filter((p) => !p.canonical || p.canonical === `${SITE_URL}${p.url}`)
      .map((p) => ({
        url: `${SITE_URL}${p.url}`,
        lastModified: new Date(p.updated ?? p.published),
        changeFrequency: 'monthly' as const,
        priority: 0.6,
      })),
  ];
}
