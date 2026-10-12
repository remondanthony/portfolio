import { notFound } from 'next/navigation';
import PageSeoEditor from '@/components/admin/seo/PageSeoEditor';
import SeoNav from '@/components/admin/seo/SeoNav';
import { requireSession } from '@/lib/admin/session';
import { catalog } from '@/lib/cms/catalog';
import { loadLibrary, loadPagesSeo, renderedPage, seoItems } from '@/lib/cms/seo-data';
import { getCurrentProject } from '@/lib/cms/projects';
import { getStore } from '@/lib/cms/store';
import ProjectNotice from '@/components/admin/ProjectNotice';
import { isSeoPageKey, seoPage } from '@/lib/seo/content';

export default async function PageSeoRoute({ params }: { params: Promise<{ key: string }> }) {
  await requireSession();
  const { key } = await params;
  if (!isSeoPageKey(key)) notFound();
  const project = await getCurrentProject();
  const store = getStore(project);
  if (!project.features.pageSeo) return <ProjectNotice project={project} what="Page and article SEO" />;
  if (!store) return <p className="ad-note ad-note--warn">Not connected to GitHub, so SEO settings cannot be edited on this deployment.</p>;

  const page = seoPage(key);
  const [entries, lib, pages, rendered] = await Promise.all([catalog(store), loadLibrary(store), loadPagesSeo(store), renderedPage(page.path)]);
  const saved = pages.data.pages[key] ?? {};

  return (
    <>
      <a href="/admin/seo/pages" className="ad-link">← Pages &amp; articles</a>
      <div className="ad-head">
        <div>
          <span className="eyebrow">Page SEO</span>
          <h1 className="ad-h1">{page.name}</h1>
          <p className="ad-sub"><code>{page.path}</code> · its text lives in code; these settings are merged into its metadata when the site builds.</p>
        </div>
        <a className="ad-btn" href={page.path} target="_blank" rel="noopener noreferrer">View page ↗</a>
      </div>
      <SeoNav current="/admin/seo/pages" project={project} />
      {pages.error ? (
        <p className="ad-note ad-note--error">{pages.error}</p>
      ) : (
        <PageSeoEditor
          pageKey={key}
          path={page.path}
          saved={saved}
          rendered={rendered}
          keywords={lib.data.keywords.map((k) => ({ keyword: k.keyword, location: k.location, intent: k.intent }))}
          clusters={lib.data.clusters.map((c) => ({ id: c.id, name: c.name }))}
          items={seoItems(entries, pages.data)}
          storeKind={store.kind}
        />
      )}
    </>
  );
}
