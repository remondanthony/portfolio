import { CONTACT_HREF } from '@/lib/blog/links';

/**
 * The close of every article, in the homepage's .cta block. Quieter than the
 * case study's: someone who has just read an article came to learn something,
 * so this offers a conversation rather than a pitch.
 */
export default function BlogCta() {
  return (
    <section aria-labelledby="bl-cta">
      <div className="wrap">
        <div className="cta reveal">
          <div className="halo" aria-hidden="true" />
          <h2 id="bl-cta">Working on something <b>like this?</b></h2>
          <p>Vioniche designs, builds and maintains websites — and the SEO and automation behind them. Tell us what you&rsquo;re planning.</p>
          <div className="actions">
            <a className="btn btn-dark" href={CONTACT_HREF}>Start a conversation <span className="dot">→</span></a>
            <a className="btn btn-ghost" href="/case-studies/born21">See the Born21 case study</a>
          </div>
        </div>
      </div>
    </section>
  );
}
