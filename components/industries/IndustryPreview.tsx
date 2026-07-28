'use client';

import type { Concept } from './concepts';
import { usePreviewSequence } from './usePreviewSequence';

/**
 * One concept site inside a browser frame, with a scripted sequence that runs
 * exactly once when the card first enters the viewport.
 *
 * The React here is deliberately thin: it writes a phase name onto the DOM and
 * nothing else. Every visible change — the shimmer, the fade, the cursor's
 * travel, the CTA's lift, the page scroll — is a CSS transition keyed off
 * [data-phase], so all of it runs on transform and opacity and none of it
 * touches layout. That is what keeps eight of these on one screen at 60fps.
 *
 * The site renders complete on the server. If JS never runs, or the observer
 * never fires, the visitor still sees a finished website rather than a
 * shimmering skeleton — the animation is an enhancement, not the content.
 */
export default function IndustryPreview({ c }: { c: Concept }) {
  const { ref, phase } = usePreviewSequence<HTMLDivElement>();

  return (
    <div className="pv" ref={ref} data-phase={phase} data-layout={c.layout}>
      {/* the page itself — taller than the frame, so it has somewhere to scroll */}
      <div className="pv-page">
        <header className="pv-bar">
          <span className="pv-brand">{c.brand}</span>
          <nav className="pv-nav">
            {c.nav.map((n) => <span key={n}>{n}</span>)}
          </nav>
        </header>

        <section className="pv-hero">
          {c.layout !== 'none' && (
            <span className="pv-media" aria-hidden="true">
              {c.photo ? (
                <img className="pv-photo" src={c.photo} alt="" loading="lazy" decoding="async" />
              ) : (
                c.layout === 'grid' && <><i /><i /></>
              )}
            </span>
          )}
          <div className="pv-copy">
            <h4 className="pv-h1">{c.headline}</h4>
            <p className="pv-sub">{c.sub}</p>
            <span className="pv-cta">{c.cta}</span>
          </div>
        </section>

        <section className="pv-second">
          <span className="pv-sect-title">{c.sectionTitle}</span>
          <ul className={`pv-rows pv-rows-${c.rows}`}>
            {c.items.map((it) => (
              <li key={it.label}>
                <span className="pv-row-label">{it.label}</span>
                <span className="pv-row-meta">{it.meta}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>

      {/* loading shimmer — one pass, then never again */}
      <span className="pv-shimmer" aria-hidden="true" />

      {/* the pointer. Travels to --cta-x/--cta-y, which each layout defines. */}
      <svg className="pv-cursor" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path
          d="M5 2.5 19 12l-6.2 1.2L9.6 19.5 5 2.5Z"
          fill="#fff"
          stroke="rgba(0,0,0,.55)"
          strokeWidth="1.1"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}
