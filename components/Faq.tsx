/**
 * FAQ.
 *
 * Built on <details>/<summary> rather than a JS accordion: it is keyboard
 * accessible and findable by in-page search for free, it works before
 * hydration, and it needs no state. The only JS-shaped thing here is the
 * chevron, which is CSS.
 *
 * The answers deliberately explain HOW something works rather than quoting a
 * number. A studio with one shipped project cannot honestly promise a
 * turnaround or a price, and inventing one would undo the section.
 */

const FAQS = [
  {
    q: 'How long does a project take?',
    a: 'It depends on scope, and we would rather say that than quote a number we would have to walk back. A focused marketing site moves in weeks; a CMS, a store or custom application logic adds to that. We set dates together once the scope is settled, and the biggest variable is usually how quickly content and feedback come back.',
  },
  {
    q: 'How much does a website cost?',
    a: 'We quote per project rather than per hour, so you know the figure before anything starts. The number follows the scope: how many pages, whether you need a CMS, how much of the design is bespoke, and what has to be built rather than configured. After one call we can give you a realistic range, and once scope is agreed, a fixed price.',
  },
  {
    q: 'What happens after the site goes live?',
    a: 'We stay close in the weeks after launch, fixing anything that surfaces and making sure your team is comfortable running the site day to day. Beyond that, ongoing support is arranged separately and is always optional.',
  },
  {
    q: 'Do you handle hosting?',
    a: 'We can set it up and manage it, or you can host it yourself. Static sites and Next.js builds run well on platform hosting like Vercel — fast, inexpensive and close to no upkeep. Accounts are created in your name, so the domain, the hosting and the code stay yours.',
  },
  {
    q: 'Do I need a maintenance plan?',
    a: 'Not always. A static marketing site can sit for a long time with very little attention, while anything with a CMS, integrations or payments benefits from someone keeping dependencies current and watching for errors. We will tell you honestly which one you have, and only suggest a plan if it earns its place.',
  },
  {
    q: 'You have one project live. Why work with you?',
    a: 'Born21 is the site we have shipped and put our name to. It was designed, built and deployed by the same people who would work on yours, and anything else you see here is labelled as a concept because that is what it is. Judge us on that project, on this site, and on the first conversation.',
  },
];

export default function Faq() {
  return (
    <>
      <section id="faq">
        <div className="wrap">
          <div className="svc-head reveal">
            <div>
              <span className="eyebrow"><span className="n">06</span> Common questions</span>
              <h2 className="title" style={{marginTop: '18px'}}>The questions we <b>get asked first.</b></h2>
            </div>
            <p className="lead" style={{margin: '0'}}>Straight answers on timing, cost and what happens after launch. If something isn&rsquo;t covered here, ask us directly.</p>
          </div>

          <div className="faq-list reveal">
            {FAQS.map((f) => (
              <details className="faq" key={f.q}>
                <summary>
                  {f.q}
                  <i className="faq-mark" aria-hidden="true" />
                </summary>
                <p>{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
