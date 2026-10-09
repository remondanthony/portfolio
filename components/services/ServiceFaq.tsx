import type { ReactNode } from 'react';

/**
 * The homepage FAQ's own markup — <details>/<summary>, keyboard accessible
 * and searchable in the page without any script — with this service's
 * questions in it.
 */
export default function ServiceFaq({ no, title, faqs }: { no: string; title: ReactNode; faqs: { q: string; a: ReactNode }[] }) {
  return (
    <section aria-labelledby="sv-faq">
      <div className="wrap">
        <div className="sv-head reveal">
          <div>
            <span className="eyebrow"><span className="n">{no}</span> Questions</span>
            <h2 id="sv-faq" className="title" style={{ marginTop: '18px' }}>{title}</h2>
          </div>
          <p className="lead">If yours is not here, ask it in the form below — you will get a straight answer.</p>
        </div>
        <div className="faq-list reveal">
          {faqs.map((f) => (
            <details className="faq" key={f.q}>
              <summary>
                {f.q}
                <i className="faq-mark" aria-hidden="true" />
              </summary>
              <p>{f.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
