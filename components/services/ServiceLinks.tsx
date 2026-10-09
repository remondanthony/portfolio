import type { ReactNode } from 'react';

export type LinkCard = { href: string; kicker: string; title: string; text: ReactNode; go: string };

/**
 * Where to go next, as cards that are links. The link text says where it
 * goes ("Explore SEO services"), so it still makes sense read out of context.
 */
export default function ServiceLinks({
  no,
  eyebrow,
  title,
  lead,
  cards,
  soft = false,
}: {
  no: string;
  eyebrow: string;
  title: ReactNode;
  lead?: ReactNode;
  cards: LinkCard[];
  soft?: boolean;
}) {
  return (
    <section className={soft ? 'cs-soft' : undefined} aria-labelledby={`sv-links-${no}`}>
      <div className="wrap">
        <div className="sv-head reveal">
          <div>
            <span className="eyebrow"><span className="n">{no}</span> {eyebrow}</span>
            <h2 id={`sv-links-${no}`} className="title" style={{ marginTop: '18px' }}>{title}</h2>
          </div>
          {lead && <p className="lead">{lead}</p>}
        </div>
        <div className={`sv-links${cards.length === 2 ? ' sv-links--2' : ''}`}>
          {cards.map((c) => (
            <a key={c.href} className="card sv-link reveal" href={c.href}>
              <span className="sv-link-k">{c.kicker}</span>
              <h3>{c.title}</h3>
              <p>{c.text}</p>
              <span className="sv-link-go">{c.go} <span aria-hidden="true">→</span></span>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
