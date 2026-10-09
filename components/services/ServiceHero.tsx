import type { ReactNode } from 'react';
import { SERVICE_PAGES, servicePage, type ServicePageKey } from '@/lib/services';

/**
 * The top of every service page: where it sits, what it is, what to do next,
 * and — underneath — the chain of four services with this one marked, so a
 * visitor who came in through one page can see the others and how they
 * follow on from each other.
 *
 * The h1 carries the search phrase and the promise in one heading. Both are
 * visible; nothing is in it for search engines that a reader does not see.
 */
export default function ServiceHero({
  current,
  keyword,
  title,
  lead,
  cta,
  secondary,
}: {
  current: ServicePageKey;
  /** The search phrase, shown small above the statement. */
  keyword: string;
  title: ReactNode;
  lead: ReactNode;
  /** The page's own call to action; it scrolls to the contact form below. */
  cta: string;
  secondary?: { href: string; label: string };
}) {
  const page = servicePage(current);
  return (
    <section className="sv-hero" aria-labelledby="sv-title">
      <div className="wrap">
        <div className="sv-hero-grid">
          <div className="reveal">
            <nav className="eyebrow cs-crumb" aria-label="Breadcrumb">
              <a href="/#services">Services</a>
              <span aria-hidden="true">/</span>
              <span aria-current="page">{page.name}</span>
            </nav>
            <h1 id="sv-title" className="sv-h1">
              <span className="sv-h1-k">{keyword}</span>{' '}
              <span className="sv-h1-v">{title}</span>
            </h1>
          </div>
          <div className="sv-hero-side reveal">
            <p className="sv-hero-lead">{lead}</p>
            <div className="sv-hero-actions">
              <a className="btn btn-dark" href="#contact">{cta} <span className="dot">→</span></a>
              {secondary && <a className="btn btn-ghost" href={secondary.href}>{secondary.label}</a>}
            </div>
          </div>
        </div>

        <nav className="sv-chain reveal" aria-label="Vioniche services">
          <span className="sv-chain-k">One connected system</span>
          <ol>
            {SERVICE_PAGES.map((s, i) => (
              <li key={s.key}>
                <a href={s.href} aria-current={s.key === current ? 'page' : undefined}>
                  <span className="sv-chain-n">{String(i + 1).padStart(2, '0')}</span>
                  {s.name}
                </a>
              </li>
            ))}
          </ol>
        </nav>
      </div>
    </section>
  );
}
