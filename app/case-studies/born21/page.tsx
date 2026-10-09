import type { Metadata } from 'next';
import Nav from '@/components/Nav';
import Footer from '@/components/Footer';
import BackToTop from '@/components/BackToTop';
import SiteEffects from '@/components/SiteEffects';
import Born21Hero from '@/components/case-studies/born21/Born21Hero';
import Born21Overview from '@/components/case-studies/born21/Born21Overview';
import Born21Challenge from '@/components/case-studies/born21/Born21Challenge';
import Born21Build from '@/components/case-studies/born21/Born21Build';
import Born21System from '@/components/case-studies/born21/Born21System';
import Born21Content from '@/components/case-studies/born21/Born21Content';
import Born21TechnicalSEO from '@/components/case-studies/born21/Born21TechnicalSEO';
import Born21Deployment from '@/components/case-studies/born21/Born21Deployment';
import Born21SearchConsole from '@/components/case-studies/born21/Born21SearchConsole';
import Born21Established from '@/components/case-studies/born21/Born21Established';
import Born21Role from '@/components/case-studies/born21/Born21Role';
import CaseCta from '@/components/case-studies/CaseCta';
import JsonLd from '@/components/JsonLd';
import { ORGANIZATION } from '@/lib/site';
import '@/components/case-studies/case-study.css';

/**
 * The canonical is relative and resolves against the layout's metadataBase,
 * so this page is https://www.vioniche.com/case-studies/born21 without the
 * domain being written down a second time.
 */
const TITLE = 'Born21 Case Study — Website Development & Technical SEO | Vioniche';
const DESCRIPTION =
  'Born21 case study: how Vioniche delivered website development, technical SEO, Ghost CMS content infrastructure and automated deployment to Hostinger.';
const PAGE_URL = 'https://www.vioniche.com/case-studies/born21';

/**
 * The social preview is the live Born21 homepage, cropped to 1200×630 from
 * the same capture the hero uses — the work itself, not a generated card.
 */
const OG_IMAGE = {
  url: '/case-studies/born21/og.jpg',
  width: 1200,
  height: 630,
  alt: 'The Born21 homepage, headed “We build brands that outlast algorithms.”',
};

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: {
    canonical: '/case-studies/born21',
  },
  openGraph: {
    type: 'article',
    url: '/case-studies/born21',
    siteName: 'Vioniche',
    title: TITLE,
    description: DESCRIPTION,
    images: [OG_IMAGE],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@vionicheweb',
    title: TITLE,
    description: DESCRIPTION,
    images: [OG_IMAGE],
  },
};

/**
 * Structured data, limited to what the page itself states: what it is, who
 * published it, who it is about, and what the work covered. No ratings,
 * reviews, dates or performance figures — there are none to report.
 *
 * The breadcrumb has two levels because there is no case-study index route;
 * inventing a /case-studies URL for it would point Google at a 404.
 */
const VIONICHE = ORGANIZATION;

const JSON_LD = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Article',
      '@id': `${PAGE_URL}#article`,
      headline: 'Born21 Case Study — Website Development & Technical SEO',
      description: DESCRIPTION,
      url: PAGE_URL,
      mainEntityOfPage: PAGE_URL,
      image: `https://www.vioniche.com${OG_IMAGE.url}`,
      inLanguage: 'en',
      author: { '@id': VIONICHE['@id'] },
      publisher: VIONICHE,
      about: {
        '@type': 'Organization',
        name: 'Born21',
        url: 'https://born21.com/',
      },
      keywords: [
        'Website development',
        'Technical SEO',
        'Content infrastructure',
        'Ghost CMS',
        'GitHub Actions',
        'Deployment automation',
        'Google Search Console',
      ],
    },
    {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Vioniche', item: 'https://www.vioniche.com/' },
        { '@type': 'ListItem', position: 2, name: 'Born21 Case Study', item: PAGE_URL },
      ],
    },
  ],
};

/**
 * Every claim on this page comes from the Born21 case-study brief, the Born21
 * repository (its deployment workflow, Ghost integration and commit history)
 * or the Search Console screenshots shown on it. There are no traffic, ranking
 * or revenue figures because none exist yet; the page says so instead.
 */
export default function Born21CaseStudy() {
  return (
    <>
      <JsonLd data={JSON_LD} />
      <Nav base="/" />
      <span id="top" />
      <main>
        <Born21Hero />
        <Born21Overview />
        <Born21Challenge />
        <Born21Build />
        <Born21System />
        <Born21Content />
        <Born21TechnicalSEO />
        <Born21Deployment />
        <Born21SearchConsole />
        <Born21Established />
        <Born21Role />
        <CaseCta />
      </main>
      <Footer base="/" />
      <BackToTop />
      <SiteEffects />
    </>
  );
}
