import styles from '../HeroWorld.module.css';

/**
 * THE ROOM
 *
 * Two planes behind the machine, each travelling at its own rate across the
 * scroll: a distant grid that barely moves, and a mid-field of motes that
 * moves roughly twice as far. Together with the laptop counter-moving a
 * little, that gives three depths without a single 3D transform.
 *
 * Mote positions are a fixed table, never Math.random() — random here is a
 * hydration mismatch and a first-paint flash.
 */

const MOTES = [
  { x: 11, y: 24, d: 0.0 }, { x: 23, y: 61, d: 0.8 },
  { x: 34, y: 15, d: 1.5 }, { x: 46, y: 74, d: 0.3 },
  { x: 58, y: 31, d: 1.1 }, { x: 67, y: 66, d: 1.9 },
  { x: 19, y: 84, d: 0.6 }, { x: 76, y: 19, d: 1.3 },
  { x: 88, y: 47, d: 0.4 }, { x: 5,  y: 52, d: 1.7 },
  { x: 41, y: 91, d: 2.0 }, { x: 94, y: 72, d: 0.2 },
  { x: 29, y: 40, d: 1.4 }, { x: 82, y: 88, d: 0.9 },
] as const;

export default function SceneDepth() {
  return (
    <>
      <div className={styles.bgGrid} data-hw="bgGrid" />
      <div className={styles.dust} data-hw="dust" aria-hidden="true">
        {MOTES.map((m, i) => (
          <span
            key={i}
            className={styles.mote}
            data-hw="mote"
            data-drift={m.d}
            style={{ left: `${m.x}%`, top: `${m.y}%` }}
          />
        ))}
      </div>
    </>
  );
}
