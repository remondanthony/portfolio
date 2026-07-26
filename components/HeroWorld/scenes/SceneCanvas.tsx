import styles from '../HeroWorld.module.css';

/**
 * SCENE 1 — THE BLANK CANVAS
 *
 * What you see when you open Figma and haven't drawn anything yet: white,
 * a faint working grid, one caret waiting. Restraint is the whole point —
 * this scene has to feel like potential, not emptiness.
 *
 * The measurement guides live here too. They belong to the canvas, not to
 * the site, and they only surface for the "spacing becomes perfect" beat.
 */

const GUIDE_COLUMNS = [8, 41, 59, 93] as const;
const GUIDE_ROWS = [22, 45.5, 58] as const;

export default function SceneCanvas() {
  return (
    <>
      <div className={styles.canvasGrid} data-hw="canvasGrid" />
      <span className={styles.caret} data-hw="caret" />

      {GUIDE_COLUMNS.map((left) => (
        <span
          key={`gv${left}`}
          className={`${styles.guide} ${styles.guideV}`}
          data-hw="guide"
          style={{ left: `${left}%` }}
        />
      ))}
      {GUIDE_ROWS.map((top) => (
        <span
          key={`gh${top}`}
          className={`${styles.guide} ${styles.guideH}`}
          data-hw="guide"
          style={{ top: `${top}%` }}
        />
      ))}
    </>
  );
}
