import type { Entry } from '@/lib/cms/catalog';
import { formatDate } from '@/lib/blog/format';

const status = (e: Entry) => (e.error ? 'invalid' : e.meta.draft ? 'draft' : 'published');
const date = (d?: string) => (d ? formatDate(d) : '—');

export default function ArticleTable({ entries }: { entries: Entry[] }) {
  if (!entries.length) {
    return (
      <div className="ad-empty">
        <p>No articles yet.</p>
        <a className="btn btn-dark" href="/admin/blog/new">Create the first article <span className="dot">→</span></a>
      </div>
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
        {entries.map((e) => (
          <tr key={e.slug}>
            <td data-label="Title">
              <a className="ad-title-link" href={`/admin/blog/${e.slug}/edit`}>{e.meta.title || 'Untitled'}</a>
              {e.error && <span className="ad-row-error">{e.error}</span>}
            </td>
            <td data-label="Slug"><code>{e.slug}</code></td>
            <td data-label="Category">{e.meta.category ?? '—'}</td>
            <td data-label="Status"><span className={`ad-pill ad-pill--${status(e)}`}>{status(e)}</span></td>
            <td data-label="Updated">{date(e.meta.updated)}</td>
            <td data-label="Published">{date(e.meta.published)}</td>
            <td className="ad-actions">
              <a href={`/admin/blog/${e.slug}/edit`}>Edit</a>
              <a href={`/admin/blog/${e.slug}/preview`}>Preview</a>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
