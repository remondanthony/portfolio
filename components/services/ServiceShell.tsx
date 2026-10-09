import type { ReactNode } from 'react';
import Nav from '@/components/Nav';
import Footer from '@/components/Footer';
import Contact from '@/components/Contact';
import BackToTop from '@/components/BackToTop';
import SiteEffects from '@/components/SiteEffects';
import JsonLd from '@/components/JsonLd';
import '@/components/case-studies/case-study.css';
import './services.css';

/**
 * The frame every service page shares: the site's own nav and footer pointed
 * back at the homepage, the page, and the homepage's contact form as the
 * close — the same form, posting to the same endpoint, with the project type
 * already set to this service. Every call to action on the page lands on it.
 */
export default function ServiceShell({
  jsonLd,
  contact,
  children,
}: {
  jsonLd: object;
  contact: { eyebrow: string; title: ReactNode; type: string };
  children: ReactNode;
}) {
  return (
    <>
      <JsonLd data={jsonLd} />
      <Nav base="/" />
      <span id="top" />
      <main>
        {children}
        <Contact eyebrow={contact.eyebrow} title={contact.title} type={contact.type} />
      </main>
      <Footer base="/" />
      <BackToTop />
      <SiteEffects />
    </>
  );
}
