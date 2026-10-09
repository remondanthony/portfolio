import Shot from '../Shot';

/**
 * The live homepage, not a mockup and not a Search Console chart: the first
 * thing a prospective client should see is the thing that was built.
 *
 * The capture is the real born21.com at 1440×900, taken after its entrance
 * animation had finished. The older /projects/born21.jpg caught the headline
 * mid-reveal, with its second line clipped.
 */
const SCOPE = ['Website Development', 'Technical SEO', 'Content Infrastructure', 'Deployment Automation'];

export default function Born21Hero() {
  return (
    <section className="cs-hero" aria-labelledby="cs-title">
      <div className="wrap">
        <div className="cs-hero-grid">
          <div className="reveal">
            <nav className="eyebrow cs-crumb" aria-label="Breadcrumb">
              <a href="/#work">Work</a>
              <span aria-hidden="true">/</span>
              <span aria-current="page">Case study</span>
            </nav>
            {/* One heading for the name and the scope beneath it. Every word
                is visible on the page; nothing is added for search engines
                that a reader does not also see. */}
            <h1 id="cs-title" className="cs-h1">
              <span className="cs-hero-title">Born21</span>{' '}
              <span className="cs-disc">
                {SCOPE.map((s, i) => (
                  <span key={s}>
                    {i > 0 && <span className="cs-x" aria-hidden="true">× </span>}
                    {s}{' '}
                  </span>
                ))}
              </span>
            </h1>
          </div>
          <div className="cs-hero-side reveal">
            <p className="cs-hero-lead">Building the digital foundation behind Born21&rsquo;s online presence.</p>
            <a className="btn btn-dark" href="https://born21.com" target="_blank" rel="noopener noreferrer">
              View Live Website<span className="cs-sr"> (opens in a new tab)</span> <span className="dot cs-ext">↗</span>
            </a>
          </div>
        </div>

        <Shot
          className="cs-hero-shot"
          src="/case-studies/born21/hero.jpg"
          alt="The Born21 homepage: the headline “We build brands that outlast algorithms.” over a dark, motion-blurred portrait, with a Work with us link and a row of client logos."
          width={2400}
          height={1500}
          sizes="(min-width: 1280px) 1152px, 92vw"
          chrome="born21.com"
          priority
          zoom={false}
        />
      </div>
    </section>
  );
}
