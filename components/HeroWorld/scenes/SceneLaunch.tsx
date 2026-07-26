import styles from '../HeroWorld.module.css';
import type { Project } from '../utils/projects';

/**
 * ACT V — LAUNCH
 *
 * Browser chrome wraps the artboard, the load bar sweeps, and then the shell
 * hardens into a laptop around the same rectangle. The project screen is the
 * last thing to arrive, because it is the payoff.
 *
 * The project is a prop, not a constant — swapping Born21 for Boutique or a
 * Law Firm is a data change in utils/projects.ts and nothing else moves.
 */

export default function SceneLaunch({ project }: { project: Project }) {
  return (
    <>
      {/* browser chrome — rendered above the artboard, below the laptop */}
      <div className={styles.chrome} data-hw="chrome">
        <i className={styles.light} />
        <i className={styles.light} />
        <i className={styles.light} />
        <span className={styles.urlPill}>{project.domain}</span>
        <span className={styles.loadbar} data-hw="loadbar" />
      </div>

      {/* laptop shell */}
      <div className={styles.laptop} data-hw="laptop">
        <span className={styles.lid} />
        <span className={styles.notch} />
        <span className={styles.base} data-hw="laptopBase" />
      </div>

      {/* the live project */}
      <div className={styles.screen} data-hw="screen">
        <img
          className={styles.screenImg}
          src={project.screen}
          alt={project.alt}
          width={1280}
          height={800}
          decoding="async"
          loading="eager"
        />
      </div>

      <span className={styles.sheen} data-hw="sheen" />
    </>
  );
}
