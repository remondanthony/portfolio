import ResearchProviders from '@/components/admin/seo/ResearchProviders';
import SeoNav from '@/components/admin/seo/SeoNav';
import { requireSession } from '@/lib/admin/session';
import { loadLibrary, loadSettings } from '@/lib/cms/seo-data';
import { getCurrentProject } from '@/lib/cms/projects';
import { getStore } from '@/lib/cms/store';

/**
 * SEO → Research providers. Choosing a provider changes the research tools
 * shown here, never which keywords exist: everything saves into the same
 * keyword library. Loading this page makes no request to any provider.
 */
export default async function ResearchPage() {
  await requireSession();
  const project = await getCurrentProject();
  const store = getStore(project);
  const [settings, lib] = await Promise.all([loadSettings(store), store ? loadLibrary(store) : null]);
  return (
    <>
      <div className="ad-head">
        <div>
          <span className="eyebrow" data-testid="project-eyebrow">SEO · {project.name}</span>
          <h1 className="ad-h1">Research providers</h1>
          <p className="ad-sub">Research with Google Trends or your own CSV exports — every result lands in the same keyword library.</p>
        </div>
      </div>
      <SeoNav current="/admin/seo/research" project={project} />
      {!store && <p className="ad-note ad-note--warn">{project.github ? `Not connected to GitHub, so research cannot be saved for ${project.name} on this deployment.` : `${project.name}'s GitHub repository is not configured: ${project.githubProblem}`}</p>}
      {(settings.error || lib?.error) && <p className="ad-note ad-note--error">{settings.error ?? lib?.error}</p>}
      <ResearchProviders
        settings={settings.data}
        canSave={Boolean(store) && !lib?.error}
        clusters={lib?.data.clusters.map((c) => ({ id: c.id, name: c.name })) ?? []}
        keywords={lib?.data.keywords ?? []}
      />
    </>
  );
}
