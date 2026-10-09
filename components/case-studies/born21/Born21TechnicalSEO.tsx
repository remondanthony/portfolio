import Shot from '../Shot';

/**
 * Plain language on purpose: this page is read by business owners, not by
 * SEO auditors. Each line describes what is in the Born21 code today.
 */
const AREAS = [
  ['XML Sitemap', 'A structured list of every page and published article, generated at each build with last-updated dates taken from Ghost. Submitted to Google Search Console.'],
  ['Robots Configuration', 'Lets search engines crawl the whole site and points them straight to the sitemap. Search Console reports the file as valid.'],
  ['Canonical URLs', 'Every page names its one preferred address, telling Google which version to index when the same page can be reached at more than one URL.'],
  ['Metadata', 'A written title and description for each page and article, so search results describe what the page actually is.'],
];

export default function Born21TechnicalSEO() {
  return (
    <section className="cs-soft" aria-labelledby="cs-seo">
      <div className="wrap">
        <div className="svc-head reveal">
          <div>
            <span className="eyebrow"><span className="n">06</span> Technical SEO</span>
            <h2 id="cs-seo" className="title" style={{ marginTop: '18px' }}>Making the site understandable <b>to search engines.</b></h2>
          </div>
          <p className="lead" style={{ margin: 0, maxWidth: '440px' }}>
            Before content can rank, search engines have to be able to find it, read it and file it under the right address.
          </p>
        </div>

        <ol className="cs-areas">
          {AREAS.map(([name, text], i) => (
            <li key={name} className="reveal" style={{ transitionDelay: `${i * 70}ms` }}>
              <span className="cs-obj-n">{String(i + 1).padStart(2, '0')}</span>
              <h3>{name}</h3>
              <p>{text}</p>
            </li>
          ))}
        </ol>

        <div className="cs-split cs-split--rev cs-gap">
          <div className="cs-note reveal">
            <h3>Verified in Search Console</h3>
            <p>
              The sitemap is submitted and monitored in Google Search Console, where the current
              sitemap submission is shown as successfully processed.
            </p>
          </div>
          {/* A crop of the original Sitemaps screenshot, ending below the
              current submission's row. Nothing in it is edited; earlier,
              unrelated submissions further down the list are left out. */}
          <Shot
            src="/case-studies/born21/search-console-sitemap-success.jpg"
            alt="Google Search Console Sitemaps report. https://born21.com/sitemap.xml, submitted Oct 2, 2026 and last read Oct 4, 2026, has status Success, with 1 discovered page and 0 discovered videos."
            width={1600}
            height={564}
            sizes="(min-width: 1280px) 700px, (min-width: 900px) 58vw, 92vw"
            label="Search Console · Sitemaps"
            caption="The current sitemap submission is shown with a successful status."
          />
        </div>
      </div>
    </section>
  );
}
