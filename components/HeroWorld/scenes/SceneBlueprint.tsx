import styles from '../HeroWorld.module.css';

/**
 * ACT II — BLUEPRINT
 *
 * The measuring layer: a twelve-column grid, three baselines and a few
 * dimension labels. These exist only to be believed for two seconds and
 * then dismissed — they are the scaffolding, not the building.
 */

const COLUMNS = 12;
const BASELINES = [24, 46.5, 68] as const;

const DIMENSIONS = [
  { label: '1280', left: '50%', top: '-7%', translate: '-50%, 0' },
  { label: '12 col · 24 gutter', left: '5%', top: '-7%', translate: '0, 0' },
  { label: '8pt', left: '101%', top: '24%', translate: '0, -50%' },
] as const;

export default function SceneBlueprint() {
  return (
    <div className={styles.guides} aria-hidden="true">
      {Array.from({ length: COLUMNS }, (_, i) => (
        <span
          key={`c${i}`}
          className={styles.col}
          data-hw="col"
          style={{ left: `${5 + (i * 90) / (COLUMNS - 1)}%` }}
        />
      ))}

      {BASELINES.map((top, i) => (
        <span
          key={`b${i}`}
          className={styles.baseline}
          data-hw="baseline"
          style={{ top: `${top}%` }}
        />
      ))}

      {DIMENSIONS.map((d) => (
        <span
          key={d.label}
          className={styles.dim}
          data-hw="dim"
          style={{ left: d.left, top: d.top, transform: `translate(${d.translate})` }}
        >
          {d.label}
        </span>
      ))}
    </div>
  );
}
