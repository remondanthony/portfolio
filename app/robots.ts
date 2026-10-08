import type { MetadataRoute } from 'next';

/**
 * Served at https://vioniche.com/robots.txt.
 *
 * Everything is crawlable except /api/, which only holds the contact form
 * endpoint. CSS, JS, fonts and images are deliberately left open — Google
 * renders the page before indexing it and needs them to do so.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: '/api/',
    },
    sitemap: 'https://vioniche.com/sitemap.xml',
  };
}
