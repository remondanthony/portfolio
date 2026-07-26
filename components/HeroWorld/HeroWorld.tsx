'use client';

import { useRef } from 'react';
import styles from './HeroWorld.module.css';
import SceneIdea from './scenes/SceneIdea';
import SceneBlueprint from './scenes/SceneBlueprint';
import SceneDesign from './scenes/SceneDesign';
import SceneBuild from './scenes/SceneBuild';
import SceneLaunch from './scenes/SceneLaunch';
import { useHeroTimeline } from './hooks/useHeroTimeline';
import { usePointerParallax } from './hooks/usePointerParallax';
import { CAPTIONS } from './animations/tokens';
import { getFeaturedProject } from './utils/projects';

/**
 * "The Website Is Born" — the hero backdrop.
 *
 * Replaces a static mascot with the eight-beat journey of making a website:
 * idea → blueprint → wireframe → design → development → deployment → live →
 * the client's project, sitting on a laptop.
 *
 * Deliberate constraints:
 *   • Purely a backdrop. It renders at z-index 0 beneath the approved hero
 *     content and never receives pointer events, so nothing above it changes.
 *   • Adds no scroll distance. The film autoplays; scroll only scrubs the
 *     final settle. Every section below keeps its exact position.
 *   • Animates transform/opacity/filter only — no layout property is ever
 *     touched after mount, so there is no CLS and no main-thread layout.
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

  const project = getFeaturedProject(projectIndex);

  return (
    <div
      ref={scopeRef}
      className={styles.world}
      data-hw="world"
      aria-hidden="true"
      role="presentation"
    >
      {/* ACT I — ambient field */}
      <SceneIdea />

      {/* The stage: one rectangle that becomes a website.
          The anchor does the centring so GSAP can own stage's transform. */}
      <div className={styles.stageAnchor}>
        <div className={styles.stage} data-hw="stage">
          <div className={styles.tilt} ref={tiltRef} data-hw="tilt">
            <div className={styles.deck} data-hw="deck">
              <div className={styles.deckSurface} data-hw="deckSurface" />

              <div className={styles.deckContent} data-hw="deckContent">
                {/* ACT II — measuring layer */}
                <SceneBlueprint />
                {/* ACT III — the site itself */}
                <SceneDesign />
              </div>

              {/* ACT V. Comes last in DOM so chrome and the project screen
                  crossfade OVER the built site; the laptop lid still renders
                  behind it via translateZ(-14px) in the deck's 3D space. */}
              <SceneLaunch project={project} />
            </div>

            {/* ACT IV — floats around the deck, then compiles into it */}
            <SceneBuild />
          </div>
        </div>
      </div>

      {/* Caption track */}
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
