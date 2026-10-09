import type { Metadata } from 'next';
import Flow from '@/components/case-studies/Flow';
import Shot from '@/components/case-studies/Shot';
import ServiceShell from '@/components/services/ServiceShell';
import ServiceHero from '@/components/services/ServiceHero';
import ServiceFaq from '@/components/services/ServiceFaq';
import ServiceLinks from '@/components/services/ServiceLinks';
import { serviceJsonLd, serviceMetadata, servicePage } from '@/lib/services';

/**
 * Web development — for a business that needs a website built or rebuilt.
 *
 * Every capability named here is one Vioniche has shipped: this site (Next.js,
 * a CMS with GitHub publishing, Vercel) and Born21 (Ghost, GitHub Actions to
 * Hostinger). Nothing promises a ranking, a traffic figure or a conversion
 * rate; the page describes the work and what it is for.
 */
const TITLE = 'Web Development Services for Growing Businesses | Vioniche';
const DESCRIPTION =
  'Custom web development: fast, responsive websites with a technical SEO foundation, CMS integration and maintainable code, from business sites to web apps.';

export const metadata: Metadata = serviceMetadata('web-development', TITLE, DESCRIPTION);

const PROBLEMS = [
  ['Slow on the phones customers use', 'Heavy themes, stacked plugins and oversized images make pages wait — and most visitors arrive on a mobile connection.'],
  ['Hard to change', 'A page builder or template nobody fully understands turns every small edit into a support request.'],
  ['Invisible to search', 'Titles, canonical URLs, a sitemap: the basics search engines rely on are often never set up at all.'],
  ['Disconnected from the business', 'Forms that reach no one, no way to publish, no link between the site and the tools the team already uses.'],
];

const BUILDS = [
  {
    name: 'Business & service websites',
    text: 'The main site for a business: what you do, who it is for, and a clear way to get in touch.',
    points: ['Service and location pages', 'Clear enquiry paths', 'Content you can update', 'Structured for search'],
  },
  {
    name: 'Landing pages',
    text: 'One page for one campaign, offer or audience — focused, quick to load and easy to measure.',
    points: ['Single-purpose layout', 'Fast on mobile', 'Working enquiry forms', 'Built to iterate'],
  },
  {
    name: 'Portfolio & case-study sites',
    text: 'Work presented with the detail that convinces the next client, not just a gallery of thumbnails.',
    points: ['Long-form case studies', 'Optimised imagery', 'Structured data', 'Clear calls to action'],
  },
  {
    name: 'Custom web applications',
    text: 'For when a website has to do more than inform: admin areas, internal tools and workflows behind a sign-in.',
    points: ['Authentication and sessions', 'Server-side logic', 'API integrations', 'Role-specific screens'],
  },
  {
    name: 'CMS integration',
    text: 'A way to publish and edit without touching code, chosen for the people who will actually use it.',
    points: ['Ghost, as on Born21', 'Git-based publishing, as on this site', 'Drafts and previews', 'SEO checks before publishing'],
  },
];

const CAPABILITIES = [
  ['Responsive build', 'Layouts designed for phones first and checked on phones, tablets and desktops.', ['Mobile-first', 'Real devices']],
  ['Performance', 'Pages rendered ahead of time or on the server, images sized for each screen, very little script sent to the browser.', ['Static rendering', 'Image optimisation']],
  ['Technical SEO foundation', 'Metadata, canonical URLs, sitemap, robots rules and structured data in place on launch day.', ['Metadata', 'Sitemap', 'Schema']],
  ['CMS integration', 'Ghost, Git-based content or a custom admin — whichever suits who edits and how often.', ['Ghost', 'MDX', 'Custom admin']],
  ['Forms that deliver', 'Enquiries sent to a real inbox through an email provider, with spam filtering and a fallback if delivery fails.', ['Spam filtering', 'Fallbacks']],
  ['Search Console & analytics', 'The site verified in Search Console, its sitemap submitted, and analytics set up so you can see what visitors do.', ['Search Console', 'Analytics']],
  ['Deployment', 'Every change through Git and an automated deploy — to Vercel, or to the hosting you already have.', ['GitHub', 'Vercel', 'Your hosting']],
  ['Accessibility', 'Semantic HTML, a sensible heading order, keyboard navigation and visible focus states.', ['Semantic HTML', 'Keyboard']],
  ['Maintenance', 'Fixes, updates and small changes after launch, from the person who built the site.', ['Updates', 'Support']],
] as const;

const PROCESS = [
  { name: 'Discover', note: 'Goals, audience and what the site must do' },
  { name: 'Structure', note: 'Pages, sitemap and the search each page serves' },
  { name: 'Design', note: 'Layouts for every screen size' },
  { name: 'Build', note: 'Code, CMS and integrations' },
  { name: 'Launch', note: 'Deploy, redirects, Search Console' },
  { name: 'Improve', note: 'Fixes, content and monitoring' },
];

const STACK = [
  ['Next.js & React', 'Pages are prepared on the server or ahead of time, so they arrive ready to read instead of being assembled in the visitor’s browser.'],
  ['TypeScript', 'Typed code that stays safe to change months after launch, by Vioniche or by another developer.'],
  ['The right CMS', 'Ghost for a publishing team, Git-based content for a small one, a custom admin when the workflow is unusual.'],
  ['Automated deployment', 'Version control for every change and a build that runs checks before anything goes live.'],
];

const FOUNDATION = [
  'A written title and description for every page',
  'One canonical URL per page',
  'An XML sitemap generated at each build',
  'Robots rules that point to the sitemap',
  'Structured data that matches the page',
  'Images sized and compressed per screen',
  'One h1 and a logical heading order',
  'Mobile-first, accessible markup',
];

const FAQS = [
  {
    q: 'How long does a website take to build?',
    a: 'It depends on the number of pages, the integrations and how quickly content and feedback arrive. A focused business site is much quicker than one with a CMS, custom features or a migration. You get a written timeline with the proposal, before any work starts.',
  },
  {
    q: 'Do you use WordPress, themes or page builders?',
    a: 'No. Sites are written in code — usually Next.js and React — so they stay fast and every part of them can be changed. When you need to publish content yourself, the site is connected to a CMS that suits how you work.',
  },
  {
    q: 'Can I update the website myself?',
    a: 'Yes, if you want to. Born21 publishes its articles in Ghost; this site’s blog has its own editor with drafts, previews and SEO checks. Pages that rarely change can stay in code, where they are safest.',
  },
  {
    q: 'Will the website be SEO-ready?',
    a: <>Every site launches with the technical foundation in place: metadata, canonical URLs, a sitemap, robots rules and structured data. That removes the technical reasons a site struggles to be found; it does not guarantee rankings, which depend on content, competition and time. That longer work is what <a href="/services/seo">SEO services</a> cover.</>,
  },
  {
    q: 'Can you rebuild an existing website?',
    a: 'Yes. The existing pages and URLs are reviewed first, content worth keeping is carried over, and old addresses are redirected to their new ones so links and search history are not thrown away.',
  },
  {
    q: 'Who owns the website and the code?',
    a: 'You do. The code, the content and the accounts it runs on are yours to keep, whether or not Vioniche keeps maintaining it.',
  },
  {
    q: 'Do you help with hosting and domains?',
    a: 'Yes. Vioniche can set up hosting and a domain for you, or deploy to the hosting you already have — Born21’s site deploys automatically to its existing Hostinger server.',
  },
];

const JSON_LD = serviceJsonLd('web-development', {
  name: 'Web Development',
  serviceType: 'Web development',
  description: DESCRIPTION,
});

export default function WebDevelopmentPage() {
  const seo = servicePage('seo');
  return (
    <ServiceShell
      jsonLd={JSON_LD}
      contact={{ eyebrow: '10', title: <>Start a <b>website project.</b></>, type: 'Website / Landing page' }}
    >
      <ServiceHero
        current="web-development"
        keyword="Web development services"
        title={<>Websites built to <b>work, rank and grow.</b></>}
        lead="Vioniche designs and builds custom websites that load quickly, read well on every screen and give search engines a clean structure from the first deploy — with the content and hosting set up so the site can keep growing after launch."
        cta="Start a Website Project"
        secondary={{ href: '/case-studies/born21', label: 'See the Born21 build' }}
      />

      <hr className="divider" />

      <section aria-labelledby="wd-problem">
        <div className="wrap">
          <div className="sv-head reveal">
            <div>
              <span className="eyebrow"><span className="n">01</span> The problem</span>
              <h2 id="wd-problem" className="title" style={{ marginTop: '18px' }}>Most business websites <b>fail quietly.</b></h2>
            </div>
            <p className="lead">
              They look fine in a screenshot. The trouble shows up later — in the visitors who leave
              before the page loads, the edits that never get made and the searches the site never appears for.
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

      <section className="cs-soft" aria-labelledby="wd-build">
        <div className="wrap">
          <div className="svc-head wwd-head reveal">
            <div>
              <span className="eyebrow"><span className="n">02</span> What we build</span>
              <h2 id="wd-build" className="title" style={{ marginTop: '18px' }}>Built for what <b>the site has to do.</b></h2>
            </div>
            <p className="lead" style={{ margin: 0 }}>
              Five kinds of project, one standard: written in code rather than assembled from a theme, and
              structured so it can be found, changed and extended.
            </p>
          </div>
          <ol className="wwd-list">
            {BUILDS.map((b, i) => (
              <li key={b.name} className="wwd-item">
                <div className="wwd-name">
                  <span className="wwd-no" aria-hidden="true">{String(i + 1).padStart(2, '0')}</span>
                  <h3>{b.name}</h3>
                </div>
                <div className="wwd-detail">
                  <p className="wwd-text">{b.text}</p>
                  <ul className="wwd-points">{b.points.map((p) => <li key={p}>{p}</li>)}</ul>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section aria-labelledby="wd-cap">
        <div className="wrap">
          <div className="sv-head reveal">
            <div>
              <span className="eyebrow"><span className="n">03</span> Capabilities</span>
              <h2 id="wd-cap" className="title" style={{ marginTop: '18px' }}>Everything a website <b>needs to work.</b></h2>
            </div>
            <p className="lead">From the first layout to the deploy pipeline, built by the same person you talk to.</p>
          </div>
          <div className="svc-grid">
            {CAPABILITIES.map(([name, text, tags], i) => (
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

      <section className="cs-soft" aria-labelledby="wd-process">
        <div className="wrap">
          <div className="sv-head reveal">
            <div>
              <span className="eyebrow"><span className="n">04</span> Process</span>
              <h2 id="wd-process" className="title" style={{ marginTop: '18px' }}>From brief <b>to a live site.</b></h2>
            </div>
            <p className="lead">Structure comes before design, so every page has a job — and a search it is meant to answer — before anything is drawn.</p>
          </div>
          <div className="sv-body">
            <Flow steps={PROCESS} label="The web development process, from discovery to improvement" />
          </div>
          <div className="wwd-cta reveal" style={{ marginTop: '56px' }}>
            <p>Planning a new site, or a rebuild of the one you have?</p>
            <a className="proj-link wwd-cta-link" href="#contact">Start a Website Project <span className="dot" aria-hidden="true">→</span></a>
          </div>
        </div>
      </section>

      <section className="cs-dark" aria-labelledby="wd-stack">
        <div className="wrap">
          <div className="cs-head reveal">
            <div>
              <span className="eyebrow"><span className="n">05</span> Technology</span>
              <h2 id="wd-stack" className="cs-dark-title">Chosen for the job, <em>not the trend.</em></h2>
            </div>
            <p className="cs-dark-lead">
              This site runs on the same setup it describes: Next.js and TypeScript, deployed from GitHub to
              Vercel, with its blog published through a CMS Vioniche built for it.
            </p>
          </div>
          <ul className="cs-objectives">
            {STACK.map(([name, text], i) => (
              <li key={name} className="reveal" style={{ transitionDelay: `${i * 70}ms` }}>
                <span className="cs-obj-n">{String(i + 1).padStart(2, '0')}</span>
                <h3>{name}</h3>
                <p>{text}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section aria-labelledby="wd-seo">
        <div className="wrap">
          <div className="sv-head reveal">
            <div>
              <span className="eyebrow"><span className="n">06</span> SEO &amp; performance foundation</span>
              <h2 id="wd-seo" className="title" style={{ marginTop: '18px' }}>Findable from <b>the first deploy.</b></h2>
            </div>
            <p className="lead">Search engines can only rank what they can crawl and understand. These are built in, not added later.</p>
          </div>
          <div className="cs-deploy sv-body">
            <div className="cs-panel reveal">
              <h3>Included in every build</h3>
              <ul className="cs-checks">{FOUNDATION.map((f) => <li key={f}>{f}</li>)}</ul>
            </div>
            <div className="cs-panel cs-panel--quiet reveal">
              <h3>Where SEO takes over</h3>
              <p>
                A sound build gives search engines something they can read. Earning visibility for the searches
                your customers make is the next piece of work: research, content structure and monitoring over time.
              </p>
              <p>
                Vioniche handles both, so the site and the search strategy are planned together instead of one
                being retrofitted onto the other.
              </p>
              <a className="proj-link" href={seo.href}>Explore SEO services <span className="dot" aria-hidden="true">→</span></a>
            </div>
          </div>
        </div>
      </section>

      <section className="cs-soft" aria-labelledby="wd-proof">
        <div className="wrap">
          <div className="sv-proof">
            <div className="reveal">
              <span className="eyebrow"><span className="n">07</span> Real project</span>
              <h2 id="wd-proof" className="title" style={{ marginTop: '18px' }}>Born21: a website <b>and the system behind it.</b></h2>
              <div className="sv-copy" style={{ marginTop: '22px' }}>
                <p>
                  Vioniche designed and built born21.com, the site of a YouTube growth agency, end to end — then
                  connected Ghost for publishing, set up its technical SEO foundation and automated every
                  deployment to its Hostinger server.
                </p>
              </div>
              <dl className="cs-facts">
                <div><dt>Built</dt><dd>Responsive website, Insights blog, case-study pages</dd></div>
                <div><dt>Behind it</dt><dd>Ghost CMS, GitHub Actions deployment, Search Console monitoring</dd></div>
              </dl>
              <a className="btn btn-dark sv-proof-link" href="/case-studies/born21">Read the Born21 case study <span className="dot">→</span></a>
            </div>
            <Shot
              src="/case-studies/born21/hero.jpg"
              alt="The Born21 homepage: the headline “We build brands that outlast algorithms.” over a dark portrait."
              width={2400}
              height={1500}
              sizes="(min-width: 1280px) 640px, (min-width: 900px) 52vw, 92vw"
              chrome="born21.com"
              zoom={false}
            />
          </div>
        </div>
      </section>

      <ServiceFaq no="08" title={<>Before you <b>start a project.</b></>} faqs={FAQS} />

      <ServiceLinks
        no="09"
        soft
        eyebrow="Connected services"
        title={<>What comes <b>after launch.</b></>}
        lead="A website is the foundation. These are the services built on top of it."
        cards={[
          { href: '/services/seo', kicker: 'Next: visibility', title: 'SEO', text: 'Technical SEO, content structure and Search Console monitoring, so the site is found for the searches that matter.', go: 'Explore SEO services' },
          { href: '/services/automation', kicker: 'Next: less manual work', title: 'Automation', text: 'Enquiries routed, content published and reports assembled without anyone doing it by hand.', go: 'Explore business automation' },
          { href: '/services/ai-automation', kicker: 'Where it helps', title: 'AI Automation', text: 'AI added to specific steps of your workflows — reading, sorting, drafting — with people approving what matters.', go: 'Explore AI automation' },
        ]}
      />
    </ServiceShell>
  );
}
