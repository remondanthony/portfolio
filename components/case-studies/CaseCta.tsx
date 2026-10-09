/**
 * The closing call, in the homepage's own .cta block. Contact lives on the
 * homepage, so this links there rather than to a contact route that does not
 * exist.
 */
export default function CaseCta() {
  return (
    <section aria-labelledby="cs-cta">
      <div className="wrap">
        <div className="cta reveal">
          <div className="halo" aria-hidden="true" />
          <h2 id="cs-cta">Built to launch.{' '}<br /><b>Built to grow.</b></h2>
          <p>Have a digital project that needs more than just a website?</p>
          <div className="actions">
            <a className="btn btn-dark" href="/#contact">Start a project <span className="dot">→</span></a>
            <a className="btn btn-ghost" href="/#process">See how we work</a>
          </div>
        </div>
      </div>
    </section>
  );
}
