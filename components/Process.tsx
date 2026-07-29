export default function Process() {
  return (
    <>
      <section id="process" className="how reveal">
        <div className="wrap">
          <h2 className="how-title">From Strategy to <em>Launch</em></h2>
          <p className="how-lead">
            Every website follows a carefully planned journey—from understanding your
            business to launching an experience built to perform.
          </p>
          <div className="how-grid">
            {/* Geometry untouched: every coordinate here was hand-placed and is
                left exactly as it was. Only the stroke and fill values changed —
                the line carries a little more contrast, and the final milestone
                sits in a soft halo so the eye lands on the end of the journey. */}
            <svg className="how-line" viewBox="0 0 900 560" fill="none" preserveAspectRatio="none" aria-hidden="true">
              <path d="M150 96 L500 96 C652 96 722 140 722 236 L722 300" stroke="rgba(255,255,255,.34)" strokeWidth="1.6" />
              <path d="M720 300 L402 300 L242 300 C150 300 120 336 120 402" stroke="rgba(255,255,255,.34)" strokeWidth="1.6" />
              <circle cx="150" cy="96" r="5" fill="rgba(255,255,255,.62)" />
              <circle cx="440" cy="96" r="5" fill="rgba(255,255,255,.62)" />
              <circle cx="720" cy="300" r="5" fill="rgba(255,255,255,.62)" />
              <circle cx="402" cy="300" r="5" fill="rgba(255,255,255,.62)" />
              <circle cx="120" cy="404" r="14" fill="#ff5b1e" opacity=".16" />
              <circle cx="120" cy="404" r="7" fill="#ff6f2e" />
            </svg>
            <div className="stage s-discover"><h3>Discover</h3><ul><li>Client Brief</li><li>Market Research</li><li>Target Audience</li></ul></div>
            <div className="stage s-define"><h3>Strategy</h3><ul><li>Scope &amp; Priorities</li><li>Website Requirements</li><li>Site Map</li></ul></div>
            <div className="stage s-design"><h3>Design</h3><ul><li>Wireframes</li><li>UI Design</li><li>Responsive Layout</li></ul></div>
            <div className="stage s-develop"><h3>Build &amp; Launch</h3><ul><li>Development</li><li>CMS &amp; Interactions</li><li>Live Deployment</li></ul></div>
            <img className="how-phone" src="/how-phone.png" alt="Website mockup on a phone held in hand" />
          </div>
        </div>
      </section>
    </>
  );
}
