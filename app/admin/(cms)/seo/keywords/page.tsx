import KeywordManager, { type Target } from '@/components/admin/seo/KeywordManager';
import SeoNav from '@/components/admin/seo/SeoNav';
import { requireSession } from '@/lib/admin/session';
import { loadLibrary, projectContent } from '@/lib/cms/seo-data';
import { getCurrentProject } from '@/lib/cms/projects';
import { getStore } from '@/lib/cms/store';

/** The keyword library: add, edit, delete, search, filter, cluster and assign. */
export default async function KeywordsPage({ searchParams }: { searchParams: Promise<{ assign?: string }> }) {
  await requireSession();
  const project = await getCurrentProject();
  const store = getStore(project);
  if (!store) return <p className="ad-note ad-note--warn">{project.github ? `Not connected to GitHub, so ${project.name}'s keywords cannot be read on this deployment.` : `${project.name}'s GitHub repository is not configured: ${project.githubProblem}`}</p>;
  const [lib, { entries, pages, items }] = await Promise.all([loadLibrary(store), projectContent(project, store)]);
  // What each content item looked like when this page loaded, so an assignment
  // can be refused if it changed in the meantime.
  const targets: Target[] = items.map((i) => ({
    kind: i.kind, id: i.id, name: i.name, path: i.path, status: i.status,
    primaryKeyword: i.seo.primaryKeyword ?? '',
    secondaryKeywords: i.seo.secondaryKeywords ?? [],
    relatedKeywords: i.seo.relatedKeywords ?? [],
    version: i.kind === 'page' ? pages.data.pages[i.id as keyof typeof pages.data.pages]?.updatedAt ?? '' : entries.find((e) => e.slug === i.id)?.version ?? '',
  }));
  const { assign } = await searchParams;

  return (
    <>
      <div className="ad-head">
        <div>
          <span className="eyebrow" data-testid="project-eyebrow">SEO · {project.name}</span>
          <h1 className="ad-h1">Keywords</h1>
          <p className="ad-sub">{lib.data.keywords.length} keyword{lib.data.keywords.length === 1 ? '' : 's'} · from {store.describe}</p>
        </div>
        <a className="ad-btn" href="/admin/seo/import">Import CSV</a>
      </div>
      <SeoNav current="/admin/seo/keywords" project={project} />
      {lib.error ? (
        <p className="ad-note ad-note--error">{lib.error}. Fix the file in the repository before editing keywords.</p>
      ) : (
        <KeywordManager keywords={lib.data.keywords} clusters={lib.data.clusters} targets={targets} initialAssign={assign ?? null} canAssign={project.features.pageSeo} />
      )}
    </>
  );
}
