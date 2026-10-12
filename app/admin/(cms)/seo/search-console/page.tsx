import ProjectNotice from '@/components/admin/ProjectNotice';
import SearchConsolePanel from '@/components/admin/seo/SearchConsolePanel';
import SeoNav from '@/components/admin/seo/SeoNav';
import { requireSession } from '@/lib/admin/session';
import { getCurrentProject } from '@/lib/cms/projects';
import { searchConsoleState } from '@/lib/cms/search-console-data';

/** What the OAuth callback reports. Fixed words only — nothing from the URL is shown as text. */
const OUTCOMES: Record<string, { ok: boolean; text: string }> = {
  connected: { ok: true, text: 'Google Search Console is connected. Choose the Vioniche property below.' },
  cancelled: { ok: false, text: 'Connection cancelled: Google access was not granted. Nothing was changed.' },
  state: { ok: false, text: 'The connection could not be verified (expired or mismatched request). Start again with Connect Google Search Console.' },
  invalid: { ok: false, text: 'Google returned an invalid response. Start again with Connect Google Search Console.' },
  denied: { ok: false, text: 'Search Console access was not granted. Connect again and allow "View Search Console data for your verified sites".' },
  error: { ok: false, text: 'Google could not finish the connection. Try again in a moment.' },
  config: { ok: false, text: 'Google OAuth is not configured on this deployment. See docs/cms-setup.md.' },
};

/**
 * SEO → Search Console. Vioniche only: the connection, its property, and
 * performance read through Google's official API. Opening this page makes no
 * request to Google — data is fetched when the admin presses Sync now.
 */
export default async function SearchConsolePage({ searchParams }: { searchParams: Promise<{ gsc?: string }> }) {
  await requireSession();
  const project = await getCurrentProject();
  if (!project.features.searchConsole) return <ProjectNotice project={project} what="Google Search Console" />;
  const state = await searchConsoleState(project);
  const { gsc } = await searchParams;
  const outcome = gsc && Object.prototype.hasOwnProperty.call(OUTCOMES, gsc) ? OUTCOMES[gsc] : null;

  return (
    <>
      <div className="ad-head">
        <div>
          <span className="eyebrow" data-testid="project-eyebrow">SEO · {project.name}</span>
          <h1 className="ad-h1">Search Console</h1>
          <p className="ad-sub">Clicks, impressions, CTR and average position for {project.name}, from Google&rsquo;s official Search Console API.</p>
        </div>
      </div>
      <SeoNav current="/admin/seo/search-console" project={project} />
      {outcome && <p className={`ad-note ${outcome.ok ? '' : 'ad-note--error'}`} role="status" data-testid="gsc-outcome">{outcome.text}</p>}
      <SearchConsolePanel
        projectName={project.name}
        website={project.website}
        configProblem={state.configProblem}
        connection={state.connection}
        initialReport={state.report}
        justConnected={gsc === 'connected'}
      />
    </>
  );
}
