import HeroWorld from './HeroWorld';

/**
 * The hero.
 *
 * Two columns: copy on the left, the animated machine on the right. The
 * machine is the same one as before — same timeline, same six acts, same
 * ScrollTrigger. Only its anchor and scale moved, and the pinned distance came
 * down from 440% to 120% so the feature strip below is reachable rather than
 * four screens away.
 *
 * The copy is real text in the document, not part of the backdrop: HeroWorld
 * is aria-hidden decoration, so the h1 here is the page's actual heading and
 * the buttons are actual links. That is what keeps the hero legible with
 * JavaScript off, and what a screen reader gets.
 *
 * The feature strip states capability rather than trading on the studio's age,
 * which is the point — a new studio quoting client counts invites the wrong
 * question. Two of its five claims are checkable and one is not; see the note
 * on FEATURES.
 */

/**
 * "90+ Lighthouse Scores" and "Next.js · React · TypeScript" are verifiable
 * and true of this codebase. "Fast & Reliable Delivery" is a promise, worded
 * as intent rather than as a record, because there is one shipped project to
 * draw on. Nothing here claims a number the studio cannot show.
 */
const FEATURES = [
  {
    title: 'Fast Performance',
    note: '90+ Lighthouse Scores',
    icon: (
      <path d="M13 2 3 14h7l-1 8 10-12h-7l1-8Z" />
    ),
  },
  {
    title: 'Mobile First',
    note: 'Perfect on Every Device',
    icon: (
      <>
        <rect x="7" y="2" width="10" height="20" rx="2" />
        <path d="M11 18h2" />
      </>
    ),
  },
  {
    title: 'SEO Ready',
    note: 'Built to Rank on Google',
    icon: (
      <>
        <circle cx="11" cy="11" r="7" />
        <path d="m21 21-4.3-4.3" />
      </>
    ),
  },
  {
    title: 'Modern Stack',
    note: 'Next.js · React · TypeScript',
    icon: (
      <>
        <path d="m8 6-6 6 6 6" />
        <path d="m16 6 6 6-6 6" />
      </>
    ),
  },
  {
    title: 'On Time Delivery',
    note: 'Fast & Reliable Delivery',
    icon: (
      <>
        <path d="M4.5 16.5 3 21l4.5-1.5" />
        <path d="M15 5c3.5 1.5 5 5 4 9l-6 4-5-5 4-6c1-1.5 2-2 3-2Z" />
        <circle cx="14.5" cy="9.5" r="1.5" />
      </>
    ),
  },
];

export default function Hero() {
  return (
    <section className="hero-blank">
      <div className="hero-wrap">
        <div className="hero-copy">
          <span className="hero-badge">
            <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
              <path d="M12 3l1.9 5.6L19.5 10l-5.6 1.9L12 17.5l-1.9-5.6L4.5 10l5.6-1.4L12 3Z" />
            </svg>
            Premium Web Studio
          </span>

          <h1 className="hero-title">
            Ideas Become<br />
            Websites That<br />
            <em>Help Brands Grow.</em>
          </h1>

          <p className="hero-sub">
            We design and build premium websites that look exceptional, convert
            visitors into customers and help brands scale.
          </p>

          <div className="hero-actions">
            <a className="btn btn-accent" href="#contact">
              Start a Project <span className="dot">&rarr;</span>
            </a>
            <a className="btn btn-ghost hero-secondary" href="#work">
              See My Work <span className="dot">&#8599;</span>
            </a>
          </div>
        </div>

        {/* The machine lives in the right column rather than overlaying the
            whole section. That is what lets it centre itself, scale with the
            column and drop below the copy on a narrow screen, all without the
            timeline knowing anything about it. Decoration: everything inside
            is aria-hidden, so the h1 above is the page's real heading. */}
        <div className="hero-visual">
          <HeroWorld />
        </div>
      </div>

      <div className="hero-strip">
        {FEATURES.map((f) => (
          <div className="hero-feat" key={f.title}>
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
              focusable="false"
            >
              {f.icon}
            </svg>
            <div>
              <strong>{f.title}</strong>
              <span>{f.note}</span>
            </div>
          </div>
        ))}
      </div>

      <p className="hero-note">
        <i aria-hidden="true">&#10022;</i>
        One client today. Many success stories tomorrow.
        <i aria-hidden="true">&#10022;</i>
      </p>
    </section>
  );
}
