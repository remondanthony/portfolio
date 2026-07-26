export default function Nav() {
  return (
    <>
      <header className="nav" id="nav">
        <div className="wrap nav-inner">
          <a href="#top" className="logo">
            <img className="logo-img" src="/logo.png" alt="VIONICHE logo" />
            <span>VIONICHE<small>WEB STUDIO</small></span>
          </a>
          <nav className="links">
            <a href="#work">Work</a>
            <a href="#services">Services</a>
            <a href="#process">Process</a>
            <a href="#about">About</a>
            <a href="#contact">Contact</a>
          </nav>
          <div className="nav-right">
            <a href="#contact" className="btn btn-dark">Start a project <span className="dot">→</span></a>
            <button className="hamburger" id="ham" aria-label="Open menu" aria-expanded="false"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="4" y1="8" x2="20" y2="8" /><line x1="4" y1="16" x2="20" y2="16" /></svg></button>
          </div>
        </div>
      </header>
      <div className="mobile-menu" id="mobileMenu">
        <a href="#work">Work</a>
        <a href="#services">Services</a>
        <a href="#process">Process</a>
        <a href="#about">About</a>
        <a href="#contact">Contact</a>
        <a href="#contact" className="btn btn-dark cta" style={{justifyContent: 'center'}}>Start a project <span className="dot">→</span></a>
      </div>
    </>
  );
}
