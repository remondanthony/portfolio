import HeroWorld from './HeroWorld';

export default function Hero() {
  return (
    <>
      <section className="hero-blank">
        {/* Backdrop only — sits at z-index 0 beneath the approved hero content,
            which is untouched below. Replaces the former back.png artwork. */}
        <HeroWorld />
        <div className="hero-wrap">
          <div className="hero-lead">
            <h1 className="hero-title">Creative<br />Studio</h1>
          </div>
          <div className="hero-tag">
            <h2>Great design should feel effortless.</h2>
            <p>From design to deploy, we build websites that connect and convert.</p>
          </div>
          <div className="hero-services">
            <div><span className="hs-n">#01</span><span className="hs-t">Web Design</span></div>
            <div><span className="hs-n">#02</span><span className="hs-t">Web Development</span></div>
            <div><span className="hs-n">#03</span><span className="hs-t">E-commerce</span></div>
            <div><span className="hs-n">#04</span><span className="hs-t">SEO &amp; Performance</span></div>
          </div>
        </div>
      </section>
    </>
  );
}
