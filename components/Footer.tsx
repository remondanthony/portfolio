export default function Footer() {
  return (
    <>
      <footer>
        <div className="wrap">
          <div className="foot-grid">
            <div className="foot-brand">
              <a href="#top" className="logo"><img className="logo-img" src="/logo.png" alt="VIONICHE logo" /><span>VIONICHE<small>WEB STUDIO</small></span></a>
              <p>A senior web &amp; product studio designing and building high-end websites. Berlin, working worldwide.</p>
            </div>
            <div className="foot-col"><h4>Studio</h4><a href="#work">Work</a><a href="#services">Services</a><a href="#process">Process</a><a href="#about">About</a></div>
            <div className="foot-col"><h4>Services</h4><a href="#services">Web Design</a><a href="#services">Development</a><a href="#services">E-commerce</a><a href="#services">Web Apps</a></div>
            <div className="foot-col"><h4>Connect</h4><a href="mailto:hello@vioniche.studio">Email</a><a href="#">Twitter / X</a><a href="#">Instagram</a><a href="#">LinkedIn</a></div>
          </div>
          <div className="foot-bottom">
            <span>© 2026 VIONICHE Web Studio. All rights reserved.</span>
            <span>Privacy · Terms · Imprint</span>
          </div>
        </div>
      </footer>
    </>
  );
}
