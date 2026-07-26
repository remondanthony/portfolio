import styles from '../HeroWorld.module.css';

/**
 * ACT IV — DEVELOPMENT
 *
 * The brief was explicit: no hacker aesthetic, no Matrix rain. So this act
 * shows only what a developer actually recognises — four components, a folder
 * path, and the three lines of output that mean the work shipped.
 *
 * The cards float ABOVE the artboard and then dissolve upward into it: the
 * reading is "these compiled into the site", not "these decorated the site".
 */

const COMPONENTS = [
  { label: '<Hero />',     left: '-7%',  top: '10%' },
  { label: '<Services />', left: '74%',  top: '25%' },
  { label: '<Projects />', left: '-2%',  top: '68%' },
  { label: '<Contact />',  left: '70%',  top: '78%' },
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
