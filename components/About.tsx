export default function About() {
  return (
    <>
      <section id="about">
        <div className="wrap intro-grid">
          <div className="intro reveal">
            <span className="eyebrow"><span className="n">01</span> Web &amp; product studio</span>
            <h2 style={{marginTop: '20px'}}>We design &amp; build websites that <b>mean business.</b></h2>
            <p>VIONICHE is a small, senior team of designers and developers. We craft high-end websites, landing pages and web apps — like the Ivory Clinic project above — engineered to load fast, rank well and turn visitors into customers.</p>
            <div style={{marginTop: '30px'}}><a href="#work" className="btn btn-dark">See our work <span className="dot">→</span></a></div>
          </div>
          <div className="stats reveal">
            <div className="st"><div className="v" data-count="120"><span className="val">0</span><span className="s">+</span></div><div className="l">Projects shipped</div></div>
            <div className="st"><div className="v" data-count="60"><span className="val">0</span><span className="s">+</span></div><div className="l">Happy clients</div></div>
            <div className="st"><div className="v" data-count="8"><span className="val">0</span><span className="s"> yrs</span></div><div className="l">In business</div></div>
            <div className="st"><div className="v" data-count="4.9"><span className="val">0</span><span className="s">/5</span></div><div className="l">Client rating</div></div>
          </div>
        </div>
      </section>
    </>
  );
}
