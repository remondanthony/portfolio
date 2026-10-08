import type { MetadataRoute } from 'next';

/**
 * Served at https://vioniche.com/sitemap.xml.
 *
 * The site is one page. Work, Services, Process, About and Contact are
 * sections of it reached by #hash, and a hash is not a separate URL to a
 * crawler, so none of them are listed. /api/contact is a form endpoint, not a
 * page. Add an entry here only when a real route is added under app/.
 *
 * lastModified is a fixed date, not new Date(): a timestamp that moves on
 * every deploy tells Google the page changed when it didn't, and Google learns
 * to ignore it. Bump it when the page's content actually changes.
 */
const SITE_URL = 'https://vioniche.com';

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: SITE_URL,
      lastModified: new Date('2026-08-07'),
      changeFrequency: 'monthly',
      priority: 1,
    },
  ];
}
