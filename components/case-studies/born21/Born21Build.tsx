/**
 * Every line here is checkable against the Born21 repository: the Next.js
 * App Router migration, the static export, the Ghost Content API client, the
 * generated sitemap, and the GitHub Actions workflow.
 */
const BUILT = [
  {
    title: 'Website Development',
    text: 'The Born21 site, moved from a Vite build to the Next.js App Router and exported as static pages that run on standard web hosting.',
    points: ['Homepage and three client case studies', 'Insights section for articles', 'Responsive layouts throughout'],
  },
  {
    title: 'Technical SEO',
    text: 'The groundwork that lets search engines find, read and correctly file every page — written into the site rather than bolted on.',
    points: ['XML sitemap, generated at build', 'Robots configuration', 'Canonical URLs and page metadata'],
  },
  {
    title: 'Content Infrastructure',
    text: 'Ghost CMS connected to the site, so articles are written in a publishing tool and become static pages on born21.com.',
    points: ['Ghost Content API integration', 'Article pages with their own metadata', 'New posts added to the sitemap'],
  },
  {
    title: 'Deployment Automation',
    text: 'A GitHub Actions workflow that checks, builds, verifies and deploys every release to Hostinger, without anyone uploading files by hand.',
    points: ['Self-hosted runner', 'Checks before every deploy', 'Daily scheduled rebuild'],
  },
];

export default function Born21Build() {
  return (
    <section aria-labelledby="cs-built">
      <div className="wrap">
        <div className="svc-head reveal">
          <div>
            <span className="eyebrow"><span className="n">03</span> What Vioniche built</span>
            <h2 id="cs-built" className="title" style={{ marginTop: '18px' }}>Four parts. <b>One system.</b></h2>
          </div>
          <p className="lead" style={{ margin: 0, maxWidth: '460px' }}>
            Each part was built to work with the others, so the site can keep growing without being rebuilt.
          </p>
        </div>

        <div className="cs-built">
          {BUILT.map((b, i) => (
            <article key={b.title} className="card cs-built-card reveal" style={{ transitionDelay: `${(i % 2) * 80}ms` }}>
              <span className="cs-built-n">{String(i + 1).padStart(2, '0')}</span>
              <h3>{b.title}</h3>
              <p>{b.text}</p>
              <ul className="cs-points">
                {b.points.map((p) => <li key={p}>{p}</li>)}
              </ul>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
