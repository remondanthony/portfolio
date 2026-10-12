import type { ChecklistItem } from '@/lib/seo/content';

/** The eight-item SEO checklist, in the editor's checklist style. Guidance only. */
export default function SeoChecklistView({ items }: { items: ChecklistItem[] }) {
  return (
    <>
      <ul className="ad-checks">
        {items.map((r) => (
          <li key={r.label} className={`ad-check ad-check--${r.ok ? 'pass' : 'warn'}`}>
            <span aria-hidden="true">{r.ok ? '✓' : '⚠'}</span>
            <span><span className="ad-sr">{r.ok ? 'Done: ' : 'Needs attention: '}</span>{r.label}{r.note && <span className="ad-check-note"> — {r.note}</span>}</span>
          </li>
        ))}
      </ul>
      <p className="ad-hint">Guidance, not a score. Use keywords where they read naturally — nothing here changes the content for you.</p>
    </>
  );
}
