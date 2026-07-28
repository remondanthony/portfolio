import Nav from '@/components/Nav';
import Hero from '@/components/Hero';
import About from '@/components/About';
import Industries from '@/components/Industries';
import Work from '@/components/Work';
import Marquee from '@/components/Marquee';
import Process from '@/components/Process';
import Services from '@/components/Services';
import Faq from '@/components/Faq';
import CallToAction from '@/components/CallToAction';
import Contact from '@/components/Contact';
import Footer from '@/components/Footer';
import BackToTop from '@/components/BackToTop';
import SiteEffects from '@/components/SiteEffects';

/**
 * Homepage order.
 *
 * The page answers one question per section, each raised by the one before:
 *
 *   Hero .......... what is this
 *   About ......... how do you think        (01 Our approach)
 *   Industries .... is this for me          (02 Industries)
 *   Work .......... has it worked           (03 Work)
 *   Process ....... what happens if I say yes   (04, dark section, no eyebrow)
 *   Services ...... what do I actually get  (05 Why Vioniche)
 *   Faq ........... what am I still unsure about  (06 Common questions)
 *   CallToAction .. so, shall we
 *   Contact ....... here is how             (07 Contact)
 *
 * Testimonials was removed rather than reordered. Its three quotes were
 * invented, and a fabricated review sits worse on this page than a missing
 * one — the section returns when there is something real to put in it.
 *
 * Marquee stays between Work and Process as a breather between the two
 * heaviest sections; it names the stack rather than making a claim.
 */
export default function Home() {
  return (
    <>
      <Nav />
      <span id="top" />
      <Hero />
      <About />
      <hr className="divider" />
      <Industries />
      <hr className="divider" />
      <Work />
      <Marquee />
      <Process />
      <hr className="divider" />
      <Services />
      <hr className="divider" />
      <Faq />
      <CallToAction />
      <Contact />
      <Footer />
      <BackToTop />
      <SiteEffects />
    </>
  );
}
