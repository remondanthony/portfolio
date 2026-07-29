import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'VIONICHE — Web & Product Studio',
  description:
    'A senior web & product studio designing and building high-end websites. Berlin, working worldwide.',
};

/**
 * Start every load at the top of the hero.
 *
 * Browsers restore the previous scroll position on reload, which on this page
 * drops the visitor into the middle of the pinned hero build — a half-drawn
 * MacBook, with no way to tell what they missed. Turning restoration off has
 * to happen before the browser acts on it, which is why this is a blocking
 * inline script in <head> rather than an effect: by the time React hydrates,
 * the page has already been scrolled and the visitor has already seen it.
 *
 * The hash check keeps deep links working. Arriving at /#contact from the nav,
 * the footer or a shared URL must still land on Contact; only a plain load is
 * sent to the top.
 */
const SCROLL_RESET = `
if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
if (!location.hash) window.scrollTo(0, 0);
`.trim();

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <script dangerouslySetInnerHTML={{ __html: SCROLL_RESET }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
