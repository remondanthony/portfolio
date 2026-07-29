/**
 * Featured work.
 *
 * This section previously carried five invented projects — Ivory Clinic,
 * Nimbus, Maison, Ora Studio, Zest. None of them existed. They are gone for
 * the same reason the metrics went: a studio that fabricates its portfolio
 * cannot credibly promise honesty anywhere else on the page.
 *
 * What is left is the one project that shipped, and a second panel that says
 * plainly why there is only one. An empty slot owned out loud reads as
 * confidence; the same slot filled with a concept dressed as a client reads
 * as the opposite.
 *
 * NOTE: the heading and lead were set by the client and read in the plural —
 * "Real projects", "a selection of websites ... businesses" — while one
 * project has shipped and the panel below still explains why the other slot
 * is empty. The two are visibly at odds on the same screen. Worth revisiting
 * whichever way: soften the heading, or fill the slot.
 */

export default function Work() {
  return (
    <>
      <section id="work">
        <div className="wrap">
          <div className="svc-head reveal">
            <div>
              <span className="eyebrow"><span className="n">03</span> Work</span>
              <h2 className="title" style={{marginTop: '18px'}}>Real projects.<br /><b>Real results.</b></h2>
            </div>
            <p className="lead" style={{margin: '0', maxWidth: '520px'}}>A selection of websites designed, developed and launched for ambitious businesses.</p>
          </div>

          <div className="proj-grid">
            <article className="proj reveal">
              <a className="proj-shot" href="https://born21.com" target="_blank" rel="noreferrer noopener">
                <img src="/projects/born21.jpg" alt="Born21 — YouTube growth agency website built by VIONICHE" width={1280} height={800} loading="lazy" decoding="async" />
              </a>
              <div className="proj-meta">
                <span className="proj-industry">YouTube Growth · Agency Site</span>
                <h3>Born21</h3>
                <p>Born21 is a YouTube growth agency in New York. We designed and built their site end to end — messaging, motion, case study pages and the front-end underneath.</p>
                <a className="proj-link" href="https://born21.com" target="_blank" rel="noreferrer noopener">Visit born21.com <span className="dot">→</span></a>
              </div>
            </article>

            <article className="proj proj-next reveal">
              <div className="proj-meta">
                <span className="proj-industry">Open</span>
                <h3>The next project</h3>
                <p>We could fill this page with concepts and call it a portfolio. The space stays empty until there is real work to put in it, and the next one could be yours.</p>
                <a className="proj-link" href="#contact">Start a project <span className="dot">→</span></a>
              </div>
            </article>
          </div>
        </div>
      </section>
    </>
  );
}
