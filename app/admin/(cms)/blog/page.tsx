import ArticleBrowser from '@/components/admin/ArticleBrowser';
import { toRows } from '@/components/admin/ArticleTable';
import { CATEGORIES } from '@/lib/blog/model';
import { requireSession } from '@/lib/admin/session';
import { catalog } from '@/lib/cms/catalog';
import ProjectNotice from '@/components/admin/ProjectNotice';
import { getCurrentProject } from '@/lib/cms/projects';
import { siteStore } from '@/lib/cms/store';

export default async function Articles() {
  await requireSession();
  const project = await getCurrentProject();
  if (!project.features.articles) return <ProjectNotice project={project} what="Articles" />;
  const store = siteStore();
  const entries = store ? await catalog(store) : [];
  return (
    <>
      <div className="ad-head">
        <div>
          <span className="eyebrow">Articles</span>
          <h1 className="ad-h1">All articles</h1>
          {store && <p className="ad-sub">From {store.describe}</p>}
        </div>
        <a className="btn btn-dark" href="/admin/blog/new">Create article <span className="dot">→</span></a>
      </div>
      <ArticleBrowser rows={toRows(entries)} categories={[...CATEGORIES]} />
    </>
  );
}
