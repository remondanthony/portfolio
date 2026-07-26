export default function Process() {
  return (
    <>
      <section id="process" className="how reveal">
        <div className="wrap">
          <h2 className="how-title">How We <em>Design</em><br />Your Website</h2>
          <div className="how-grid">
            <svg className="how-line" viewBox="0 0 900 560" fill="none" preserveAspectRatio="none" aria-hidden="true">
              <path d="M150 96 L500 96 C652 96 722 140 722 236 L722 300" stroke="rgba(255,255,255,.26)" strokeWidth="1.6" />
              <path d="M720 300 L402 300 L242 300 C150 300 120 336 120 402" stroke="rgba(255,255,255,.26)" strokeWidth="1.6" />
              <circle cx="150" cy="96" r="5" fill="rgba(255,255,255,.55)" />
              <circle cx="440" cy="96" r="5" fill="rgba(255,255,255,.55)" />
              <circle cx="720" cy="300" r="5" fill="rgba(255,255,255,.55)" />
              <circle cx="402" cy="300" r="5" fill="rgba(255,255,255,.55)" />
              <circle cx="120" cy="404" r="7" fill="#ff5b1e" />
            </svg>
            <div className="stage s-discover"><h3>Discover</h3><ul><li>Client Brief</li><li>Market Research</li><li>Target Audience</li></ul></div>
            <div className="stage s-define"><h3>Define</h3><ul><li>Business Goals</li><li>Website Requirements</li><li>Site Map</li></ul></div>
            <div className="stage s-design"><h3>Design</h3><ul><li>Wireframes</li><li>UI Design</li><li>Responsive Layout</li></ul></div>
            <div className="stage s-develop"><h3>Develop &amp; Deliver</h3><ul><li>Development</li><li>CMS &amp; Interactions</li><li>Live Deployment</li></ul></div>
            <img className="how-phone" src="/how-phone.png" alt="Website mockup on a phone held in hand" />
          </div>
        </div>
      </section>
    </>
  );
}
