import ArticleTable from '@/components/admin/ArticleTable';
import { requireSession } from '@/lib/admin/session';
import { catalog } from '@/lib/cms/catalog';
import { getStore } from '@/lib/cms/store';

export default async function Dashboard() {
  await requireSession();
  const store = getStore();
  const entries = store ? await catalog(store) : [];
  const drafts = entries.filter((e) => e.meta.draft).length;
  const published = entries.filter((e) => !e.meta.draft && !e.error).length;

  return (
    <>
      <div className="ad-head">
        <div>
          <span className="eyebrow">VIONICHE CMS</span>
          <h1 className="ad-h1">Dashboard</h1>
        </div>
        <a className="btn btn-dark" href="/admin/blog/new">Create article <span className="dot">→</span></a>
      </div>

      {!store && (
        <p className="ad-note ad-note--warn">
          Not connected to GitHub, so articles cannot be listed or saved on this deployment. See docs/cms-setup.md.
        </p>
      )}
      {store?.kind === 'local' && (
        <p className="ad-note">Local development: saving writes to this checkout&rsquo;s content/blog/. Nothing is sent to GitHub.</p>
      )}

      <div className="ad-stats">
        <div className="ad-stat"><span>Articles</span><b>{entries.length}</b></div>
        <div className="ad-stat"><span>Drafts</span><b>{drafts}</b></div>
        <div className="ad-stat"><span>Published</span><b>{published}</b></div>
      </div>

      <div className="ad-section-head">
        <h2>Recent</h2>
        <a href="/admin/blog" className="ad-link">All articles →</a>
      </div>
      <ArticleTable entries={entries.slice(0, 6)} />
    </>
  );
}
