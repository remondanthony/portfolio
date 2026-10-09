import type { ReactNode } from 'react';
import Nav from '@/components/Nav';
import Footer from '@/components/Footer';
import BackToTop from '@/components/BackToTop';
import SiteEffects from '@/components/SiteEffects';
import '@/components/blog/blog.css';

/**
 * The shell shared by /blog and every article: the site's own nav and footer,
 * pointed back at the homepage sections, and the same reveal and nav effects.
 */
export default function BlogLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <Nav base="/" />
      <span id="top" />
      <main>{children}</main>
      <Footer base="/" />
      <BackToTop />
      <SiteEffects />
    </>
  );
}
