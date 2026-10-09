const ESTABLISHED = [
  'Website infrastructure',
  'Responsive frontend',
  'Technical SEO foundation',
  'XML sitemap',
  'Robots configuration',
  'Canonical configuration',
  'Metadata',
  'Ghost CMS',
  'Blog publishing workflow',
  'Git / GitHub workflow',
  'GitHub Actions deployment',
  'Hostinger production environment',
  'Google Search Console monitoring',
  'Ongoing SEO & content workflow',
];

const ONGOING = [
  'Content publishing',
  'SEO optimization',
  'Indexing monitoring',
  'Technical maintenance',
  'Search visibility development',
];

export default function Born21Established() {
  return (
    <section aria-labelledby="cs-established">
      <div className="wrap">
        <div className="reveal">
          <span className="eyebrow"><span className="n">09</span> What was established</span>
          <h2 id="cs-established" className="title" style={{ marginTop: '18px' }}>Built once. <b>Maintained continuously.</b></h2>
        </div>

        <div className="cs-lists">
          <div className="cs-panel reveal">
            <h3>Established</h3>
            <ul className="cs-check">
              {ESTABLISHED.map((s) => <li key={s}>{s}</li>)}
            </ul>
          </div>
          <div className="cs-panel cs-panel--quiet reveal">
            <h3>Ongoing</h3>
            <ul className="cs-check cs-check--ongoing">
              {ONGOING.map((s) => <li key={s}>{s}</li>)}
            </ul>
            <p className="cs-panel-foot">
              The system is designed for continuous improvement rather than a one-time SEO launch.
              Search performance and indexing are measured over time before any growth is claimed.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
