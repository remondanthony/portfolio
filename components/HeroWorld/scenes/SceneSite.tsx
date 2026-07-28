import styles from '../HeroWorld.module.css';

/**
 * SCENE 2 & 3 — ASSEMBLY, THEN POLISH
 *
 * The LEGO. Every component declares two things and nothing else:
 *
 *   data-from  the edge it flies in from — 'top' | 'left' | 'right' | 'bottom'
 *   data-order its place in the build queue
 *
 * The timeline reads those and does the rest, which is why nothing here ever
 * "fades in randomly": a nav bar drops from above because that is where a nav
 * bar comes from, cards rise from below, the image slides in from the right
 * edge it will occupy. Direction carries meaning.
 *
 * These same nodes are then polished in scene 3 — they are never replaced.
 */

type PartProps = {
  cls: string;
  role: string;
  from: 'top' | 'left' | 'right' | 'bottom';
  order: number;
  style?: React.CSSProperties;
  children?: React.ReactNode;
};

function Part({ cls, role, from, order, style, children }: PartProps) {
  return (
    <span
      className={`${styles.part} ${cls}`}
      data-hw="part"
      data-role={role}
      data-from={from}
      data-order={order}
      style={style}
    >
      {children}
    </span>
  );
}

const NAV_LINKS = [24, 33, 42] as const;
const CARDS = [
  // Deliberately NOT the hero's process words. This is a client's site being
  // built, not Vioniche's own — echoing Strategy/Design/Development/Launch
  // here would read as the studio talking to itself.
  { left: '0%', label: 'Plan' },
  { left: '34.75%', label: 'Shape' },
  { left: '69.5%', label: 'Finish' },
] as const;

export default function SceneSite() {
  return (
    <div className={styles.site}>
      {/* ---- navigation drops from the top ---- */}
      <Part cls={styles.topbar} role="topbar" from="top" order={0} />
      <Part cls={styles.brand} role="brand" from="top" order={1} />
      {NAV_LINKS.map((left, i) => (
        <Part key={`n${i}`} cls={styles.navLink} role="navLink" from="top" order={2 + i} style={{ left: `${left}%` }} />
      ))}
      <Part cls={styles.navCta} role="navCta" from="top" order={5} />

      {/* ---- hero copy builds from the left margin ---- */}
      <Part cls={styles.h1a} role="h1a" from="left" order={6} />
      <Part cls={styles.h1b} role="h1b" from="left" order={7} />
      <Part cls={styles.subline} role="subline" from="left" order={8} />
      <Part cls={styles.subline2} role="subline2" from="left" order={9} />
      <Part cls={styles.btnPrimary} role="btnPrimary" from="left" order={10} />
      <Part cls={styles.btnGhost} role="btnGhost" from="left" order={11} />

      {/* ---- the image slides in from the edge it will live on ---- */}
      <Part cls={styles.media} role="media" from="right" order={12}>
        <span className={styles.mediaFill} data-hw="mediaFill" />
      </Part>

      {/* ---- cards rise from below ---- */}
      <div className={styles.cardRow}>
        {CARDS.map((c, i) => (
          <Part key={c.label} cls={styles.card} role="card" from="bottom" order={13 + i} style={{ left: c.left }}>
            <span className={styles.cardIcon} data-hw="cardIcon" />
            <span className={`${styles.type} ${styles.typeCard}`} data-hw="type" data-for="card">
              {c.label}
            </span>
          </Part>
        ))}
      </div>

      {/* ---- real typography, revealed during polish ---- */}
      <span className={`${styles.type} ${styles.typeH1} ${styles.typeH1a}`} data-hw="type" data-for="h1a">
        Everything
      </span>
      <span className={`${styles.type} ${styles.typeH1} ${styles.typeH1b}`} data-hw="type" data-for="h1b">
        in order.
      </span>
      <span className={`${styles.type} ${styles.typeSub}`} data-hw="type" data-for="subline">
        Clear plans, careful work, on time.
      </span>
      <span className={`${styles.type} ${styles.typeBtn}`} data-hw="type" data-for="btnPrimary">
        Start a project
      </span>
      <span className={`${styles.type} ${styles.typeGhost}`} data-hw="type" data-for="btnGhost">
        See our work
      </span>
    </div>
  );
}
