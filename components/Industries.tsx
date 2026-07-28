/**
 * Industries we build for.
 *
 * The previous version drew one wireframe and rotated its hue eight times.
 * That quietly said "we recolour a template" — the exact opposite of the
 * promise two sections later, and the opposite of what this section exists to
 * demonstrate. Every preview is now a DIFFERENT layout: a restaurant gets a
 * menu with price leaders, a boutique gets a product grid, a law firm gets a
 * centred serif column. The layout is the argument.
 *
 * Every preview is drawn in CSS. There is no photography here because there
 * is none to use, and a stock photo dressed as a client's site would undo the
 * CONCEPT pill sitting on top of it. The "image" areas are gradients composed
 * to read as photography at this size.
 */

type Variant =
  | 'fitness' | 'healthcare' | 'restaurant' | 'boutique'
  | 'beauty' | 'realestate' | 'education' | 'law';

const INDUSTRIES: { v: Variant; name: string; line: string }[] = [
  { v: 'fitness',    name: 'Fitness & Wellness', line: 'Class schedules and memberships that convert.' },
  { v: 'healthcare', name: 'Healthcare',         line: 'Trust first. Appointments second.' },
  { v: 'restaurant', name: 'Restaurant',         line: 'Menus, reservations and ordering that feel effortless.' },
  { v: 'boutique',   name: 'Boutique',           line: 'Products that deserve a premium storefront.' },
  { v: 'beauty',     name: 'Beauty & Skincare',  line: 'Treatments booked as easily as they are browsed.' },
  { v: 'realestate', name: 'Real Estate',        line: 'Listings that stay current and worth lingering on.' },
  { v: 'education',  name: 'Education',          line: 'Courses and enrolment without the paperwork feeling.' },
  { v: 'law',        name: 'Law Firm',           line: 'Authority, clarity and confidence.' },
];

/** Each variant is its own composition — shared shell, different anatomy. */
function Preview({ v }: { v: Variant }) {
  switch (v) {
    case 'fitness':
      return (
        <>
          <span className="p-figure" />
          <span className="p-kicker" />
          <span className="p-title p-title-lg" />
          <span className="p-btn" />
          <span className="p-rows"><i /><i /><i /></span>
        </>
      );
    case 'healthcare':
      return (
        <>
          <span className="p-topbar" />
          <span className="p-title p-center" />
          <span className="p-sub p-center" />
          <span className="p-btn p-center-btn" />
          <span className="p-portrait" />
          <span className="p-badges"><i /><i /><i /></span>
        </>
      );
    case 'restaurant':
      return (
        <>
          <span className="p-dish" />
          <span className="p-title" />
          <span className="p-menu"><i /><i /><i /><i /></span>
          <span className="p-btn" />
        </>
      );
    case 'boutique':
      return (
        <>
          <span className="p-topbar" />
          <span className="p-shelf"><i /><i /><i /><i /></span>
          <span className="p-caption" />
        </>
      );
    case 'beauty':
      return (
        <>
          <span className="p-bottle" />
          <span className="p-title p-right" />
          <span className="p-list"><i /><i /><i /></span>
          <span className="p-btn p-btn-right" />
        </>
      );
    case 'realestate':
      return (
        <>
          <span className="p-hero" />
          <span className="p-listings"><i /><i /><i /></span>
          <span className="p-price" />
        </>
      );
    case 'education':
      return (
        <>
          <span className="p-topbar" />
          <span className="p-title" />
          <span className="p-tiles"><i /><i /><i /><i /><i /><i /></span>
        </>
      );
    case 'law':
      return (
        <>
          <span className="p-rule" />
          <span className="p-serif p-center" />
          <span className="p-serif p-serif-2 p-center" />
          <span className="p-rule p-rule-2" />
          <span className="p-cols"><i /><i /></span>
        </>
      );
  }
}

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
            {INDUSTRIES.map((i, n) => (
              <article className="ind" key={i.v} data-ind={i.v} style={{ ['--i' as string]: n }}>
                <div className="ind-frame">
                  <div className="ind-chrome" aria-hidden="true">
                    <i /><i /><i />
                    <span className="ind-url" />
                  </div>
                  <div className="ind-view" aria-hidden="true">
                    <Preview v={i.v} />
                  </div>
                </div>
                <span className="ind-pill">Concept</span>
                <h3>{i.name}</h3>
                <p>{i.line}</p>
              </article>
            ))}
          </div>

          <aside className="ind-cta reveal">
            <div>
              <h3>Don&rsquo;t see your industry?</h3>
              <p>We like solving a problem we haven&rsquo;t solved before. Tell us about yours.</p>
            </div>
            <a className="btn btn-accent" href="#contact">Discuss your project <span className="dot">→</span></a>
          </aside>
        </div>
      </section>
    </>
  );
}
