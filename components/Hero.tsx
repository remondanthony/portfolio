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
            <h1 className="hero-title">Ideas Become<br />Websites.</h1>
          </div>
          <div className="hero-tag">
            <h2>Built to impress.<br />Designed to convert.</h2>
            <p>We craft premium websites that build trust, elevate brands, and turn visitors into customers.</p>
          </div>
          <div className="hero-services">
            <div><span className="hs-n">#01</span><span className="hs-t">Strategy</span></div>
            <div><span className="hs-n">#02</span><span className="hs-t">Design</span></div>
            <div><span className="hs-n">#03</span><span className="hs-t">Development</span></div>
            <div><span className="hs-n">#04</span><span className="hs-t">Launch</span></div>
          </div>
        </div>
      </section>
    </>
  );
}
