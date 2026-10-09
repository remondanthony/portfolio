/**
 * Project facts as given in the Born21 case-study brief. "Ongoing" is a real
 * status, not a hedge: the content, SEO and maintenance work continues.
 */
const META: Array<[string, string | string[]]> = [
  ['Client', 'Born21'],
  ['Industry', 'YouTube Growth / Digital Marketing'],
  ['Services', ['Web Development', 'Technical SEO', 'CMS', 'Automation', 'Content Infrastructure']],
  ['Year', '2026'],
  ['Status', 'Ongoing'],
];

export default function Born21Overview() {
  return (
    <section className="cs-overview-sec" aria-labelledby="cs-overview">
      <div className="wrap cs-overview">
        <div className="reveal">
          <span className="eyebrow"><span className="n">01</span> Overview</span>
          <h2 id="cs-overview" className="title" style={{ marginTop: '18px' }}>More than <b>a website.</b></h2>
          <p className="lead">
            Born21 needed a digital presence that could carry its website, its content publishing and
            its long-term growth in organic search.
          </p>
          <p className="lead">
            Vioniche approached it as one system rather than a set of deliverables: the website
            experience, the content infrastructure behind it, the technical SEO foundation, and the
            workflow that takes every change to production.
          </p>
        </div>

        <dl className="cs-meta reveal">
          {META.map(([k, v]) => (
            <div key={k}>
              <dt>{k}</dt>
              <dd>
                {Array.isArray(v) ? (
                  <ul>{v.map((s) => <li key={s}>{s}</li>)}</ul>
                ) : k === 'Status' ? (
                  <span className="cs-status">{v}</span>
                ) : (
                  v
                )}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
