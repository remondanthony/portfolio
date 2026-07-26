export default function Testimonials() {
  return (
    <>
      <section id="reviews">
        <div className="wrap">
          <div className="reveal">
            <span className="eyebrow"><span className="n">05</span> Kind words</span>
            <h2 className="title" style={{marginTop: '18px'}}>Clients who <b>trust us.</b></h2>
          </div>
          <div className="quotes">
            <figure className="quote reveal"><div className="stars">★★★★★</div><blockquote>"VIONICHE rebuilt our site and bookings jumped within a month. Genuinely senior people who care about the result."</blockquote><figcaption className="who"><span className="av">DR</span><div><b>Dr. Anna Roth</b><span>Ivory Clinic</span></div></figcaption></figure>
            <figure className="quote reveal"><div className="stars">★★★★★</div><blockquote>"Fast, communicative and seriously talented. We shipped ahead of schedule and the code is a joy to work with."</blockquote><figcaption className="who"><span className="av">MP</span><div><b>Maria Pérez</b><span>Nimbus</span></div></figcaption></figure>
            <figure className="quote reveal"><div className="stars">★★★★★</div><blockquote>"They treated our budget like it mattered and delivered a store that looks and performs beautifully."</blockquote><figcaption className="who"><span className="av">SM</span><div><b>Sam Marra</b><span>Zest</span></div></figcaption></figure>
          </div>
        </div>
      </section>
    </>
  );
}
