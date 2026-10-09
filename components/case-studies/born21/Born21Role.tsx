/** The responsibilities named in the Born21 case-study brief, and no others. */
const ROLE = [
  'Website Development',
  'Technical SEO',
  'CMS Integration',
  'Content Infrastructure',
  'Deployment Automation',
  'Monitoring',
  'Maintenance',
];

export default function Born21Role() {
  return (
    <section className="cs-soft" aria-labelledby="cs-role">
      <div className="wrap">
        <div className="cs-role reveal">
          <span className="eyebrow"><span className="n">10</span> Vioniche&rsquo;s role</span>
          <h2 id="cs-role" className="title" style={{ marginTop: '18px' }}>What <b>Vioniche did.</b></h2>
          <p className="cs-role-statement">
            From the first line of implementation to ongoing search monitoring, Vioniche manages the
            digital workflow behind Born21&rsquo;s website.
          </p>
          <ul className="cs-role-list" aria-label="Responsibilities">
            {ROLE.map((r) => <li key={r}>{r}</li>)}
          </ul>
        </div>

        {/* The one place this page sends a visitor away from Vioniche, and it
            says so: new tab, and announced as one. */}
        <a className="cs-live reveal" href="https://born21.com" target="_blank" rel="noopener noreferrer">
          <span className="cs-live-k">See the live website</span>
          <span className="cs-live-v">
            Visit Born21<span className="cs-sr"> (opens in a new tab)</span> <span className="cs-live-arrow" aria-hidden="true">↗</span>
          </span>
          <span className="cs-live-url" aria-hidden="true">born21.com</span>
        </a>
      </div>
    </section>
  );
}
