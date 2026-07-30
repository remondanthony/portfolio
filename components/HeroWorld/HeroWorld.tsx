'use client';

import { useRef } from 'react';
import Image from 'next/image';
import styles from './HeroWorld.module.css';
import SceneWorkspace from './scenes/SceneWorkspace';
import SceneGuides from './scenes/SceneGuides';
import SceneDepth from './scenes/SceneDepth';
import SceneSite from './scenes/SceneSite';
import SceneBuild from './scenes/SceneBuild';
import SceneLive from './scenes/SceneLive';
import { useHeroTimeline } from './hooks/useHeroTimeline';
import { usePointerParallax } from './hooks/usePointerParallax';
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

      {/* Reproduces .hero-blank::before. It sits BELOW the machine on purpose:
          over it, the scrim took ~29% of luminance off a display that is
          supposed to read as a bright white workspace. The hero copy and the
          service labels render above .world entirely, so they still get the
          full scrim they were designed against. */}
      <div className={styles.stageAnchor} data-hw="stageAnchor">
        <div className={styles.stage} data-hw="stage">
          <div className={styles.tilt} ref={tiltRef} data-hw="tilt">
            <div className={styles.float} data-hw="float">
              {/* The hardware. Every CSS device part that used to draw a
                  MacBook — lid, bezel, notch, base, sheen, cast shadow — and
                  the CSS phone are gone: all of it, including both shadows and
                  the perspective, is in this file. */}
              {/* An exactly 3:2 frame, centred in the stage. Everything the
                  screen's geometry depends on is a percentage of the render,
                  so the render's box has to BE the reference box — .stage's
                  own ratio drifts with its width and height bounds, and
                  object-fit was quietly letterboxing inside it, which put
                  every percentage a few points out. */}
              <div className={styles.macFrame}>
              <Image
                className={styles.macImg}
                src="/mac.png"
                alt=""
                fill
                sizes="(min-width: 1100px) 960px, (min-width: 640px) 66vw, 116vw"
                quality={82}
                priority
              />

              {/* The display opening. Sheared into the screen's plane and
                  clipped to it; see the note on .macScreen for where the
                  numbers come from. Inside is the same set of scenes the
                  timeline has always driven, untouched. */}
              <div className={styles.macScreen} data-hw="screen">
                <SceneWorkspace />
                <SceneGuides />
                <SceneSite />
                <SceneLive project={project} />
              </div>
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

    </div>
  );
}
