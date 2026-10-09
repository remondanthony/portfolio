import type { Metadata } from 'next';
import Flow from '@/components/case-studies/Flow';
import Shot from '@/components/case-studies/Shot';
import ServiceShell from '@/components/services/ServiceShell';
import ServiceHero from '@/components/services/ServiceHero';
import ServiceFaq from '@/components/services/ServiceFaq';
import ServiceLinks from '@/components/services/ServiceLinks';
import { serviceJsonLd, serviceMetadata } from '@/lib/services';

/**
 * SEO — for a business that wants to be found in search.
 *
 * Born21 is used as the example of the workflow (sitemap, canonicals,
 * metadata, Search Console), and only that: the case study itself states that
 * search performance is still being measured, so no ranking, traffic or
 * backlink result is claimed here. The Search Console screenshot is the same
 * one the case study shows, with the same caption.
 */
const TITLE = 'SEO Services — Technical SEO & Content Strategy | Vioniche';
const DESCRIPTION =
  'SEO services built on a technical foundation: site architecture, metadata, structured data, content strategy and ongoing Search Console monitoring.';

export const metadata: Metadata = serviceMetadata('seo', TITLE, DESCRIPTION);

const PROBLEMS = [
  ['Pages that cannot be found', 'Missing from the sitemap, blocked by robots rules, or only reachable through a script search engines do not run.'],
  ['The same page at several addresses', 'www and non-www, with and without a trailing slash, with tracking parameters — splitting one page’s signals several ways.'],
  ['Metadata that says nothing', 'The same title on every page, or none at all, so search results cannot tell people what a page is.'],
  ['No structure', 'Pages with no clear relationship to each other, so neither search engines nor visitors can tell what matters most.'],
];

const LAYERS = [
  { name: 'Technical foundation', note: 'Crawlable, indexable, fast' },
  { name: 'Content architecture', note: 'Pages mapped to what people search' },
  { name: 'Search visibility', note: 'Pages shown for relevant searches' },
  { name: 'Ongoing optimisation', note: 'Measured, improved, repeated' },
];

const HANDLES = [
  ['Technical SEO', 'Making sure search engines can crawl, render and index the site, and file each page under the right address.', ['Crawling', 'Indexing', 'Canonicals']],
  ['On-page SEO', 'Titles, descriptions, headings, image text and internal links written for what each page is for.', ['Metadata', 'Headings', 'Alt text']],
  ['Site architecture', 'A URL structure, navigation and page hierarchy that make the important pages obvious.', ['URLs', 'Navigation', 'Hierarchy']],
  ['Keyword & topic research', 'The terms customers actually use, the intent behind them, and which page should answer each.', ['Search intent', 'Topics']],
  ['Content strategy', 'Which articles and pages to write, in what order, and how they link to each other and to your services.', ['Briefs', 'Clusters', 'Internal links']],
  ['Monitoring & optimisation', 'Search Console set up and read regularly: coverage, indexing issues, queries and what to fix next.', ['Search Console', 'Reviews']],
] as const;

const TECHNICAL = [
  ['XML sitemap', 'Every page and published article listed, generated at each build with real last-modified dates, and submitted to Search Console.'],
  ['Robots rules', 'Search engines allowed where they should be and kept out of what is not a page — forms endpoints, admin areas.'],
  ['Canonical URLs', 'Each page names its one preferred address, so duplicates do not compete with each other.'],
  ['Indexing', 'Coverage reports checked for pages Google has excluded, with the reason found and fixed.'],
  ['Structured data', 'Schema that describes the page accurately — organisation, article, breadcrumb — and nothing the page does not show.'],
  ['Metadata', 'A unique title and description per page, written for the result someone sees, within the length search engines display.'],
  ['Performance', 'Fast-loading, stable pages, especially on mobile, where most searches now happen.'],
  ['Redirects', 'Old and changed URLs pointed at their new addresses, so links and history carry over.'],
];

const CONTENT = [
  ['Search intent first', 'Each page is planned around what the person searching wants — to learn, compare, or hire — before a word is written.'],
  ['Topics, not single keywords', 'Related questions grouped into clusters, with a main page and supporting articles that link to it.'],
  ['Briefs before drafts', 'A brief for every piece: the question it answers, the terms it should use naturally, the pages it links to.'],
  ['Checked before publishing', 'Titles, descriptions, headings, image text and internal links reviewed on every article before it goes live.'],
];

const PROCESS = [
  { name: 'Audit', note: 'Crawl, index and metadata review' },
  { name: 'Fix the foundation', note: 'Technical issues first' },
  { name: 'Map content', note: 'Pages and topics to search intent' },
  { name: 'Publish & optimise', note: 'New and improved pages' },
  { name: 'Monitor', note: 'Search Console, every month' },
  { name: 'Improve', note: 'Act on what the data shows' },
];

const FAQS = [
  {
    q: 'How long does SEO take to work?',
    a: 'Technical fixes can be picked up as soon as Google recrawls the affected pages, which is often days or weeks. Visibility for competitive searches usually takes months of consistent content and improvement. Anyone who promises a date for a ranking is guessing.',
  },
  {
    q: 'Can you guarantee first-page rankings?',
    a: 'No — and be wary of anyone who does. Rankings are decided by search engines and depend on your competitors, your content and time. What Vioniche commits to is the work: a sound technical foundation, a clear content plan, and honest reporting from Search Console on what is changing.',
  },
  {
    q: 'Do you work on websites Vioniche did not build?',
    a: <>Yes. It starts with an audit. Some fixes depend on what the platform allows; if a site cannot support them, you will be told plainly, along with the options — which sometimes include a rebuild through <a href="/services/web-development">web development</a>.</>,
  },
  {
    q: 'Do you build backlinks?',
    a: 'The focus is the site and its content — the parts you control and that earn links over time. Vioniche does not buy links or run link schemes; they put a site at risk of penalties.',
  },
  {
    q: 'What about AI search and AI answers?',
    a: 'Clear site structure, accurate structured data and genuinely useful content are what search engines and AI answer tools both read. That is the work done here. No one can guarantee that a site will be cited in AI-generated answers.',
  },
  {
    q: 'What do you need from us?',
    a: 'Access to the website or its CMS, access to Google Search Console (or permission to set it up), and some time to talk about your customers and what they ask before they buy.',
  },
];

const JSON_LD = serviceJsonLd('seo', {
  name: 'SEO Services',
  serviceType: 'Search engine optimization',
  description: DESCRIPTION,
});

export default function SeoPage() {
  return (
    <ServiceShell jsonLd={JSON_LD} contact={{ eyebrow: '11', title: <>Talk about <b>your SEO.</b></>, type: 'SEO' }}>
      <ServiceHero
        current="seo"
        keyword="SEO services"
        title={<>SEO built on a <b>technical foundation.</b></>}
        lead="Search visibility starts with a site search engines can crawl, understand and trust. Vioniche fixes the technical layer first, then builds the content structure and monitoring that let visibility grow over time."
        cta="Talk About Your SEO"
        secondary={{ href: '/case-studies/born21', label: 'See Born21’s technical SEO' }}
      />

      <hr className="divider" />

      <section aria-labelledby="seo-why">
        <div className="wrap">
          <div className="sv-head reveal">
            <div>
              <span className="eyebrow"><span className="n">01</span> Why it starts with the site</span>
              <h2 id="seo-why" className="title" style={{ marginTop: '18px' }}>SEO is not <b>adding keywords.</b></h2>
            </div>
            <p className="lead">
              A page Google cannot crawl, or one competing with three copies of itself, will not rank however well
              it is written. Many SEO problems are website problems first.
            </p>
          </div>
          <ul className="cs-areas">
            {PROBLEMS.map(([name, text], i) => (
              <li key={name} className="reveal" style={{ transitionDelay: `${i * 70}ms` }}>
                <span className="cs-obj-n">{String(i + 1).padStart(2, '0')}</span>
                <h3>{name}</h3>
                <p>{text}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="cs-dark" aria-labelledby="seo-layers">
        <div className="wrap">
          <div className="cs-head reveal">
            <div>
              <span className="eyebrow"><span className="n">02</span> How SEO builds</span>
              <h2 id="seo-layers" className="cs-dark-title">From foundation <em>to visibility.</em></h2>
            </div>
            <p className="cs-dark-lead">
              Each layer depends on the one before it. Content on a site that cannot be indexed is wasted, and
              visibility that is not measured cannot be improved — so the last step loops back to the first.
            </p>
          </div>
          <div className="sv-body">
            <Flow steps={LAYERS} label="How search visibility is built, from technical foundation to ongoing optimisation" tone="dark" />
          </div>
        </div>
      </section>

      <section aria-labelledby="seo-handles">
        <div className="wrap">
          <div className="sv-head reveal">
            <div>
              <span className="eyebrow"><span className="n">03</span> What Vioniche handles</span>
              <h2 id="seo-handles" className="title" style={{ marginTop: '18px' }}>Technical, on-page <b>and content.</b></h2>
            </div>
            <p className="lead">One person responsible for the whole of it, so a content plan never runs into a site that cannot support it.</p>
          </div>
          <div className="svc-grid">
            {HANDLES.map(([name, text, tags], i) => (
              <div key={name} className="card reveal">
                <div className="no">{String(i + 1).padStart(2, '0')}</div>
                <h3 style={{ marginTop: '14px' }}>{name}</h3>
                <p>{text}</p>
                <div className="tags">{tags.map((t) => <b key={t}>{t}</b>)}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="cs-soft" aria-labelledby="seo-tech">
        <div className="wrap">
          <div className="sv-head reveal">
            <div>
              <span className="eyebrow"><span className="n">04</span> Technical SEO</span>
              <h2 id="seo-tech" className="title" style={{ marginTop: '18px' }}>Making the site <b>readable to search engines.</b></h2>
            </div>
            <p className="lead">Before content can rank, search engines have to find it, read it and file it under the right address.</p>
          </div>
          <ul className="cs-areas">
            {TECHNICAL.map(([name, text], i) => (
              <li key={name} className="reveal" style={{ transitionDelay: `${(i % 4) * 70}ms` }}>
                <span className="cs-obj-n">{String(i + 1).padStart(2, '0')}</span>
                <h3>{name}</h3>
                <p>{text}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section aria-labelledby="seo-content">
        <div className="wrap">
          <div className="cs-split">
            <div className="reveal">
              <span className="eyebrow"><span className="n">05</span> On-page &amp; content strategy</span>
              <h2 id="seo-content" className="title" style={{ marginTop: '18px' }}>Content planned <b>around real searches.</b></h2>
              <div className="sv-copy" style={{ marginTop: '22px' }}>
                <p>
                  Keyword research finds the words customers use. The more useful part is the intent behind them —
                  whether someone wants to learn, compare or hire — because that decides what kind of page should
                  answer the search, and where it belongs on the site.
                </p>
                <p>
                  This site’s own blog works this way. Its editor shows an SEO check for every article — title and
                  description length, heading structure, image text, primary keyword and internal links — before it
                  is published, as with <a href="/blog/why-your-business-needs-a-modern-website-in-2026">Why Your Business Needs a Modern Website in 2026</a>.
                </p>
              </div>
            </div>
            <dl className="cs-facts reveal">
              {CONTENT.map(([k, v]) => (
                <div key={k}><dt>{k}</dt><dd>{v}</dd></div>
              ))}
            </dl>
          </div>
        </div>
      </section>

      <section className="cs-soft" aria-labelledby="seo-monitor">
        <div className="wrap">
          <div className="cs-split cs-split--rev">
            <div className="reveal">
              <span className="eyebrow"><span className="n">06</span> Search Console &amp; monitoring</span>
              <h2 id="seo-monitor" className="title" style={{ marginTop: '18px' }}>Measured, <b>not assumed.</b></h2>
              <div className="sv-copy" style={{ marginTop: '22px' }}>
                <p>
                  Google Search Console shows which pages are indexed, which were left out and why, and which searches
                  the site appears for. It is set up on launch, its sitemap is submitted, and its reports are read
                  regularly — they decide what gets fixed or written next.
                </p>
                <p>
                  Reporting covers what actually changed, including when the answer is &ldquo;not much yet&rdquo;.
                </p>
              </div>
            </div>
            <Shot
              src="/case-studies/born21/search-console-sitemap-success.jpg"
              alt="Google Search Console Sitemaps report. https://born21.com/sitemap.xml, submitted Oct 2, 2026 and last read Oct 4, 2026, has status Success."
              width={1600}
              height={564}
              sizes="(min-width: 1280px) 760px, (min-width: 900px) 58vw, 92vw"
              label="Born21 · Search Console sitemaps"
              caption="Born21’s sitemap submission, shown as successfully processed."
            />
          </div>
        </div>
      </section>

      <section aria-labelledby="seo-process">
        <div className="wrap">
          <div className="sv-head reveal">
            <div>
              <span className="eyebrow"><span className="n">07</span> Process</span>
              <h2 id="seo-process" className="title" style={{ marginTop: '18px' }}>A cycle, <b>not a launch.</b></h2>
            </div>
            <p className="lead">The audit decides the order. Technical problems are fixed before content is written, because they limit everything built on top of them.</p>
          </div>
          <div className="sv-body">
            <Flow steps={PROCESS} label="The SEO process, from audit to ongoing improvement" />
          </div>
          <div className="wwd-cta reveal" style={{ marginTop: '56px' }}>
            <p>Not sure what is holding your site back in search?</p>
            <a className="proj-link wwd-cta-link" href="#contact">Talk About Your SEO <span className="dot" aria-hidden="true">→</span></a>
          </div>
        </div>
      </section>

      <section className="cs-soft" aria-labelledby="seo-proof">
        <div className="wrap">
          <div className="sv-proof">
            <div className="reveal">
              <span className="eyebrow"><span className="n">08</span> Real project</span>
              <h2 id="seo-proof" className="title" style={{ marginTop: '18px' }}>The Born21 <b>SEO foundation.</b></h2>
              <div className="sv-copy" style={{ marginTop: '22px' }}>
                <p>
                  See how Vioniche built Born21’s website and technical SEO foundation: a sitemap generated at
                  every build from published Ghost articles, canonical URLs and written metadata for each page,
                  and Search Console set up to monitor how Google picks it up.
                </p>
                <p>
                  As the case study says, search performance is being measured over time before any growth is claimed.
                </p>
              </div>
              <a className="btn btn-dark sv-proof-link" href="/case-studies/born21">Read the Born21 case study <span className="dot">→</span></a>
            </div>
            <dl className="cs-facts reveal">
              <div><dt>Sitemap</dt><dd>Generated at each build, submitted and processed in Search Console</dd></div>
              <div><dt>Canonicals &amp; metadata</dt><dd>One preferred address and a written title and description per page</dd></div>
              <div><dt>Content workflow</dt><dd>Research, search intent and structure before publishing in Ghost</dd></div>
              <div><dt>Monitoring</dt><dd>Indexing and sitemap status followed in Search Console</dd></div>
            </dl>
          </div>
        </div>
      </section>

      <ServiceFaq no="09" title={<>Straight answers <b>about SEO.</b></>} faqs={FAQS} />

      <ServiceLinks
        no="10"
        soft
        eyebrow="Connected services"
        title={<>SEO works best <b>with the rest.</b></>}
        cards={[
          { href: '/services/web-development', kicker: 'The foundation', title: 'Web Development', text: 'A fast, well-structured site is where technical SEO starts — and the cheapest point to get it right.', go: 'Explore web development' },
          { href: '/services/automation', kicker: 'Less manual work', title: 'Automation', text: 'Publishing, sitemap updates and reporting that run on their own, so the SEO routine keeps going.', go: 'Explore business automation' },
          { href: '/blog', kicker: 'Read', title: 'The Vioniche blog', text: 'Articles on websites, SEO and digital growth, written for business owners rather than specialists.', go: 'Read the blog' },
        ]}
      />
    </ServiceShell>
  );
}
