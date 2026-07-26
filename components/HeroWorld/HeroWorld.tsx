'use client';

import { useRef } from 'react';
import styles from './HeroWorld.module.css';
import SceneCanvas from './scenes/SceneCanvas';
import SceneDepth from './scenes/SceneDepth';
import SceneSite from './scenes/SceneSite';
import SceneBuild from './scenes/SceneBuild';
import SceneLive from './scenes/SceneLive';
import { useHeroTimeline } from './hooks/useHeroTimeline';
import { usePointerParallax } from './hooks/usePointerParallax';
import { useHeroCopyIntro } from './hooks/useHeroCopyIntro';
import { CAPTIONS } from './animations/tokens';
import { getFeaturedProject } from './utils/projects';

/**
 * "The Website Is Born" — the hero backdrop.
 *
 * A MacBook sits on the desk from the first frame. As the visitor scrolls,
 * a website is assembled inside it component by component: blank canvas,
 * navigation, hero, typography, buttons, cards, polish, deployment, and
 * finally the real project loading in a browser.
 *
 * Deliberate constraints:
 *   • Backdrop only. Renders at z-index 0 beneath the approved hero content
 *     and never takes pointer events, so nothing above it changes.
 *   • Scroll-scrubbed, never autoplayed. The visitor owns every frame.
 *   • transform / opacity / filter only — no layout property is touched after
 *     mount, so there is no CLS and no main-thread layout during the scrub.
 *
 * The three nested transform hosts are not incidental: .tilt owns pointer
 * parallax, .float owns the idle breath, and the timeline owns .stage. Giving
 * each its own node is what stops them from overwriting one another.
 */

type Props = {
  /** Index into the project registry — the seam for rotating portfolio work. */
  projectIndex?: number;
};

export default function HeroWorld({ projectIndex = 0 }: Props) {
  const scopeRef = useRef<HTMLDivElement>(null);
  const tiltRef = useRef<HTMLDivElement>(null);

  const { resolved, reduced } = useHeroTimeline(scopeRef);
  usePointerParallax(tiltRef, resolved && !reduced);
  useHeroCopyIntro(scopeRef, !reduced);

  const project = getFeaturedProject(projectIndex);

  return (
    <div
      ref={scopeRef}
      className={styles.world}
      data-hw="world"
      aria-hidden="true"
      role="presentation"
    >
      {/* Two planes behind the machine, each on its own parallax rate. */}
      <SceneDepth />
      <div className={styles.roomGlow} data-hw="roomGlow" />

      <div className={styles.stageAnchor}>
        <div className={styles.stage} data-hw="stage">
          <div className={styles.tilt} ref={tiltRef} data-hw="tilt">
            <div className={styles.float} data-hw="float">
              <span className={styles.shadow} data-hw="shadow" />

              <div className={styles.laptop} data-hw="laptop">
                <span className={styles.lid} />
                <span className={styles.lidEdge} />

                <div className={styles.bezel}>
                  {/* The display. Everything below is inside the glass. */}
                  <div className={styles.screen} data-hw="screen">
                    <SceneCanvas />
                    <SceneSite />
                    <SceneLive project={project} />
                  </div>
                  <span className={styles.sheen} data-hw="sheen" />
                </div>

                <span className={styles.notch} />

                <span className={styles.base}>
                  <span className={styles.baseLip} />
                </span>
              </div>
            </div>

            {/* Scene 4 happens in the room, not on the artboard. */}
            <SceneBuild />
          </div>
        </div>
      </div>

      <div className={styles.captionWrap}>
        {CAPTIONS.map((c) => (
          <span key={c.at} className={styles.caption} data-hw="caption">
            {c.text}
          </span>
        ))}
      </div>

      {/* Reproduces .hero-blank::before above the film — see the module CSS. */}
      <div className={styles.vignette} />
    </div>
  );
}
