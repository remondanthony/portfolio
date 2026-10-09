'use client';

import { useMemo, useState } from 'react';
import ArticleTable, { type Row } from './ArticleTable';

/**
 * Search and filters over the article list. Everything is already on the
 * page, so filtering is instant and needs no server round trip.
 */
export default function ArticleBrowser({ rows, categories }: { rows: Row[]; categories: string[] }) {
  const [q, setQ] = useState('');
  const [status, setStatus] = useState<'all' | Row['status']>('all');
  const [category, setCategory] = useState('all');

  const shown = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return rows.filter((r) =>
      (!needle || r.title.toLowerCase().includes(needle) || r.slug.includes(needle)) &&
      (status === 'all' || r.status === status) &&
      (category === 'all' || r.category === category),
    );
  }, [rows, q, status, category]);

  const filtered = q.trim() || status !== 'all' || category !== 'all';

  return (
    <>
      <div className="ad-filters" role="search">
        <label className="field ad-field ad-filter-q">
          <span className="ad-label">Search</span>
          <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Title or slug" />
        </label>
        <label className="field ad-field">
          <span className="ad-label">Status</span>
          <select value={status} onChange={(e) => setStatus(e.target.value as typeof status)}>
            <option value="all">All</option>
            <option value="published">Published</option>
            <option value="draft">Draft</option>
            {rows.some((r) => r.status === 'invalid') && <option value="invalid">Invalid</option>}
          </select>
        </label>
        <label className="field ad-field">
          <span className="ad-label">Category</span>
          <select value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="all">All</option>
            {categories.map((c) => <option key={c}>{c}</option>)}
          </select>
        </label>
      </div>
      <p className="ad-hint ad-count" aria-live="polite">
        {filtered ? `${shown.length} of ${rows.length} articles` : `${rows.length} article${rows.length === 1 ? '' : 's'}`}
      </p>
      <ArticleTable
        rows={shown}
        empty={rows.length ? <div className="ad-empty"><p>No articles match.</p></div> : undefined}
      />
    </>
  );
}
