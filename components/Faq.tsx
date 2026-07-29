/**
 * FAQ.
 *
 * Built on <details>/<summary> rather than a JS accordion: it is keyboard
 * accessible and findable by in-page search for free, it works before
 * hydration, and it needs no state. The mark and the expand are both CSS.
 *
 * NOTE ON THE TIMELINE ANSWER: this copy was set by the client and quotes
 * "2–6 weeks". The previous version deliberately refused to quote a duration,
 * on the grounds that one shipped project is not a track record. Read as a
 * forward commitment rather than a historical average it is defensible, but it
 * is a number the studio will be held to, and it is the only claim on this
 * page of that kind.
 */

const FAQS = [
  {
    q: 'How long does a project take?',
    a: 'Most projects are completed within 2–6 weeks, depending on the scope. After our discovery call, you’ll receive a clear timeline so you always know what happens next.',
  },
  {
    q: 'How much does a website cost?',
    a: 'Every project is quoted individually because every business has different goals. Once we understand your requirements, we’ll provide a fixed proposal with no hidden costs.',
  },
  {
    q: 'What happens after the site goes live?',
    a: 'Launching your website isn’t the end of the project. We monitor everything closely, fix any unexpected issues, and make sure your website performs exactly as intended.',
  },
  {
    q: 'Do you help with hosting and domains?',
    a: 'Yes. We can help you choose, purchase and configure your hosting and domain. If you already have them, we’ll work with your existing setup.',
  },
  {
    q: 'Do I need a maintenance plan?',
    a: 'Not necessarily. Your website is built to be easy to manage, but if you’d rather stay hands-off, we also offer ongoing maintenance and support whenever you need it.',
  },
  {
    q: 'Why trust a new studio?',
    a: 'Vioniche may be a new studio, but every project receives direct attention from the person designing and building it. We focus on thoughtful design, custom development and long-term partnerships rather than rushing through high volumes of work.',
  },
  {
    q: 'What happens after we contact you?',
    a: 'We’ll start with a short conversation about your business, goals and timeline. If we’re a good fit, we’ll prepare a clear proposal outlining the scope, timeline and next steps—no pressure and no obligation.',
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
            <p className="lead" style={{margin: '0'}}>Honest answers about timelines, pricing and everything that happens after launch. If you still have a question, we&rsquo;re only a message away.</p>
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
