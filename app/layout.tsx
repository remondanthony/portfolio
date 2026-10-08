import type { Metadata } from 'next';
import './globals.css';

/**
 * Written for search intent, not for the brand voice.
 *
 * The title is 58 characters because Google truncates a result title at
 * roughly 60 — anything past that is cut with an ellipsis, so a keyword
 * sitting at position 70 is a keyword nobody reads. It front-loads the terms
 * someone actually types ("web design studio", "small businesses", "India")
 * and keeps the brand first only because a studio's name has to survive
 * direct navigation too.
 *
 * The description is 144 characters, inside the ~155 Google renders. It is
 * not a ranking factor, it is the click: it names the service, the two
 * qualities a small business asks about first, and where the studio is.
 *
 * Every claim in it is one the page already makes and can stand behind —
 * mobile-first and built-to-rank are the hero's own words. There is no
 * client count, no years-in-business and no results figure, because there is
 * nothing to back one with yet.
 */
export const metadata: Metadata = {
  metadataBase: new URL('https://www.vioniche.com'),
  alternates: {
    canonical: '/',
  },
  title: 'VIONICHE — Web Design Studio for Small Businesses in India',
  description:
    'Custom website design and development for small businesses. Fast, mobile-first sites built to rank on Google. Based in India, working worldwide.',
};

/**
 * Start every load at the top of the hero.
 *
 * Browsers restore the previous scroll position on reload, which on this page
 * drops the visitor into the middle of the pinned hero build — a half-drawn
 * MacBook, with no way to tell what they missed.
 *
 * Setting history.scrollRestoration = 'manual' is the documented fix and it is
 * not sufficient on its own. Safari in particular re-applies the old position
 * asynchronously, after load and after this script has run, so a single
 * scrollTo at parse time is overwritten a moment later — which is exactly what
 * "it still starts in a random place" looks like. iOS pull-to-refresh behaves
 * the same way.
 *
 * So the top is held rather than merely set: for a short window after load,
 * any scroll the page did not ask for is undone on the next frame. Three
 * things stop it, and any one is enough —
 *
 *   the window expires (1.5s, long enough to outlast a late restore),
 *   the visitor touches the page (wheel, touch, key, pointer, or scrollbar),
 *   or the URL has a hash, in which case it never starts at all.
 *
 * That last point keeps deep links working: /#contact from the nav, the footer
 * or a shared URL still lands on Contact. And because real input cancels the
 * hold immediately, a visitor who scrolls the instant the page appears is
 * never fought — the guard is already gone by the time their gesture lands.
 */
const SCROLL_RESET = `
(function () {
  try {
    if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
    if (location.hash) return;

    window.scrollTo(0, 0);

    var release = false;
    var until = Date.now() + 1500;
    var events = ['wheel', 'touchstart', 'keydown', 'pointerdown', 'mousedown'];

    function stop() {
      release = true;
      for (var i = 0; i < events.length; i++) {
        window.removeEventListener(events[i], stop);
      }
    }
    for (var i = 0; i < events.length; i++) {
      window.addEventListener(events[i], stop, { passive: true });
    }

    function hold() {
      if (release || Date.now() > until) return stop();
      if (window.scrollY !== 0) window.scrollTo(0, 0);
      requestAnimationFrame(hold);
    }
    requestAnimationFrame(hold);
  } catch (e) {}
})();
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
