import styles from '../HeroWorld.module.css';

/**
 * ACT I — IDEA
 *
 * The ambient layer. A grid that suggests order without asserting it, a
 * handful of embers, and one blinking cursor: the smallest possible symbol
 * for "someone is about to make something".
 *
 * Particle positions are a fixed table rather than Math.random() so the
 * server and client render byte-identical markup — random here would be a
 * hydration mismatch and a layout flash.
 */

const PARTICLES = [
  { x: 18, y: 26, d: 0.0 }, { x: 31, y: 63, d: 0.7 },
  { x: 44, y: 18, d: 1.4 }, { x: 57, y: 71, d: 0.3 },
  { x: 69, y: 34, d: 1.1 }, { x: 78, y: 58, d: 1.8 },
  { x: 24, y: 79, d: 0.9 }, { x: 63, y: 12, d: 1.6 },
  { x: 86, y: 24, d: 0.5 }, { x: 12, y: 47, d: 1.3 },
  { x: 50, y: 88, d: 2.0 }, { x: 91, y: 67, d: 0.2 },
  { x: 37, y: 41, d: 1.9 }, { x: 72, y: 84, d: 0.6 },
  { x: 8,  y: 68, d: 1.5 }, { x: 95, y: 43, d: 1.0 },
] as const;

export default function SceneIdea() {
  return (
    <>
      <div className={styles.grid} data-hw="grid" />
      <div className={styles.glow} data-hw="glow" />

      <div className={styles.particles} aria-hidden="true">
        {PARTICLES.map((p, i) => (
          <span
            key={i}
            className={styles.particle}
            data-hw="particle"
            data-drift={p.d}
            style={{ left: `${p.x}%`, top: `${p.y}%` }}
          />
        ))}
      </div>

      <div className={styles.cursor} data-hw="cursor" />
    </>
  );
}
