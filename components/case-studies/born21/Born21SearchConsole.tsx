import Shot from '../Shot';

/**
 * Evidence of monitoring, not a growth report, and the copy says so before
 * the first screenshot appears.
 *
 * Every number in these captions is read off the screenshot it sits under:
 * 77 crawl requests, 1 page indexed and 3 not, 1 "alternate page with
 * proper canonical tag", 2 "duplicate without user-selected canonical"
 * (the http:// and http://www homepage variants), validation started
 * 7 October 2026. None of them is framed as an achievement.
 */
/**
 * Each card is something the Born21 code or Search Console account shows:
 * the submitted sitemap, the indexing report and its flagged conditions, and
 * the sitemap, robots.txt, canonical, metadata and article-heading structure
 * built into the site.
 */
const FOUNDATION = [
  {
    label: 'Search Console',
    title: 'Connected and monitored',
    text: 'Sitemap submitted and monitored through Google Search Console.',
  },
  {
    label: 'Indexing',
    title: 'Tracked page by page',
    text: 'Indexed and non-indexed pages monitored, with technical indexing issues identified for investigation.',
  },
  {
    label: 'Technical SEO',
    title: 'Built into the site',
    text: 'Sitemap, robots.txt, canonical URLs, metadata and content structure established as part of the site foundation.',
  },
];

export default function Born21SearchConsole() {
  return (
    <section className="cs-soft" aria-labelledby="cs-gsc">
      <div className="wrap">
        <div className="reveal cs-gsc-head">
          <span className="eyebrow"><span className="n">08</span> Search monitoring</span>
          <h2 id="cs-gsc" className="title" style={{ marginTop: '18px' }}>SEO isn&rsquo;t a checkbox. <b>It&rsquo;s an ongoing process.</b></h2>
          <p className="lead">
            Born21.com was added to Google Search Console on 1 October 2026. It gives ongoing visibility
            into search performance, indexing and technical conditions. The screenshots below show the
            current state as it is — the start of monitoring a newly rebuilt site, not a record of
            growth.
          </p>
        </div>

        <div className="cs-evidence">
          {/* What was set up, not what it has produced yet. The empty
              performance chart used to lead this block; it was accurate but
              said nothing about the work, so the work leads now and a crop of
              the Crawling settings stands as the evidence. */}
          <div className="cs-found">
            <div className="cs-found-head reveal">
              <div>
                <span className="cs-ev-label">SEO foundation</span>
                <h3>A technical foundation built to be measured.</h3>
              </div>
              <div>
                <p>
                  Before search growth can compound, the site needs a clean technical foundation and a
                  reliable monitoring loop. The implementation established the core SEO infrastructure
                  and connected it to Search Console for ongoing visibility into indexing and search
                  performance.
                </p>
                <ol className="cs-loop" aria-label="The SEO loop">
                  <li>Build</li><li>Index</li><li>Monitor</li><li>Improve</li>
                </ol>
              </div>
            </div>

            <div className="cs-found-cards">
              {FOUNDATION.map((c, i) => (
                <article key={c.label} className="card cs-found-card reveal" style={{ transitionDelay: `${i * 80}ms` }}>
                  <span className="cs-found-k">{c.label}</span>
                  <h4>{c.title}</h4>
                  <p>{c.text}</p>
                </article>
              ))}
            </div>

            <Shot
              className="cs-found-shot"
              src="/case-studies/born21/search-console-monitoring.jpg"
              alt="Google Search Console settings, Crawling section: robots.txt — All files are valid; Crawl stats — 77 crawl requests (last 90 days)."
              width={1180}
              height={245}
              sizes="(min-width: 1280px) 760px, (min-width: 900px) 64vw, 92vw"
              label="Search Console · Monitoring"
              caption="Search Console provides the monitoring layer for indexing and search visibility."
            />
          </div>

          <div className="cs-ev-row">
            <div className="cs-ev-text reveal">
              <span className="cs-ev-label">Indexing</span>
              <h3>Which pages Google has filed, and why.</h3>
              <p>
                The indexing report shows which URLs Google has added to its index and gives a reason
                for each one it has not. It is how new pages and articles are followed after they are
                published.
              </p>
            </div>
            <Shot
              src="/case-studies/born21/search-console-indexing.jpg"
              alt="Google Search Console Page indexing report: 3 not indexed for 2 reasons, 1 indexed."
              width={1600}
              height={956}
              sizes="(min-width: 1280px) 720px, (min-width: 900px) 58vw, 92vw"
              label="Search Console · Page indexing"
              caption="1 page indexed. 3 URLs not indexed, for the 2 reasons shown below."
            />
          </div>

          <div className="cs-ev-row">
            <div className="cs-ev-text reveal">
              <span className="cs-ev-label">Canonical &amp; duplicate URL diagnostics</span>
              <h3>Duplicate addresses, identified.</h3>
              <p>
                <strong>Alternate page with proper canonical tag</strong> (1 page): Google found another
                address for a page and followed its canonical tag to the preferred version — the
                canonical setup doing its job.
              </p>
              <p>
                <strong>Duplicate without user-selected canonical</strong> (2 pages): the{' '}
                <code>http://</code> and <code>http://www</code> versions of the homepage. Validation
                was started on 7 October 2026 and is still pending.
              </p>
            </div>
            <div className="cs-ev-stack">
              <Shot
                src="/case-studies/born21/search-console-canonical.jpg"
                alt="Search Console, Why pages aren't indexed: Alternate page with proper canonical tag, 1 page, validation not started; Duplicate without user-selected canonical, 2 pages, validation started."
                width={1600}
                height={590}
                sizes="(min-width: 1280px) 720px, (min-width: 900px) 58vw, 92vw"
                label="Search Console · Why pages aren’t indexed"
              />
              <Shot
                src="/case-studies/born21/search-console-validation.jpg"
                alt="Search Console validation details for Duplicate without user-selected canonical: validation started 10/7/26, 2 pending, 0 failed. Examples: http://www.born21.com/ last crawled Sep 29, 2026, and http://born21.com/ last crawled Sep 26, 2026."
                width={1600}
                height={677}
                sizes="(min-width: 1280px) 720px, (min-width: 900px) 58vw, 92vw"
                label="Search Console · Validation details"
                caption="Validation in progress: 2 pending, 0 failed."
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
