'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { CONCEPTS, type Format } from './concepts';

/**
 * The concepts, as a grid on desktop and a swipeable carousel on phones.
 *
 * One component, two behaviours, and deliberately so: the figures below are
 * byte-for-byte the markup the section already rendered, with the same classes
 * in the same order. Desktop reads them through the existing grid rules and
 * cannot tell anything changed. Below 768px the stylesheet turns the same
 * container into a scroll-snap track.
 *
 * The swipe itself is CSS — scroll-snap does the work, so it has native
 * momentum, respects the platform's own feel, and costs nothing. No carousel
 * library, no new dependency, and nothing to keep in sync with a scroll
 * position. JavaScript only does the two things CSS cannot: read which card is
 * showing, and scroll to one when a chip or arrow is pressed.
 *
 * All of that is skipped entirely above 768px. The listener is never attached,
 * so on desktop this behaves exactly like the server-rendered list it replaces.
 */

const SIZES: Record<Format, string> = {
  feature: '(min-width: 1100px) 566px, (min-width: 768px) 50vw, 88vw',
  cardWide: '(min-width: 1100px) 371px, (min-width: 768px) 33vw, 88vw',
  card: '(min-width: 1100px) 273px, (min-width: 768px) 25vw, 88vw',
};

/** Short labels for the chip row — the full industry names do not fit. */
const CHIP: Record<string, string> = {
  fitness: 'Fitness',
  healthcare: 'Healthcare',
  restaurant: 'Restaurant',
  boutique: 'Boutique',
  beauty: 'Beauty',
  realestate: 'Real Estate',
  education: 'Education',
  law: 'Law',
};

export default function IndustryCarousel() {
  const trackRef = useRef<HTMLDivElement>(null);
  const chipsRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const [isCarousel, setIsCarousel] = useState(false);

  /**
   * How far one card is from the next, measured rather than assumed.
   *
   * Not the track's clientWidth: the track carries the page gutter as its own
   * padding so the cards can bleed to the screen edge, which puts that padding
   * *inside* the scroll box. A 390px phone therefore has a 390px clientWidth
   * and a 350px card step, and paging by clientWidth drifts 40px per card —
   * enough by the sixth to snap to the wrong one.
   *
   * Reading the offset between the first two cards is exact whatever the
   * padding, gap or card width happen to be.
   */
  const step = useCallback(() => {
    const el = trackRef.current;
    if (!el) return 1;
    const a = el.children[0] as HTMLElement | undefined;
    const b = el.children[1] as HTMLElement | undefined;
    const d = a && b ? b.offsetLeft - a.offsetLeft : 0;
    return d > 0 ? d : el.clientWidth || 1;
  }, []);

  /* Only run any of this while the track is actually a track. */
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)');
    const sync = () => setIsCarousel(mq.matches);
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, []);

  useEffect(() => {
    const el = trackRef.current;
    if (!el || !isCarousel) return;

    // Coalesced to one read per frame: a scroll listener that measures on every
    // event fires dozens of times per swipe and forces a layout each time.
    let raf = 0;
    const read = () => {
      raf = 0;
      const i = Math.round(el.scrollLeft / step());
      setActive(Math.max(0, Math.min(CONCEPTS.length - 1, i)));
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(read);
    };
    el.addEventListener('scroll', onScroll, { passive: true });
    read();
    return () => {
      el.removeEventListener('scroll', onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [isCarousel, step]);

  const goTo = useCallback(
    (i: number) => {
      const el = trackRef.current;
      if (!el) return;
      const n = Math.max(0, Math.min(CONCEPTS.length - 1, i));
      const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      el.scrollTo({ left: n * step(), behavior: reduce ? 'auto' : 'smooth' });
    },
    [step],
  );

  /* Keep the active chip in view without dragging the page around it. */
  useEffect(() => {
    if (!isCarousel) return;
    const row = chipsRef.current;
    const chip = row?.children[active] as HTMLElement | undefined;
    if (!row || !chip) return;
    const left = chip.offsetLeft - (row.clientWidth - chip.offsetWidth) / 2;
    row.scrollTo({ left: Math.max(0, left), behavior: 'smooth' });
  }, [active, isCarousel]);

  return (
    <>
      <div className="ind-spread" ref={trackRef}>
        {CONCEPTS.map((c, n) => (
          <figure
            className="exh reveal"
            key={c.key}
            data-ind={c.key}
            data-format={c.format}
            style={{ ['--i' as string]: n }}
          >
            <div className="exh-stage">
              <div className="exh-plate">
                <Image
                  className="exh-photo"
                  src={c.photo}
                  alt={c.alt}
                  fill
                  sizes={SIZES[c.format]}
                  quality={82}
                />
              </div>
            </div>

            <figcaption className="exh-caption">
              <span className="exh-index">{String(n + 1).padStart(2, '0')}</span>
              <span className="exh-kicker">Concept — {c.industry}</span>
              <h3>{c.benefit}</h3>
              <p className="exh-story">{c.story}</p>
            </figcaption>
          </figure>
        ))}
      </div>

      {/* Controls. Rendered always, hidden by CSS above 768px — cheaper and
          less brittle than mounting them from a media query in JavaScript,
          which would flash on first paint. */}
      <div className="ind-ctrl">
        <button
          type="button"
          className="ind-arrow"
          onClick={() => goTo(active - 1)}
          disabled={active === 0}
          aria-label="Previous concept"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m15 18-6-6 6-6" /></svg>
        </button>

        <div className="ind-dots" role="tablist" aria-label="Concepts">
          {CONCEPTS.map((c, n) => (
            <button
              key={c.key}
              type="button"
              role="tab"
              aria-selected={n === active}
              aria-label={c.industry}
              className={n === active ? 'is-on' : undefined}
              onClick={() => goTo(n)}
            />
          ))}
        </div>

        <button
          type="button"
          className="ind-arrow"
          onClick={() => goTo(active + 1)}
          disabled={active === CONCEPTS.length - 1}
          aria-label="Next concept"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m9 18 6-6-6-6" /></svg>
        </button>
      </div>

      <div className="ind-chips" ref={chipsRef}>
        {CONCEPTS.map((c, n) => (
          <button
            key={c.key}
            type="button"
            className={n === active ? 'is-on' : undefined}
            aria-current={n === active ? 'true' : undefined}
            onClick={() => goTo(n)}
          >
            {CHIP[c.key] ?? c.industry}
          </button>
        ))}
      </div>
    </>
  );
}
