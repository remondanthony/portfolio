import styles from '../HeroWorld.module.css';

/**
 * The phone beside the laptop, showing the same site at a narrow width.
 *
 * Drawn in CSS rather than shown as an image, for two reasons. The screen is
 * about 90px wide on a laptop display, and the studio mockup scaled into that
 * is unreadable mush — at this size type has to be laid out, not photographed.
 * And it costs no bytes: the hero already carries a 1.5MB PNG for the laptop.
 *
 * The wording mirrors that PNG deliberately. A phone showing different copy to
 * the laptop beside it reads as two different websites rather than one site at
 * two widths, which is the whole point of the pairing.
 *
 * Purely decorative — the parent marks the entire hero backdrop aria-hidden,
 * so none of this is announced. The real headline is live text in Hero.tsx.
 */
export default function ScenePhone() {
  return (
    <div className={styles.phone} data-hw="phone">
      <span className={styles.phoneNotch} />
      <div className={styles.phoneScreen}>
        <div className={styles.phoneBar}>
          <span className={styles.phoneBrand}>VIONICHE</span>
          <span className={styles.phoneMenu}>
            <i /><i /><i />
          </span>
        </div>

        <p className={styles.phoneKicker}>Digital experiences that perform</p>
        <p className={styles.phoneHead}>
          Websites that<br />look exceptional.
        </p>
        <p className={styles.phoneSub}>Built to perform.</p>

        <span className={styles.phoneCta}>Start a project</span>

        <span className={styles.phoneShot} />

        <div className={styles.phoneRows}>
          <span /><span /><span />
        </div>
      </div>
    </div>
  );
}
