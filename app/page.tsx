import Nav from '@/components/Nav';
import Hero from '@/components/Hero';
import About from '@/components/About';
import Services from '@/components/Services';
import Work from '@/components/Work';
import Marquee from '@/components/Marquee';
import Process from '@/components/Process';
import Testimonials from '@/components/Testimonials';
import CallToAction from '@/components/CallToAction';
import Contact from '@/components/Contact';
import Footer from '@/components/Footer';
import BackToTop from '@/components/BackToTop';
import SiteEffects from '@/components/SiteEffects';

export default function Home() {
  return (
    <>
      <Nav />
      <span id="top" />
      <Hero />
      <About />
      <hr className="divider" />
      <Services />
      <hr className="divider" />
      <Work />
      <Marquee />
      <Process />
      <hr className="divider" />
      <Testimonials />
      <CallToAction />
      <Contact />
      <Footer />
      <BackToTop />
      <SiteEffects />
    </>
  );
}
