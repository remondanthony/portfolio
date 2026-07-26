import styles from '../HeroWorld.module.css';

/**
 * ACT III — DESIGN
 *
 * This is the spine of the whole film.
 *
 * Every node here is born in act II as a grey wireframe rectangle, gains
 * colour and typography in act III, sits inside browser chrome in act V and
 * ends up behind laptop glass. It is never swapped, cross-faded or replaced —
 * the same DOM travels the entire journey, which is the only way the
 * transitions can feel physically connected rather than merely sequenced.
 *
 * `data-role` is the contract: the timeline looks up each role's designed
 * appearance and tweens the wireframe toward it.
 */

const NAV_PILLS = [22, 32.5, 43] as const;
const CARDS = [
  { left: '0%', label: 'Design' },
  { left: '34.75%', label: 'Build' },
  { left: '69.5%', label: 'Launch' },
] as const;

export default function SceneDesign() {
  return (
    <>
      {/* ---- navigation ---- */}
      <span className={`${styles.part} ${styles.topbar}`} data-hw="part" data-role="topbar" />
      <span className={`${styles.part} ${styles.brandDot}`} data-hw="part" data-role="brandDot" />
      {NAV_PILLS.map((left, i) => (
        <span
          key={`n${i}`}
          className={`${styles.part} ${styles.navPill}`}
          data-hw="part"
          data-role="navPill"
          style={{ left: `${left}%` }}
        />
      ))}
      <span className={`${styles.part} ${styles.ctaPill}`} data-hw="part" data-role="ctaPill" />

      {/* ---- hero block ---- */}
      <span className={`${styles.part} ${styles.headA}`} data-hw="part" data-role="head" />
      <span className={`${styles.part} ${styles.headB}`} data-hw="part" data-role="head" />
      <span className={`${styles.part} ${styles.subA}`} data-hw="part" data-role="sub" />
      <span className={`${styles.part} ${styles.subB}`} data-hw="part" data-role="sub" />
      <span className={`${styles.part} ${styles.btnA}`} data-hw="part" data-role="btn" />
      <span className={`${styles.part} ${styles.media}`} data-hw="part" data-role="media">
        <span className={styles.mediaFill} data-hw="mediaFill" />
      </span>

      {/* ---- cards ---- */}
      <div className={styles.cards}>
        {CARDS.map((c) => (
          <span
            key={c.label}
            className={`${styles.part} ${styles.card}`}
            data-hw="part"
            data-role="card"
            style={{ left: c.left }}
          >
            <span
              className={`${styles.deckText} ${styles.deckCardLabel}`}
              data-hw="deckText"
              style={{ left: '12%', top: '30%' }}
            >
              {c.label}
            </span>
          </span>
        ))}
      </div>

      {/* ---- typography that resolves out of the grey bars ---- */}
      <span className={`${styles.deckText} ${styles.deckHead} ${styles.deckHeadA}`} data-hw="deckText">
        Built to
      </span>
      <span className={`${styles.deckText} ${styles.deckHead} ${styles.deckHeadB}`} data-hw="deckText">
        convert.
      </span>
      <span className={`${styles.deckText} ${styles.deckSub}`} data-hw="deckText">
        Design, development and launch — in one place.
      </span>
      <span className={`${styles.deckText} ${styles.deckBtn}`} data-hw="deckText">
        Start a project
      </span>
    </>
  );
}
