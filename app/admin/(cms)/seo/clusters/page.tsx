import ClusterManager from '@/components/admin/seo/ClusterManager';
import SeoNav from '@/components/admin/seo/SeoNav';
import { requireSession } from '@/lib/admin/session';
import { loadLibrary, projectContent } from '@/lib/cms/seo-data';
import { getCurrentProject } from '@/lib/cms/projects';
import { getStore } from '@/lib/cms/store';
import { editHref } from '@/lib/seo/content';

/** Topic clusters: create, edit, delete; see each cluster's keywords and content. */
export default async function ClustersPage() {
  await requireSession();
  const project = await getCurrentProject();
  const store = getStore(project);
  if (!store) return <p className="ad-note ad-note--warn">{project.github ? `Not connected to GitHub, so ${project.name}'s clusters cannot be read on this deployment.` : `${project.name}'s GitHub repository is not configured: ${project.githubProblem}`}</p>;
  const [lib, { items }] = await Promise.all([loadLibrary(store), projectContent(project, store)]);
  const content = items
    .filter((i) => i.seo.cluster)
    .map((i) => ({ cluster: i.seo.cluster!, name: i.name, path: i.path, href: editHref(i), status: i.status }));

  return (
    <>
      <div className="ad-head">
        <div>
          <span className="eyebrow" data-testid="project-eyebrow">SEO · {project.name}</span>
          <h1 className="ad-h1">Topic clusters</h1>
          <p className="ad-sub">Group keywords around a topic, then point that topic&rsquo;s pages and articles at each other.</p>
        </div>
      </div>
      <SeoNav current="/admin/seo/clusters" project={project} />
      {lib.error ? (
        <p className="ad-note ad-note--error">{lib.error}</p>
      ) : (
        <ClusterManager clusters={lib.data.clusters} keywords={lib.data.keywords.map((k) => ({ id: k.id, keyword: k.keyword, type: k.type, cluster: k.cluster }))} content={content} />
      )}
    </>
  );
}
