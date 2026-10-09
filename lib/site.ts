/**
 * Facts about the site that more than one route states: the canonical
 * origin, and Vioniche as an organisation for structured data.
 *
 * The social profiles are the ones linked in the footer; nothing here is
 * claimed that the site does not already show.
 */
export const SITE_URL = 'https://www.vioniche.com';

export const ORGANIZATION = {
  '@type': 'Organization',
  '@id': `${SITE_URL}/#organization`,
  name: 'Vioniche',
  url: `${SITE_URL}/`,
  logo: `${SITE_URL}/logo.png`,
  sameAs: [
    'https://x.com/vionicheweb',
    'https://www.instagram.com/vioniche1',
    'https://www.linkedin.com/company/135774364/',
  ],
} as const;

/** Absolute URL for a site path, for structured data and Open Graph. */
export const absolute = (path: string) => `${SITE_URL}${path.startsWith('/') ? path : `/${path}`}`;
