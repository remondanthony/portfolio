import IndustryPreview from './industries/IndustryPreview';
import { CONCEPTS } from './industries/concepts';

/**
 * Industries we build for.
 *
 * Each card holds a working concept site rather than a wireframe. They render
 * complete on the server; a scripted sequence runs once when the card first
 * enters the viewport — shimmer, fade, a cursor crossing to the primary
 * button, a click, a slow scroll to the section below. Then it stops for good.
 *
 * The copy is invented but checked: the restaurant was originally "Sorrel",
 * which is a real Michelin-starred restaurant, so it became Sedge. Concept
 * work that borrows a real business's name stops being concept work.
 */

const LINES: Record<string, { name: string; line: string }> = {
  fitness:    { name: 'Fitness & Wellness', line: 'Class schedules and memberships that convert.' },
  healthcare: { name: 'Healthcare',         line: 'Trust first. Appointments second.' },
  restaurant: { name: 'Restaurant',         line: 'Menus, reservations and ordering that feel effortless.' },
  boutique:   { name: 'Boutique',           line: 'Products that deserve a premium storefront.' },
  beauty:     { name: 'Beauty & Skincare',  line: 'Treatments booked as easily as they are browsed.' },
  realestate: { name: 'Real Estate',        line: 'Listings that stay current and worth lingering on.' },
  education:  { name: 'Education',          line: 'Courses and enrolment without the paperwork feeling.' },
  law:        { name: 'Law Firm',           line: 'Authority, clarity and confidence.' },
};

const ORDER = ['fitness', 'healthcare', 'restaurant', 'boutique', 'beauty', 'realestate', 'education', 'law'];

export default function Industries() {
  return (
    <>
      <section id="industries" className="industries">
        <div className="wrap">
          <header className="ind-head">
            <span className="ind-eyebrow reveal">02 — Industries we build for</span>
            <h2 className="ind-title reveal">Built for <em>ambitious</em> businesses.</h2>
            <p className="ind-lead reveal">
              Goals change from one industry to the next.
              <br />
              Your website should change with them.
            </p>
          </header>

          <div className="ind-grid reveal">
            {ORDER.map((key, n) => {
              const c = CONCEPTS.find((x) => x.key === key)!;
              const meta = LINES[key];
              return (
                <article className="ind" key={key} data-ind={key} style={{ ['--i' as string]: n }}>
                  <div className="ind-frame">
                    <div className="ind-chrome" aria-hidden="true">
                      <i /><i /><i />
                      <span className="ind-url" />
                    </div>
                    <div className="ind-view">
                      <IndustryPreview c={c} />
                    </div>
                  </div>
                  <span className="ind-pill">Concept</span>
                  <h3>{meta.name}</h3>
                  <p>{meta.line}</p>
                </article>
              );
            })}
          </div>

          <aside className="ind-cta reveal">
            <div>
              <h3>Don&rsquo;t see your industry?</h3>
              <p>We like solving a problem we haven&rsquo;t solved before. Tell us about yours.</p>
            </div>
            <a className="btn btn-accent" href="#contact">Discuss your project <span className="dot">&rarr;</span></a>
          </aside>
        </div>
      </section>
    </>
  );
}
