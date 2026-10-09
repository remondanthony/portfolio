/**
 * A numbered sequence drawn as stations on a line.
 *
 * Horizontal from 1024px, vertical below it, so a seven-step system reads as
 * a flow on a phone instead of shrinking into an unreadable strip. It is an
 * ordered list underneath, so the order survives without any of the drawing.
 *
 * The last station is the one in the orange halo, as on the homepage's
 * process line: the eye lands on where the sequence ends up.
 */

export type FlowStep = { name: string; note?: string };

export default function Flow({
  steps,
  label,
  tone = 'light',
  cols,
}: {
  steps: FlowStep[];
  /** Read out in place of the drawing: what this sequence is. */
  label: string;
  tone?: 'light' | 'dark';
  /** Stations per row on desktop. Defaults to all of them on one line. */
  cols?: number;
}) {
  return (
    <ol
      className={`cs-flow cs-flow--${tone} reveal`}
      aria-label={label}
      style={{ ['--cols' as string]: cols ?? steps.length }}
    >
      {steps.map((s, i) => (
        <li
          key={s.name}
          className="cs-step"
          style={{ ['--i' as string]: i }}
          data-row-end={cols && (i + 1) % cols === 0 ? '' : undefined}
        >
          <span className="cs-step-n">{String(i + 1).padStart(2, '0')}</span>
          <span className="cs-step-name">{s.name}</span>
          {s.note && <span className="cs-step-note">{s.note}</span>}
        </li>
      ))}
    </ol>
  );
}
