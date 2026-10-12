'use client';

import { useState } from 'react';
import type { InterestOverTime } from '@/lib/seo/trends';

/** Categorical slots 1–5 of the reference palette, validated on the admin's light surface. */
const COLORS = ['#2a78d6', '#eb6834', '#1baf7a', '#eda100', '#e87ba4'];
const W = 760, H = 260, L = 36, R = 120, T = 12, B = 30;

/**
 * Google Trends interest over time, from the user's own Trends export.
 * One y-scale (Google's 0–100 index), thin 2px lines, a legend plus a label
 * at each line's end, a crosshair tooltip, and the numbers as a table.
 */
export default function TrendsChart({ data }: { data: InterestOverTime }) {
  const [hover, setHover] = useState<number | null>(null);
  const n = data.dates.length;
  const x = (i: number) => L + (n === 1 ? 0 : (i * (W - L - R)) / (n - 1));
  const y = (v: number) => T + (H - T - B) * (1 - v / 100);
  const ticks = [0, 25, 50, 75, 100];
  const xLabels = [...new Set([0, Math.floor((n - 1) / 2), n - 1])];
  // End labels sorted top to bottom and pushed apart so close values never overlap.
  const labelY = data.series.map((s, si) => ({ si, ly: y(s.values[n - 1]) })).sort((a, b) => a.ly - b.ly);
  for (let i = 1; i < labelY.length; i++) labelY[i].ly = Math.max(labelY[i].ly, labelY[i - 1].ly + 14);

  const onMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const box = e.currentTarget.getBoundingClientRect();
    const px = ((e.clientX - box.left) / box.width) * W;
    const i = Math.round(((px - L) / (W - L - R)) * (n - 1));
    setHover(Math.max(0, Math.min(n - 1, i)));
  };

  return (
    <figure className="ad-chart">
      <ul className="ad-legend" aria-label="Terms">
        {data.series.map((s, i) => (
          <li key={s.term}><i style={{ background: COLORS[i] }} aria-hidden="true" />{s.term}{s.place && <span className="ad-hint"> ({s.place})</span>}</li>
        ))}
      </ul>
      <div className="ad-chart-box">
        <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Google Trends interest over time, ${data.dates[0]} to ${data.dates[n - 1]}, 0–100 scale`}
          onMouseMove={onMove} onMouseLeave={() => setHover(null)} tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'ArrowRight') setHover((h) => Math.min(n - 1, (h ?? -1) + 1));
            if (e.key === 'ArrowLeft') setHover((h) => Math.max(0, (h ?? n) - 1));
          }}>
          {ticks.map((t) => (
            <g key={t}>
              <line x1={L} x2={W - R} y1={y(t)} y2={y(t)} className="ad-chart-grid" />
              <text x={L - 8} y={y(t) + 4} textAnchor="end" className="ad-chart-axis">{t}</text>
            </g>
          ))}
          {xLabels.map((i) => (
            <text key={i} x={x(i)} y={H - 8} textAnchor={i === 0 ? 'start' : i === n - 1 ? 'end' : 'middle'} className="ad-chart-axis">{data.dates[i]}</text>
          ))}
          {data.series.map((s, si) => (
            <polyline key={s.term} fill="none" stroke={COLORS[si]} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round"
              points={s.values.map((v, i) => `${x(i)},${y(v)}`).join(' ')} />
          ))}
          {/* Direct labels at each line's end; ink colour, with a coloured dot carrying identity. */}
          {labelY.map(({ si, ly }) => {
            const s = data.series[si];
            return (
              <g key={s.term}>
                <circle cx={x(n - 1)} cy={y(s.values[n - 1])} r={4} fill={COLORS[si]} stroke="#fff" strokeWidth={2} />
                <text x={x(n - 1) + 8} y={ly + 4} className="ad-chart-label">{s.term.length > 14 ? `${s.term.slice(0, 13)}…` : s.term}</text>
              </g>
            );
          })}
          {hover !== null && (
            <g>
              <line x1={x(hover)} x2={x(hover)} y1={T} y2={H - B} className="ad-chart-cross" />
              {data.series.map((s, si) => <circle key={s.term} cx={x(hover)} cy={y(s.values[hover])} r={4} fill={COLORS[si]} stroke="#fff" strokeWidth={2} />)}
            </g>
          )}
        </svg>
        {hover !== null && (
          <div className="ad-chart-tip" style={{ left: `${(x(hover) / W) * 100}%` }} role="status">
            <b>{data.dates[hover]}</b>
            {data.series.map((s, si) => (
              <span key={s.term}><i style={{ background: COLORS[si] }} aria-hidden="true" />{s.term}: {s.values[hover] === 0.5 ? '<1' : s.values[hover]}</span>
            ))}
          </div>
        )}
      </div>
      <figcaption className="ad-hint">Google Trends interest, 0–100: 100 is the highest point among these terms in this export. It is relative interest, not search volume.</figcaption>
      <details className="ad-details">
        <summary>Show as a table</summary>
        <div className="ad-table-wrap">
          <table className="ad-table">
            <thead><tr><th scope="col">{data.period}</th>{data.series.map((s) => <th key={s.term} scope="col">{s.term}</th>)}</tr></thead>
            <tbody>
              {data.dates.map((d, i) => (
                <tr key={d}><td>{d}</td>{data.series.map((s) => <td key={s.term}>{s.values[i] === 0.5 ? '<1' : s.values[i]}</td>)}</tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </figure>
  );
}
