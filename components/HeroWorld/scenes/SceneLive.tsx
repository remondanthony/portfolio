import styles from '../HeroWorld.module.css';
import type { Project } from '../utils/projects';

/**
 * SCENE 5 — LIVE
 *
 * Browser chrome slides down over the finished design, the load bar sweeps,
 * and the real project replaces the mockup in the same aperture. The design
 * does not "become" a screenshot by cutting — it is loaded, the way a real
 * site is loaded, which is the only reading that earns the moment.
 *
 * The project is a prop: swapping Born21 for Boutique or a Law Firm is a data
 * change in utils/projects.ts and nothing in this file moves.
 */

export default function SceneLive({ project }: { project: Project }) {
  return (
    <>
      <div className={styles.chrome} data-hw="chrome">
        <i className={styles.light} />
        <i className={styles.light} />
        <i className={styles.light} />
        <span className={styles.urlPill}>{project.domain}</span>
        <span className={styles.loadbar} data-hw="loadbar" />
      </div>

      <div className={styles.live} data-hw="live">
        <img
          className={styles.liveImg}
          src={project.screen}
          alt={project.alt}
          width={1280}
          height={800}
          decoding="async"
          loading="eager"
        />
      </div>
    </>
  );
}
