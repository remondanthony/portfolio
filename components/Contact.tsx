export default function Contact() {
  return (
    <>
      <section id="contact">
        <div className="wrap">
          <div className="reveal">
            <span className="eyebrow"><span className="n">07</span> Contact</span>
            <h2 className="title" style={{marginTop: '18px'}}>Let&rsquo;s build <b>your next website.</b></h2>
          </div>
          <div className="contact-grid">
            <div className="contact-info reveal">
              <div className="row"><div className="ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2" /><path d="m22 7-10 5L2 7" /></svg></div><div><div className="lbl">Email</div><div className="val">admin@vioniche.com</div></div></div>
              <div className="row"><div className="ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg></div><div><div className="lbl">Studio</div><div className="val">Based in India · Working Worldwide</div></div></div>
              <div className="row"><div className="ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg></div><div><div className="lbl">Hours</div><div className="val">Mon–Sat · 08:00–22:00 IST</div></div></div>
            </div>
            <form id="contactForm" className="reveal" noValidate>
              <div className="row2">
                <div className="field"><label htmlFor="name">Name</label><input id="name" name="name" type="text" placeholder="Your name" required /></div>
                <div className="field"><label htmlFor="email">Email</label><input id="email" name="email" type="email" placeholder="you@company.com" required /></div>
              </div>
              <div className="field"><label htmlFor="type">Project type</label>
                <select id="type" name="type">
                  <option>Website / Landing page</option>
                  <option>E-commerce store</option>
                  <option>Web app / SaaS</option>
                  <option>Branding &amp; design</option>
                  <option>Not sure yet</option>
                </select>
              </div>
              <div className="field"><label htmlFor="msg">Project details</label><textarea id="msg" name="msg" placeholder="Tell us what you're building…" required></textarea></div>
              {/* Honeypot. Off-screen rather than display:none, because some
                  bots skip hidden fields but almost all fill every input they
                  can see in the DOM. Never shown, never focusable, not read. */}
              <div className="hp" aria-hidden="true">
                <label htmlFor="company">Company</label>
                <input id="company" name="company" type="text" tabIndex={-1} autoComplete="off" />
              </div>
              <button type="submit" className="btn btn-dark" style={{alignSelf: 'flex-start'}}>Send message <span className="dot">→</span></button>
              <div className="form-ok" id="formOk"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{width: '18px', height: '18px'}}><polyline points="20 6 9 17 4 12" /></svg><span data-status-text>Thanks &mdash; we&rsquo;ll reply within one business day.</span></div>
            </form>
          </div>
        </div>
      </section>
    </>
  );
}
