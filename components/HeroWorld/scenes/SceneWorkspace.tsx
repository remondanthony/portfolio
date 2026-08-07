import styles from '../HeroWorld.module.css';

/**
 * THE IDLE SCREEN — the finished website, already on the display.
 *
 * This is what the visitor meets before they scroll a single pixel, so it has
 * one job: show that the studio ships polished work. It used to be a design
 * tool sitting on an empty artboard, which asked the visitor to imagine the
 * result instead of showing it — the rulers, the grid and the blank sheet are
 * all gone, and the page they were framing now fills the display.
 *
 * Every position here mirrors SceneSite's own percentages. That is the whole
 * trick of the opening: the film's first act flies the same components into
 * the same coordinates, so when this dissolves the build lands exactly where
 * this stood and the handover reads as the design being taken apart rather
 * than as a cut to a different page.
 *
 * It is drawn, not photographed — live markup, no screenshot.
 *
 * The whole thing stays under one `data-hw="workspace"` node so the timeline
 * can dissolve it with the single tween it always used. Nothing inside
 * carries a `data-hw` hook, so the timeline neither selects nor animates any
 * of it.
 */

const CARDS = ['Plan', 'Shape', 'Finish'] as const;

export default function SceneWorkspace() {
  return (
    <div className={styles.workspace} data-hw="workspace">
      <div className={styles.wsPage}>
        {/* ---- navigation ---- */}
        <span className={styles.wsPageBar} />
        <span className={styles.wsPageBrand} />
        <span className={styles.wsPageNav} style={{ left: '24%' }} />
        <span className={styles.wsPageNav} style={{ left: '33%' }} />
        <span className={styles.wsPageNav} style={{ left: '42%' }} />
        <span className={styles.wsPageNavCta} />

        {/* ---- hero ---- */}
        <span className={`${styles.wsPageH1} ${styles.wsPageH1a}`}>Everything</span>
        <span className={`${styles.wsPageH1} ${styles.wsPageH1b}`}>in order.</span>
        <span className={styles.wsPageSub}>Clear plans, careful work, on time.</span>

        <span className={styles.wsPageBtn}>Start a project</span>
        <span className={styles.wsPageGhost}>See our work</span>

        <span className={styles.wsPageMedia} />

        {/* ---- cards ---- */}
        <div className={styles.wsPageCards}>
          {CARDS.map((label, i) => (
            <span
              className={styles.wsPageCard}
              key={label}
              style={{ left: `${i * 34.75}%` }}
            >
              <i className={styles.wsPageCardIcon} />
              <em className={styles.wsPageCardLabel}>{label}</em>
            </span>
          ))}
        </div>
      </div>

      {/* ---- ambience, above the page ---- */}
      <span className={styles.wsGrain} />
      <span className={styles.wsHighlight} />
      <span className={styles.wsVignette} />
    </div>
  );
}
