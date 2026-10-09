import type { Metadata } from 'next';
import { ORGANIZATION, SITE_URL } from './site';

/**
 * The four service pages, in the order the work usually happens: a website,
 * then search, then the workflows around it, then AI where it helps.
 *
 * One list, read by the nav, the footer, the homepage's What we do rows, the
 * chain at the top of each service page and the blog's link registry — so a
 * page is added or renamed here once.
 */
export const SERVICE_PAGES = [
  {
    key: 'web-development',
    href: '/services/web-development',
    name: 'Web Development',
    short: 'Fast, maintainable websites built to be found and to convert.',
  },
  {
    key: 'seo',
    href: '/services/seo',
    name: 'SEO',
    short: 'Technical SEO, site structure and content that search engines can read.',
  },
  {
    key: 'automation',
    href: '/services/automation',
    name: 'Automation',
    short: 'Repetitive work turned into reliable, monitored workflows.',
  },
  {
    key: 'ai-automation',
    href: '/services/ai-automation',
    name: 'AI Automation',
    short: 'AI added to real workflows, with people approving what matters.',
  },
] as const;

export type ServicePageKey = (typeof SERVICE_PAGES)[number]['key'];

export const servicePage = (key: ServicePageKey) => SERVICE_PAGES.find((s) => s.key === key)!;

/* ---------- metadata and structured data ---------- */


/**
 * Title, description, canonical, Open Graph and Twitter for a service page,
 * in the shape the Born21 case study uses. The canonical is relative and
 * resolves against the root layout's metadataBase.
 *
 * There is no image: the site has no generic social card yet (the homepage
 * has none either), and a stretched or unrelated picture is worse than a
 * plain link preview.
 */
export function serviceMetadata(key: ServicePageKey, title: string, description: string): Metadata {
  const { href } = servicePage(key);
  return {
    title,
    description,
    alternates: { canonical: href },
    openGraph: { type: 'website', url: href, siteName: 'Vioniche', title, description },
    twitter: { card: 'summary', site: '@vionicheweb', title, description },
  };
}

/**
 * A Service provided by Vioniche, and the page's breadcrumb — nothing the
 * page does not show. No offers, prices, ratings or reviews: there are none
 * to state.
 *
 * Two breadcrumb levels, as on the case study: there is no /services page,
 * and a crumb pointing at one would send Google to a 404.
 */
export function serviceJsonLd(key: ServicePageKey, o: { name: string; serviceType: string; description: string }) {
  const url = `${SITE_URL}${servicePage(key).href}`;
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Service',
        '@id': `${url}#service`,
        name: o.name,
        serviceType: o.serviceType,
        description: o.description,
        url,
        provider: ORGANIZATION,
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Vioniche', item: `${SITE_URL}/` },
          { '@type': 'ListItem', position: 2, name: o.name, item: url },
        ],
      },
    ],
  };
}
