'use client';

import { useCallback, useEffect, useId, useRef, useState } from 'react';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { CTA_TEMPLATES, type CtaContent } from '@/lib/blog/cta';

/**
 * A small CTA card that floats in the bottom-right corner once a reader is
 * a quarter of the way through an article.
 *
 * Not a modal. There is no backdrop, nothing is dimmed, scrolling is never
 * locked and focus is never taken: the article stays fully readable and
 * clickable around it. It is a non-modal dialog that the reader can use or
 * close and carry on.
 *
 * - Nothing renders on load: no markup, no image request, no layout shift,
 *   and server and client agree on the first render. A little before the
 *   trigger it mounts hidden, so its image is already downloaded when it shows.
 * - One passive scroll listener, throttled to a frame and removed the moment
 *   the card shows. It shows only after the reader has scrolled — never on
 *   load, however short the article.
 * - Once per article view, and nothing is remembered: closing it keeps it
 *   closed while the reader stays on this article; another article, or the
 *   same one reloaded, gets its own chance. The trigger restarts whenever the
 *   pathname changes, so client-side navigation between articles resets it.
 * - Close with the button or Escape.
 *
 * Content comes from lib/blog/cta.ts; every prop is optional.
 */

const EXIT_MS = 240;
/** How far ahead of the trigger the hidden card mounts and starts loading its image. */
const PRIME_AHEAD = 0.1;

type Props = Partial<CtaContent> & {
  /** Reading progress through the article body at which the card shows, 0–1. */
  at?: number;
  /** The element whose reading progress counts. */
  target?: string;
};

export default function BlogCtaPopup({ at = 0.25, target = '.bl-prose', ...content }: Props) {
  const c = { ...CTA_TEMPLATES.general, ...stripEmpty(content) };
  const [phase, setPhase] = useState<'idle' | 'primed' | 'open' | 'closing'>('idle');
  const cardRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const descId = useId();
  const pathname = usePathname();

  // Trigger: a quarter of the way through this article, after a real scroll.
  // Restarts for every pathname, so each article view gets one showing.
  useEffect(() => {
    setPhase((p) => (p === 'idle' ? p : 'idle'));
    let frame = 0;
    // Only a reader moving down the page can trigger it. After a client-side
    // navigation the new article briefly renders at the previous one's scroll
    // position, then scrolls up to the top; ignoring upward movement means that
    // stale position can never show the card the moment the page changes.
    let lastY = window.scrollY;
    const check = () => {
      frame = 0;
      // Looked up on every check, so it works even if the body renders after this.
      const article = document.querySelector<HTMLElement>(target);
      if (!article) return;
      const r = article.getBoundingClientRect();
      if (r.height <= 0) return;
      // How far the reader has scrolled into the body, as a share of the
      // scrolling the body takes. 0 at its top, 1 when its end reaches the
      // bottom of the screen; a body shorter than the screen counts as soon
      // as its top scrolls past.
      const progress = -r.top / Math.max(r.height - window.innerHeight, 1);
      const down = window.scrollY > lastY;
      lastY = window.scrollY;
      if (progress >= at && down) {
        stop();
        setPhase('open');
      } else if (progress >= at - PRIME_AHEAD) {
        setPhase((p) => (p === 'idle' ? 'primed' : p));
      }
    };
    const onScroll = () => { if (!frame) frame = requestAnimationFrame(check); };
    const stop = () => {
      window.removeEventListener('scroll', onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return stop;
  }, [pathname, at, target]);

  const close = useCallback(() => {
    const card = cardRef.current;
    if (!card) return;
    // Focus must not be left on a button that is about to disappear.
    if (card.contains(document.activeElement)) (document.activeElement as HTMLElement).blur();
    card.setAttribute('data-state', 'closed');
    setPhase('closing');
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    window.setTimeout(() => setPhase('idle'), reduce ? 0 : EXIT_MS);
  }, []);

  // Showing: animate in, make room for the back-to-top button, listen for Escape.
  useEffect(() => {
    const card = cardRef.current;
    if (phase !== 'open' || !card) return;
    const raf = requestAnimationFrame(() => card.setAttribute('data-state', 'open'));
    const html = document.documentElement;
    const room = () => html.style.setProperty('--bl-cta-h', `${card.offsetHeight}px`);
    room();
    html.setAttribute('data-bl-cta', '');
    window.addEventListener('resize', room, { passive: true });
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') close(); };
    document.addEventListener('keydown', onKey);
    return () => {
      cancelAnimationFrame(raf);
      html.removeAttribute('data-bl-cta');
      html.style.removeProperty('--bl-cta-h');
      window.removeEventListener('resize', room);
      document.removeEventListener('keydown', onKey);
    };
  }, [phase, close]);

  if (phase === 'idle') return null;

  return (
    <div
      ref={cardRef}
      className="bl-pop"
      role="dialog"
      aria-modal="false"
      aria-labelledby={titleId}
      aria-describedby={descId}
      data-state="closed"
      // Mounted early only to load the image; hidden from everyone until it shows.
      hidden={phase === 'primed'}
    >
      <div className="bl-pop-visual">
        {/* Eager: the card mounts hidden shortly before it shows, so the image loads then. */}
        <Image src={c.image} alt={c.imageAlt} fill sizes="(min-width: 561px) 360px, 100vw" loading="eager" />
        <button type="button" className="bl-pop-close" onClick={close} aria-label="Close">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg>
        </button>
      </div>
      <div className="bl-pop-body">
        <span className="bl-pop-eyebrow">{c.eyebrow}</span>
        <h2 id={titleId} className="bl-pop-title">{c.title}</h2>
        <p id={descId} className="bl-pop-desc">{c.description}</p>
        <a className="btn btn-dark bl-pop-cta" href={c.buttonHref} onClick={close}>
          {c.buttonText} <span className="dot" aria-hidden="true">→</span>
        </a>
        <p className="bl-pop-note">{c.supportingText}</p>
      </div>
    </div>
  );
}

const stripEmpty = (o: Partial<CtaContent>) =>
  Object.fromEntries(Object.entries(o).filter(([, v]) => typeof v === 'string' && v.trim())) as Partial<CtaContent>;
