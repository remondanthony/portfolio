/**
 * Industries we build for.
 *
 * Every card is a CONCEPT, not a client engagement, and the markup says so in
 * three places: the badge on each frame, the section lead, and the alt-free
 * abstract mockup itself — there is no screenshot here because there is no
 * site to screenshot. Fabricating one would undo the point of the section.
 *
 * The mockups are drawn in CSS from a single hue per industry, so the grid
 * reads as eight distinct pieces of work without eight image downloads.
 */

const INDUSTRIES = [
  { name: 'Fitness',           line: 'Class timetables and memberships that convert.', hue: 6 },
  { name: 'Healthcare',        line: 'Trust first, then an easy appointment.',         hue: 196 },
  { name: 'Restaurant',        line: 'Menus, hours and reservations without friction.', hue: 36 },
  { name: 'Law Firm',          line: 'Authority, clarity and better enquiry quality.',  hue: 224 },
  { name: 'Beauty & Skincare', line: 'Treatment menus and repeat product orders.',      hue: 338 },
  { name: 'Real Estate',       line: 'Listings that stay current and searchable.',      hue: 152 },
  { name: 'Education',         line: 'Courses, open days and clear enrolment.',         hue: 262 },
  { name: 'Boutique',          line: 'A catalogue that feels like the shop.',           hue: 92 },
];

export default function Industries() {
  return (
    <>
      <section id="industries">
        <div className="wrap">
          <div className="svc-head reveal">
            <div>
              <span className="eyebrow"><span className="n">02</span> Industries</span>
              <h2 className="title" style={{marginTop: '18px'}}>Built for <b>ambitious businesses.</b></h2>
            </div>
            <p className="lead" style={{margin: '0'}}>Goals change from one industry to the next. The site should change with them.</p>
          </div>

          <div className="ind-grid">
            {INDUSTRIES.map((i) => (
              <article className="ind reveal" key={i.name} style={{['--h' as string]: i.hue}}>
                <div className="ind-frame">
                  <div className="ind-chrome" aria-hidden="true">
                    <i /><i /><i />
                    <span className="ind-url" />
                  </div>
                  <div className="ind-view" aria-hidden="true">
                    <span className="ind-nav" />
                    <span className="ind-h1" />
                    <span className="ind-h2" />
                    <span className="ind-cta" />
                    <span className="ind-media" />
                    <span className="ind-row"><i /><i /><i /></span>
                  </div>
                  <span className="ind-badge">Studio concept</span>
                </div>
                <h3>{i.name}</h3>
                <p>{i.line}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
