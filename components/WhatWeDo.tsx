/**
 * What Vioniche does — the section the nav's "Services" link lands on.
 *
 * Four services as an editorial list rather than four identical cards: each
 * row is a number and a name on one side, what it is and what it covers on
 * the other, separated by the same hairlines the rest of the page uses.
 *
 * It is followed directly by "Not add-ons. Just how we build." (Services.tsx,
 * #standards): this section is what Vioniche does, that one is the standard
 * every project gets. They are meant to read as one story, in that order.
 *
 * Everything is visible without hover or JavaScript. Hover and keyboard focus
 * only add emphasis; the entrance is CSS-only and skipped where unsupported or
 * when reduced motion is requested. No outcome is promised: these describe the
 * work, not rankings, traffic or AI placement nobody can guarantee.
 */

const SERVICES = [
  {
    name: 'Website Development',
    text: 'Websites that look sharp, load fast, and turn visitors into customers.',
    points: [
      'Business websites',
      'Landing pages',
      'Custom web experiences',
      'CMS integrations',
      'Responsive, performance-focused builds',
    ],
  },
  {
    name: 'SEO',
    text: 'Build search visibility that compounds over time.',
    points: [
      'Technical SEO',
      'On-page SEO',
      'Content strategy',
      'Site architecture',
      'Search Console and indexing',
      'Ongoing SEO monitoring',
    ],
  },
  {
    name: 'Automation',
    text: 'Replace repetitive work with systems that run themselves.',
    points: [
      'Business workflows',
      'API integrations',
      'Automated reporting',
      'Content workflows',
      'Lead automation',
      'AI-assisted processes',
    ],
  },
  {
    name: 'AI & GEO',
    text: 'Prepare your business for the next generation of search and automation.',
    points: [
      'AI-ready content systems',
      'Generative Engine Optimization (GEO)',
      'AI-assisted workflows',
      'Intelligent content systems',
      'AI automation',
      'Visibility across emerging AI search experiences',
    ],
  },
];

export default function WhatWeDo() {
  return (
    <section id="services" className="wwd" aria-labelledby="wwd-title">
      <div className="wrap">
        <div className="svc-head wwd-head">
          <div>
            <span className="eyebrow">What we do</span>
            <h2 id="wwd-title" className="title" style={{ marginTop: '18px' }}>
              Digital systems built to <b>move your business forward.</b>
            </h2>
          </div>
          <p className="lead" style={{ margin: 0 }}>
            Website development, SEO, automation and AI, planned together as one connected system — so
            the site you launch is easier to find, easier to run and ready to grow, instead of a set of
            separate add-ons.
          </p>
        </div>

        <ol className="wwd-list">
          {SERVICES.map((s, i) => (
            <li key={s.name} className="wwd-item">
              <div className="wwd-name">
                <span className="wwd-no" aria-hidden="true">{String(i + 1).padStart(2, '0')}</span>
                <h3>{s.name}</h3>
              </div>
              <div className="wwd-detail">
                <p className="wwd-text">{s.text}</p>
                <ul className="wwd-points">
                  {s.points.map((p) => <li key={p}>{p}</li>)}
                </ul>
              </div>
            </li>
          ))}
        </ol>

        <div className="wwd-cta">
          <p>Have a project in mind?</p>
          <a className="proj-link wwd-cta-link" href="#contact">Start a project <span className="dot" aria-hidden="true">→</span></a>
        </div>
      </div>
    </section>
  );
}
