/**
 * What every project includes.
 *
 * Six standards rather than six upsells — the heading's whole point is that
 * none of these are optional extras, so the copy stays as plain statements of
 * practice. Nothing here claims a result, because there is no shipped client
 * work on this page to evidence one.
 *
 * The icons, the grid, the card count and the numbering are deliberately
 * untouched.
 */

const ICON = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.7,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
} as const;

export default function Services() {
  return (
    <>
      <section id="services">
        <div className="wrap">
          <div className="svc-head reveal">
            <div>
              <span className="eyebrow"><span className="n">05</span> Every project includes</span>
              <h2 className="title" style={{marginTop: '18px'}}>Not add-ons. <b>Just how we build.</b></h2>
            </div>
            <p className="lead" style={{margin: '0'}}>These aren&rsquo;t premium extras. They&rsquo;re the standard for every project we deliver.</p>
          </div>

          <div className="svc-grid">
            <div className="card reveal">
              <div className="no">01</div>
              <div className="ic">
                <svg viewBox="0 0 24 24" {...ICON}><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M3 9h18M9 21V9" /></svg>
              </div>
              <h3>Fast By Default</h3>
              <p>Built to load quickly from the first decision, not patched into shape the week before launch.</p>
            </div>

            <div className="card reveal">
              <div className="no">02</div>
              <div className="ic">
                <svg viewBox="0 0 24 24" {...ICON}><polyline points="16 18 22 12 16 6" /><polyline points="8 6 2 12 8 18" /></svg>
              </div>
              <h3>Responsive By Design</h3>
              <p>Tested on real phones, tablets and desktops, so it looks right wherever a customer opens it.</p>
            </div>

            <div className="card reveal">
              <div className="no">03</div>
              <div className="ic">
                <svg viewBox="0 0 24 24" {...ICON}><circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" /><path d="M1 1h4l2.7 13.4a2 2 0 0 0 2 1.6h9.7a2 2 0 0 0 2-1.6L23 6H6" /></svg>
              </div>
              <h3>Findable From Day One</h3>
              <p>Structured so search engines can read your pages the day it launches, not months later.</p>
            </div>

            <div className="card reveal">
              <div className="no">04</div>
              <div className="ic">
                <svg viewBox="0 0 24 24" {...ICON}><rect x="2" y="3" width="20" height="14" rx="2" /><path d="M8 21h8M12 17v4" /></svg>
              </div>
              <h3>Written, Not Templated</h3>
              <p>No themes, no page builders. Your site is written for your business, and the code is yours to keep.</p>
            </div>

            <div className="card reveal">
              <div className="no">05</div>
              <div className="ic">
                <svg viewBox="0 0 24 24" {...ICON}><path d="M13 2L3 14h7l-1 8 10-12h-7z" /></svg>
              </div>
              <h3>Direct Communication</h3>
              <p>You talk to the person building your site. No account manager relaying messages.</p>
            </div>

            <div className="card reveal">
              <div className="no">06</div>
              <div className="ic">
                <svg viewBox="0 0 24 24" {...ICON}><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" /></svg>
              </div>
              <h3>Still Here After Launch</h3>
              <p>Launch isn&rsquo;t the end of it. Anything that surfaces in the first weeks gets fixed, and we stay reachable.</p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
