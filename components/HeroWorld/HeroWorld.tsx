'use client';

import { useRef } from 'react';
import Image from 'next/image';
import styles from './HeroWorld.module.css';
import SceneWorkspace from './scenes/SceneWorkspace';
import SceneGuides from './scenes/SceneGuides';
import SceneDepth from './scenes/SceneDepth';
import SceneSite from './scenes/SceneSite';
import SceneLive from './scenes/SceneLive';
import { useHeroTimeline } from './hooks/useHeroTimeline';
import { usePointerParallax } from './hooks/usePointerParallax';
import { getFeaturedProject } from './utils/projects';

/**
 * "The Website Is Born" — the hero backdrop.
 *
 * A MacBook sits on the desk from the first frame, a finished website already
 * on its display. As the visitor scrolls, that design is rebuilt inside it
 * component by component: navigation, hero, typography, buttons, cards,
 * polish, and finally the real project loading in a browser.
 *
 * Everything happens ON the display. The development beat that used to float
 * component tags, a file tree and deploy output in the room around the
 * laptop is gone, along with the story captions above it — nothing is drawn
 * outside the screen any more.
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

              {/* The phone.
                  A separate render now, not the one painted into mac.png. It
                  is placed to fully cover that baked-in handset — 77% to 93%
                  across and 39% to 84% down, against the baked one's 78.4-91.1
                  and 41.8-82.8 — so only one phone is ever visible, and it
                  overlaps the display exactly as a real one standing in front
                  of the laptop would.

                  Sourced from mob-cutout.png rather than mob.png: the supplied
                  file is opaque RGB on a near-white checkerboard, which would
                  have dropped a pale box over the machine. The cutout is the
                  same pixels with that background flood-filled away from the
                  edges, so the phone's own white screen — enclosed by its
                  frame, never reached from outside — stays intact. */}
              <Image
                className={styles.macPhone}
                src="/mob-cutout.png"
                alt=""
                width={1086}
                height={1448}
                quality={82}
                priority
              />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
