export default function Work() {
  return (
    <>
      <section id="work">
        <div className="wrap">
          <div className="svc-head reveal">
            <div>
              <span className="eyebrow"><span className="n">03</span> Selected work</span>
              <h2 className="title" style={{marginTop: '18px'}}>Recent <b>projects.</b></h2>
            </div>
            <p className="lead" style={{margin: '0'}}>A snapshot across industries — each one designed, built and launched by us.</p>
          </div>
          <div className="work-grid">
            <article className="work wide reveal"><div className="bg w-ivory"></div><div className="go">→</div><span className="cat">Healthcare · Landing Page</span><h3>Ivory Clinic</h3><p>A premium dental landing page with a chrome hero and a booking flow that lifted consultations.</p></article>
            <article className="work narrow reveal"><div className="bg w-nimbus"></div><div className="go">→</div><span className="cat">SaaS · Product</span><h3>Nimbus</h3></article>
            <article className="work narrow reveal"><div className="bg w-maison"></div><div className="go">→</div><span className="cat">Fashion · E-commerce</span><h3>Maison</h3></article>
            <article className="work narrow reveal"><div className="bg w-ora"></div><div className="go">→</div><span className="cat">Photography · Portfolio</span><h3>Ora Studio</h3></article>
            <article className="work narrow reveal"><div className="bg w-zest"></div><div className="go">→</div><span className="cat">Food &amp; Drink · Brand</span><h3>Zest</h3><p>A bold cold-pressed juice brand with a subscription store built for speed and repeat orders.</p></article>
          </div>
        </div>
      </section>
    </>
  );
}
