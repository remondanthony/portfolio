import styles from '../HeroWorld.module.css';

/**
 * SCENE 4 — DEVELOPMENT
 *
 * Deliberately the shortest act, and the only one that happens OUTSIDE the
 * screen: component cards float in the dark room around the laptop rather
 * than on the white canvas. That separation is the idea — design happens on
 * the artboard, engineering happens around it.
 *
 * No hacker aesthetic, no Matrix rain. Four components, a folder path, and
 * the three lines of output that mean the work actually shipped.
 */

const COMPONENTS = [
  { label: '<Hero />',     left: '2%',  top: '12%' },
  { label: '<Services />', left: '76%', top: '26%' },
  { label: '<Projects />', left: '0%',  top: '70%' },
  { label: '<Contact />',  left: '73%', top: '80%' },
] as const;

const STATUS = [
  { key: 'commit', tick: '●', text: 'commit', hash: 'a1b2c3d' },
  { key: 'build',  tick: '✓', text: 'build passed', hash: '1.24s' },
  { key: 'deploy', tick: '✓', text: 'deployed', hash: 'live' },
] as const;

export default function SceneBuild() {
  return (
    <div className={styles.buildLayer} aria-hidden="true">
      {COMPONENTS.map((c) => (
        <span
          key={c.label}
          className={styles.componentCard}
          data-hw="componentCard"
          style={{ left: c.left, top: c.top }}
        >
          <i className={styles.componentDot} />
          {c.label}
        </span>
      ))}

      <div className={styles.tree} data-hw="tree">
        /src/components
        <br />
        &nbsp;&nbsp;├─ Hero.tsx
        <br />
        &nbsp;&nbsp;├─ Services.tsx
        <br />
        &nbsp;&nbsp;└─ Contact.tsx
      </div>

      <div className={styles.status}>
        {STATUS.map((s) => (
          <span key={s.key} className={styles.statusLine} data-hw="statusLine">
            <span className={styles.statusTick}>{s.tick}</span>
            {s.text}
            <span className={styles.statusHash}>{s.hash}</span>
          </span>
        ))}
      </div>
    </div>
  );
}
