import CsvImport from '@/components/admin/seo/CsvImport';
import SeoNav from '@/components/admin/seo/SeoNav';
import { requireSession } from '@/lib/admin/session';
import { loadLibrary } from '@/lib/cms/seo-data';
import { getCurrentProject } from '@/lib/cms/projects';
import { getStore } from '@/lib/cms/store';

/** Import keyword research exported from Keyword Planner, Search Console, Ahrefs or Semrush. */
export default async function ImportPage() {
  await requireSession();
  const project = await getCurrentProject();
  const store = getStore(project);
  const lib = store ? await loadLibrary(store) : null;
  return (
    <>
      <div className="ad-head">
        <div>
          <span className="eyebrow" data-testid="project-eyebrow">SEO · {project.name}</span>
          <h1 className="ad-h1">Import keywords</h1>
          <p className="ad-sub">Preview first: nothing is saved until you confirm, and existing keywords are never overwritten unless you tick them.</p>
        </div>
      </div>
      <SeoNav current="/admin/seo/import" project={project} />
      {!store ? (
        <p className="ad-note ad-note--warn">{project.github ? `Not connected to GitHub, so keywords cannot be imported into ${project.name} on this deployment.` : `${project.name}'s GitHub repository is not configured: ${project.githubProblem}`}</p>
      ) : lib?.error ? (
        <p className="ad-note ad-note--error">{lib.error}</p>
      ) : (
        <CsvImport clusters={lib?.data.clusters.map((c) => ({ id: c.id, name: c.name })) ?? []} />
      )}
    </>
  );
}
