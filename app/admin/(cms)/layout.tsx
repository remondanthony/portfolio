import type { ReactNode } from 'react';
import { ProjectScope, ProjectSwitcher } from '@/components/admin/ProjectScope';
import { getSession } from '@/lib/admin/session';
import { logout } from '@/lib/cms/actions';
import { allProjects, getCurrentProject, summary } from '@/lib/cms/projects';
import { getStore } from '@/lib/cms/store';

/**
 * The signed-in shell. It shows the bar only to a signed-in admin, but it is
 * not the security check — layouts do not re-run on every navigation, so
 * each page under it verifies the session itself.
 *
 * The active project is resolved here once per request and given to every
 * client component below (ProjectScope), so the page on screen and the
 * actions it sends always name the same project.
 */
export default async function CmsShell({ children }: { children: ReactNode }) {
  const session = await getSession();
  const project = await getCurrentProject();
  const store = getStore(project);
  return (
    <ProjectScope project={summary(project)}>
      {session && (
        <header className="ad-top">
          <div className="ad-top-inner">
            <a href="/admin/dashboard" className="ad-brand">
              <img src="/logo.png" alt="" width={26} height={26} />
              <span>VIONICHE <b>CMS</b></span>
            </a>
            <ProjectSwitcher projects={allProjects().map(summary)} />
            <nav className="ad-nav" aria-label="Admin">
              <a href="/admin/dashboard">Dashboard</a>
              {project.features.articles && <a href="/admin/blog">Articles</a>}
              {project.features.articles && <a href="/admin/blog/new">New article</a>}
              {project.features.media && <a href="/admin/media">Media</a>}
              <a href="/admin/seo">SEO</a>
            </nav>
            <div className="ad-top-right">
              <span className={`ad-store ad-store--${store?.kind ?? 'none'}`} title={store?.describe ?? project.githubProblem ?? 'Not connected'} data-testid="store-kind">
                {store?.kind === 'github' ? 'GitHub' : store?.kind === 'local' ? 'Local' : 'Not connected'}
              </span>
              {project.features.articles
                ? <a href="/blog" className="ad-link" target="_blank" rel="noopener noreferrer">View blog ↗</a>
                : <a href={project.website} className="ad-link" target="_blank" rel="noopener noreferrer">View {project.name} ↗</a>}
              <form action={logout}>
                <button type="submit" className="ad-btn">Sign out</button>
              </form>
            </div>
          </div>
        </header>
      )}
      <main className="ad-main" data-project={project.id}>{children}</main>
    </ProjectScope>
  );
}
