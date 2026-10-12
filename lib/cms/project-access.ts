import { assertSession } from '@/lib/admin/session';
import { getProject, type Project, type ProjectFeatures } from './projects';
import { getStore, type Store } from './store';

/**
 * The gate every project-aware Server Action passes, in this order:
 *   1. the admin session (throws if missing — the action never runs);
 *   2. the project ID, against the server-side list — anything else is refused;
 *   3. the feature, if the action needs one the project does not have;
 *   4. the project's own store, built from server configuration only.
 *
 * The browser sends a project ID and nothing more: no owner, repository,
 * branch or path is ever accepted from it. A plain server module, not
 * 'use server' — nothing here is callable from the browser.
 */

export type ProjectAccess =
  | { ok: true; project: Project; store: Store }
  | { ok: false; message: string };

export type ProjectAccessNoStore =
  | { ok: true; project: Project; store: Store | null }
  | { ok: false; message: string };

export const unknownProject = 'Unknown project. Reload the page and choose a project from the switcher.';

export async function authorizeProject(id: unknown, feature: keyof ProjectFeatures): Promise<ProjectAccess>;
export async function authorizeProject(id: unknown, feature: keyof ProjectFeatures, opts: { needStore: false }): Promise<ProjectAccessNoStore>;
export async function authorizeProject(id: unknown, feature: keyof ProjectFeatures, opts?: { needStore: false }): Promise<ProjectAccess | ProjectAccessNoStore> {
  await assertSession();
  const project = getProject(id);
  if (!project) return { ok: false, message: unknownProject };
  if (!project.features[feature]) return { ok: false, message: `${FEATURE_NAMES[feature]} ${FEATURE_NAMES[feature].endsWith('s') ? 'are' : 'is'} not set up for ${project.name} in this CMS.` };
  const store = getStore(project);
  if (!store && opts?.needStore === false) return { ok: true, project, store: null };
  if (!store) {
    return {
      ok: false,
      message: project.github
        ? `Saving is not available for ${project.name}: GitHub is not configured on this deployment. See docs/cms-setup.md.`
        : `${project.name}'s GitHub repository is not configured: ${project.githubProblem}`,
    };
  }
  return { ok: true, project, store };
}

const FEATURE_NAMES: Record<keyof ProjectFeatures, string> = {
  articles: 'Articles',
  media: 'Media',
  pageSeo: 'Page and article SEO',
  keywords: 'The keyword library',
  searchConsole: 'Google Search Console',
};
