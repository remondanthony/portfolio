import styles from '../HeroWorld.module.css';

/**
 * MEASUREMENT GUIDES
 *
 * These belong to the polish act, not to the idle screen: they surface for a
 * moment to show the grid was there all along, then retire. Kept separate
 * from SceneWorkspace so the workspace can dissolve early without taking
 * them with it.
 */

const GUIDE_COLUMNS = [8, 41, 59, 93] as const;
const GUIDE_ROWS = [22, 45.5, 58] as const;

export default function SceneGuides() {
  return (
    <>
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
