import type { Entry } from '@/lib/cms/catalog';
import { formatDate } from '@/lib/blog/format';

/** One article as the list shows it — never its body or source. */
export type Row = {
  slug: string;
  title: string;
  category: string;
  status: 'published' | 'draft' | 'invalid';
  updated?: string;
  published?: string;
  error?: string;
};

export const toRows = (entries: Entry[]): Row[] =>
  entries.map((e) => ({
    slug: e.slug,
    title: e.meta.title || 'Untitled',
    category: e.meta.category ?? '—',
    status: e.error ? 'invalid' : e.meta.draft ? 'draft' : 'published',
    updated: e.meta.updated,
    published: e.meta.published,
    error: e.error,
  }));

const date = (d?: string) => (d ? formatDate(d) : '—');

export default function ArticleTable({ rows, empty }: { rows: Row[]; empty?: React.ReactNode }) {
  if (!rows.length) {
    return (
      empty ?? (
        <div className="ad-empty">
          <p>No articles yet.</p>
          <a className="btn btn-dark" href="/admin/blog/new">Create the first article <span className="dot">→</span></a>
        </div>
      )
    );
  }
  return (
    <table className="ad-table">
      <thead>
        <tr>
          <th scope="col">Title</th>
          <th scope="col">Slug</th>
          <th scope="col">Category</th>
          <th scope="col">Status</th>
          <th scope="col">Updated</th>
          <th scope="col">Published</th>
          <th scope="col"><span className="ad-sr">Actions</span></th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => (
          <tr key={r.slug}>
            <td data-label="Title">
              <a className="ad-title-link" href={`/admin/blog/${r.slug}/edit`}>{r.title}</a>
              {r.error && <span className="ad-row-error">{r.error}</span>}
            </td>
            <td data-label="Slug"><code>{r.slug}</code></td>
            <td data-label="Category">{r.category}</td>
            <td data-label="Status"><span className={`ad-pill ad-pill--${r.status}`}>{r.status}</span></td>
            <td data-label="Updated">{date(r.updated)}</td>
            <td data-label="Published">{date(r.published)}</td>
            <td className="ad-actions">
              <a href={`/admin/blog/${r.slug}/edit`}>Edit</a>
              <a href={`/admin/blog/${r.slug}/preview`}>Preview</a>
              {/* Opens a new, unsaved draft based on this article; the article itself is not changed. */}
              {!r.error && <a href={`/admin/blog/new?from=${r.slug}`}>Duplicate</a>}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
