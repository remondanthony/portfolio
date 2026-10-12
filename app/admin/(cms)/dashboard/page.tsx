import ArticleTable, { toRows } from '@/components/admin/ArticleTable';
import { requireSession } from '@/lib/admin/session';
import { catalog } from '@/lib/cms/catalog';
import { repoStatus, type RepoStatus } from '@/lib/cms/github';
import { getCurrentProject, type Project } from '@/lib/cms/projects';
import { loadLibrary } from '@/lib/cms/seo-data';
import { getStore } from '@/lib/cms/store';

export default async function Dashboard() {
  await requireSession();
  const project = await getCurrentProject();
  const store = getStore(project);
  const [status, entries, lib] = await Promise.all([
    store?.kind === 'github' ? repoStatus(project) : Promise.resolve(null),
    project.features.articles && store ? catalog(store) : Promise.resolve([]),
    store ? loadLibrary(store).catch(() => null) : Promise.resolve(null),
  ]);
  const drafts = entries.filter((e) => e.meta.draft).length;
  const published = entries.filter((e) => !e.meta.draft && !e.error).length;

  return (
    <>
      <div className="ad-head">
        <div>
          <span className="eyebrow" data-testid="project-eyebrow">{project.name.toUpperCase()} · CMS</span>
          <h1 className="ad-h1">Dashboard</h1>
          <p className="ad-sub ad-project-banner">
            <span>Project: <b>{project.name}</b></span>
            <a className="ad-link" href={project.website} target="_blank" rel="noopener noreferrer">{project.website.replace('https://', '')} ↗</a>
            <GitHubStatus project={project} status={status} local={store?.kind === 'local'} />
          </p>
        </div>
        {project.features.articles
          ? <a className="btn btn-dark" href="/admin/blog/new">Create article <span className="dot">→</span></a>
          : <a className="btn btn-dark" href="/admin/seo/keywords">Keywords <span className="dot">→</span></a>}
      </div>

      {!store && (
        <p className="ad-note ad-note--warn">
          {project.github
            ? `Not connected to GitHub, so ${project.name}'s content cannot be listed or saved on this deployment. See docs/cms-setup.md.`
            : `${project.name}'s GitHub repository is not configured: ${project.githubProblem}`}
        </p>
      )}
      {store?.kind === 'local' && (
        <p className="ad-note">Local development: saving writes to this checkout (Vioniche). Nothing is sent to GitHub.</p>
      )}

      {project.features.articles ? (
        <>
          <div className="ad-stats">
            <div className="ad-stat"><span>Articles</span><b>{entries.length}</b></div>
            <div className="ad-stat"><span>Drafts</span><b>{drafts}</b></div>
            <div className="ad-stat"><span>Published</span><b>{published}</b></div>
          </div>
          <div className="ad-section-head">
            <h2>Recent</h2>
            <a href="/admin/blog" className="ad-link">All articles →</a>
          </div>
          <ArticleTable rows={toRows(entries.slice(0, 6))} />
        </>
      ) : (
        <>
          <div className="ad-stats">
            <div className="ad-stat"><span>Keywords</span><b>{lib?.data.keywords.length ?? 0}</b></div>
            <div className="ad-stat"><span>Topic clusters</span><b>{lib?.data.clusters.length ?? 0}</b></div>
          </div>
          <p className="ad-note" data-testid="project-scope-note">
            {project.name} has its keyword library, clusters and research in this CMS, saved to its own repository.
            {store && !lib?.version && ' No SEO data has been saved for it yet — it starts empty.'}
          </p>
        </>
      )}
    </>
  );
}

/** Admin-only: whether this project's repository is reachable with the app's credentials. No token or key is shown. */
function GitHubStatus({ project, status, local }: { project: Project; status: RepoStatus | null; local: boolean }) {
  const repo = project.github ? `${project.github.owner}/${project.github.repo}` : null;
  if (local) return <span className="ad-gh-status" data-testid="github-status">GitHub repository: <b>not used in local development</b></span>;
  if (!status) {
    return (
      <span className="ad-gh-status ad-gh-status--not-configured" data-testid="github-status" data-state="not-configured">
        GitHub repository: <b>Not configured</b>{repo ? ` (${repo})` : ''}{!project.github && project.githubProblem ? ` — ${project.githubProblem}` : ''}
      </span>
    );
  }
  return (
    <span className={`ad-gh-status ad-gh-status--${status.state}`} data-testid="github-status" data-state={status.state}>
      GitHub repository: <b>{status.state === 'connected' ? 'Connected' : status.state === 'access-required' ? 'Access required' : status.state === 'not-configured' ? 'Not configured' : 'Unavailable'}</b>
      {status.repository && <> · <code>{status.repository}</code></>}
      {status.state === 'connected' ? <> on {status.branch}</> : <span className="ad-hint ad-block">{status.message}</span>}
    </span>
  );
}
