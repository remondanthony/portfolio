const OBJECTIVES = [
  ['Website', 'A modern, responsive digital presence.'],
  ['Content', 'A scalable blog and publishing workflow.'],
  ['Search', 'Technical foundations for crawling, indexing and SEO.'],
  ['Operations', 'A repeatable development and deployment workflow.'],
];

export default function Born21Challenge() {
  return (
    <section className="cs-dark" aria-labelledby="cs-challenge">
      <div className="wrap">
        <div className="reveal">
          <span className="eyebrow"><span className="n">02</span> The challenge</span>
          <h2 id="cs-challenge" className="cs-statement">
            Build a website that could look professional <em>today</em> — while being structured to
            grow <em>tomorrow.</em>
          </h2>
        </div>

        <ol className="cs-objectives">
          {OBJECTIVES.map(([name, text], i) => (
            <li key={name} className="reveal" style={{ transitionDelay: `${i * 80}ms` }}>
              <span className="cs-obj-n">{String(i + 1).padStart(2, '0')}</span>
              <h3>{name}</h3>
              <p>{text}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
