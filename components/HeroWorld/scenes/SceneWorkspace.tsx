import styles from '../HeroWorld.module.css';

/**
 * THE IDLE SCREEN — a design workspace, waiting.
 *
 * This is what the visitor meets before they scroll a single pixel, so it has
 * one job: communicate craftsmanship and imply that something is about to
 * happen. Not a blank page, not a busy one.
 *
 * Everything here is chrome, never content. No logos, no buttons, no fake
 * copy — the only words on screen are the three the workspace itself would
 * show. The artboard stays genuinely empty because the emptiness is the
 * invitation.
 *
 * The whole thing lives under one `data-hw="workspace"` node so the timeline
 * can dissolve it with a single tween as the build begins.
 */

/** Ruler ticks. Every fifth is a major mark — the rhythm reads as measured. */
const TICKS = Array.from({ length: 41 }, (_, i) => i);

export default function SceneWorkspace() {
  return (
    <div className={styles.workspace} data-hw="workspace">
      {/* ---- application header ---- */}
      <header className={styles.wsBar}>
        <span className={styles.wsBarLeft}>
          <span className={styles.wsMuted}>Project</span>
          <span className={styles.wsDivider} />
          <span className={styles.wsName}>Untitled-01</span>
        </span>
        <span className={styles.wsMuted}>Auto Saved</span>
      </header>

      {/* ---- rulers ---- */}
      <div className={styles.wsRulerTop}>
        {TICKS.map((i) => (
          <i key={`t${i}`} className={i % 5 === 0 ? styles.wsTickMajor : styles.wsTick} />
        ))}
      </div>
      <div className={styles.wsRulerLeft}>
        {TICKS.slice(0, 26).map((i) => (
          <i key={`l${i}`} className={i % 5 === 0 ? styles.wsTickMajorV : styles.wsTickV} />
        ))}
      </div>
      <span className={styles.wsRulerCorner} />

      {/* ---- canvas ---- */}
      <div className={styles.wsCanvas}>
        <div className={styles.wsGrid} />

        {/* the artboard: a fresh blank page */}
        <div className={styles.wsArtboard}>
          <span className={styles.wsSafeArea} />

          {/* corner handles */}
          <i className={`${styles.wsHandle} ${styles.wsHandleTL}`} />
          <i className={`${styles.wsHandle} ${styles.wsHandleTR}`} />
          <i className={`${styles.wsHandle} ${styles.wsHandleBL}`} />
          <i className={`${styles.wsHandle} ${styles.wsHandleBR}`} />

          {/* faint measurement lines at the safe-area edges */}
          <span className={`${styles.wsMeasure} ${styles.wsMeasureL}`} />
          <span className={`${styles.wsMeasure} ${styles.wsMeasureR}`} />

          {/* crosshairs where the guides cross the safe area */}
          <i className={`${styles.wsCross} ${styles.wsCrossTL}`} />
          <i className={`${styles.wsCross} ${styles.wsCrossTR}`} />
          <i className={`${styles.wsCross} ${styles.wsCrossBL}`} />
          <i className={`${styles.wsCross} ${styles.wsCrossBR}`} />

          {/* the caret. CSS-driven, not timeline-driven: it must breathe while
              the page is at rest, which a scrubbed timeline cannot do. */}
          <span className={styles.wsCaret} />
        </div>

        {/* centre alignment guides, drawn over the page */}
        <span className={`${styles.wsAlign} ${styles.wsAlignV}`} />
        <span className={`${styles.wsAlign} ${styles.wsAlignH}`} />
      </div>

      {/* ---- ambience, above the canvas but below nothing else ---- */}
      <span className={styles.wsGrain} />
      <span className={styles.wsHighlight} />
      <span className={styles.wsVignette} />
    </div>
  );
}
