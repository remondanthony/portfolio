/**
 * What Vioniche does — the section the nav's "Services" link lands on.
 *
 * A short overview, not the services themselves: each service has its own
 * page now, so each row is a number, a name, one line and a way through to
 * that page. The whole row is the link — one tab stop per service, with the
 * name as the bulk of its accessible text — and the four links are the
 * homepage's main internal links into the service pages.
 *
 * The rows keep the editorial list's hairlines, numbers, orange rule and
 * entrance (.wwd-list / .wwd-item, shared with the service pages); only the
 * homepage's --links modifier lays a row out as one link with an arrow.
 *
 * It is followed directly by "Not add-ons. Just how we build." (Services.tsx,
 * #standards): this section is what Vioniche does, that one is the standard
 * every project gets. They are meant to read as one story, in that order.
 *
 * Everything is visible without hover or JavaScript. Hover and keyboard focus
 * only add emphasis. No outcome is promised.
 */

import { servicePage, type ServicePageKey } from '@/lib/services';

/** Homepage wording; the destination comes from the shared service list. */
const SERVICES: { key: ServicePageKey; name: string; text: string }[] = [
  { key: 'web-development', name: 'Website Development', text: 'Websites that look sharp, load fast, and turn visitors into customers.' },
  { key: 'seo', name: 'SEO', text: 'Technical SEO and content systems built for sustainable visibility.' },
  { key: 'automation', name: 'Automation', text: 'Workflows and integrations that eliminate repetitive work.' },
  { key: 'ai-automation', name: 'AI Automation', text: 'Practical AI workflows that help your business work faster and smarter.' },
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

        <ol className="wwd-list wwd-list--links">
          {SERVICES.map((s, i) => (
            <li key={s.key} className="wwd-item">
              <a className="wwd-row" href={servicePage(s.key).href}>
                <div className="wwd-name">
                  <span className="wwd-no" aria-hidden="true">{String(i + 1).padStart(2, '0')}</span>
                  <h3>{s.name}</h3>
                </div>
                <p className="wwd-text">{s.text}</p>
                <span className="wwd-arrow" aria-hidden="true">→</span>
              </a>
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
