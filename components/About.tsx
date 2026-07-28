/**
 * The approach section.
 *
 * The four cards reuse the site's existing `.card` pattern rather than a
 * parallel one of their own — same panel, border, radius, hover lift and
 * number style as the services grid. A second card language would have to be
 * kept in step with the first forever; this one is free.
 */

const STEPS = [
  { no: '01', title: 'Strategy First', body: 'Every project starts by understanding your business.' },
  { no: '02', title: 'Thoughtful Design', body: 'Every decision should solve a real problem.' },
  { no: '03', title: 'Precision Development', body: 'Fast, responsive and engineered for reliability.' },
  { no: '04', title: 'Ready to Launch', body: 'Every website is tested, refined and ready to grow.' },
];

export default function About() {
  return (
    <>
      <section id="about">
        <div className="wrap intro-grid">
          <div className="intro reveal">
            <span className="eyebrow"><span className="n">01</span> Our approach</span>
            <h2 style={{marginTop: '20px'}}>Every website begins with <b>understanding your business.</b></h2>
            <p>We combine strategy, design and development to create premium websites that are fast, memorable and built to support real business growth.</p>
            <div style={{marginTop: '30px'}}><a href="#work" className="btn btn-dark">Explore Projects <span className="dot">→</span></a></div>
          </div>
          <div className="approach reveal">
            {STEPS.map((s) => (
              <article className="card" key={s.no}>
                <span className="no">{s.no}</span>
                <h3>{s.title}</h3>
                <p>{s.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
