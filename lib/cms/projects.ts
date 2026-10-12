import { cookies } from 'next/headers';

/**
 * The websites this CMS manages, and the one place that decides which of
 * them a request is about.
 *
 * Each project has its own GitHub repository. A project is only ever chosen
 * by its ID, checked against the list below; the repository, branch and
 * every other detail come from this server-side list, never from the
 * browser. Nothing here is a secret: the GitHub App key, installation token
 * and session secret stay in lib/cms/github.ts and lib/admin/.
 *
 * Repositories, as found in the existing setup:
 * - Vioniche: remondanthony/portfolio — this checkout's origin, and
 *   GITHUB_REPOSITORY in .env.example.
 * - Born21:   remondanthony/Born21 — the origin of the Born21 site's own
 *   checkout. BORN21_GITHUB_REPOSITORY overrides it.
 *
 * Features say what each project has in this CMS today. Articles, media and
 * page-level SEO edit the Vioniche website this app builds; Born21 has only
 * its keyword library (stored in its own repository) for now.
 */

export const PROJECT_IDS = ['vioniche', 'born21'] as const;
export type ProjectId = (typeof PROJECT_IDS)[number];

export type ProjectFeatures = {
  articles: boolean;
  media: boolean;
  /** Page & article SEO, checklist and cannibalisation — tied to this app's own pages. */
  pageSeo: boolean;
  keywords: boolean;
  searchConsole: boolean;
};

export type Project = {
  id: ProjectId;
  name: string;
  website: string;
  /** Null when the repository is missing or unsafe; `githubProblem` says why. */
  github: { owner: string; repo: string; branch: string; installationId?: string } | null;
  githubProblem?: string;
  features: ProjectFeatures;
  /** Search Console: the site's hostnames a property must belong to. */
  searchConsole?: { hosts: string[] };
};

/** What the browser may know about a project: no repository, no configuration. */
export type ProjectSummary = Pick<Project, 'id' | 'name' | 'website'>;

export const PROJECT_COOKIE = 'vcms_project';
export const DEFAULT_PROJECT: ProjectId = 'vioniche';

const REPO = /^([A-Za-z0-9](?:[A-Za-z0-9-]{0,38}))\/([A-Za-z0-9._-]{1,100})$/;
const BRANCH = /^[A-Za-z0-9._/-]{1,100}$/;

type Definition = {
  name: string;
  website: string;
  repository: () => string | undefined;
  branch: () => string | undefined;
  installationId: () => string | undefined;
  features: ProjectFeatures;
  searchConsole?: { hosts: string[] };
};

const DEFINITIONS: Record<ProjectId, Definition> = {
  vioniche: {
    name: 'Vioniche',
    website: 'https://vioniche.com',
    repository: () => process.env.GITHUB_REPOSITORY || 'remondanthony/portfolio',
    branch: () => process.env.GITHUB_BRANCH || 'main',
    installationId: () => undefined,
    features: { articles: true, media: true, pageSeo: true, keywords: true, searchConsole: true },
    searchConsole: { hosts: ['vioniche.com', 'www.vioniche.com'] },
  },
  born21: {
    name: 'Born21',
    website: 'https://born21.com',
    repository: () => process.env.BORN21_GITHUB_REPOSITORY || 'remondanthony/Born21',
    branch: () => process.env.BORN21_GITHUB_BRANCH || 'main',
    // The same GitHub App, possibly through a different installation.
    installationId: () => process.env.BORN21_GITHUB_APP_INSTALLATION_ID || undefined,
    features: { articles: false, media: false, pageSeo: false, keywords: true, searchConsole: false },
  },
};

export const isProjectId = (v: unknown): v is ProjectId =>
  typeof v === 'string' && (PROJECT_IDS as readonly string[]).includes(v);

const repoKey = (r: string) => r.toLowerCase();

function build(id: ProjectId): Project {
  const d = DEFINITIONS[id];
  const base = { id, name: d.name, website: d.website, features: d.features, ...(d.searchConsole && { searchConsole: d.searchConsole }) };
  const repository = (d.repository() ?? '').trim();
  const branch = (d.branch() ?? '').trim();
  const m = repository.match(REPO);
  if (!m) return { ...base, github: null, githubProblem: `No valid GitHub repository is configured for ${d.name} (expected owner/name).` };
  if (!BRANCH.test(branch) || branch.includes('..')) return { ...base, github: null, githubProblem: `The branch configured for ${d.name} is not valid.` };
  // Isolation: no two projects may share a repository. If configuration ever
  // pointed one at another's, the later project is switched off rather than
  // writing into the wrong site.
  for (const other of PROJECT_IDS) {
    if (other === id) break;
    if (repoKey(DEFINITIONS[other].repository() ?? '') === repoKey(repository)) {
      return { ...base, github: null, githubProblem: `${d.name} is configured with ${DEFINITIONS[other].name}'s repository (${repository}). Refusing to use it.` };
    }
  }
  const installationId = d.installationId();
  return { ...base, github: { owner: m[1], repo: m[2], branch, ...(installationId && { installationId }) } };
}

/** The project with this ID, or null if it is not one of ours. Configuration is read fresh each time. */
export function getProject(id: unknown): Project | null {
  return isProjectId(id) ? build(id) : null;
}

export const allProjects = (): Project[] => PROJECT_IDS.map(build);

export const summary = (p: Project): ProjectSummary => ({ id: p.id, name: p.name, website: p.website });

/**
 * The project the admin is working on, for rendering pages: the switcher's
 * choice, or Vioniche. An unknown value is ignored, never followed.
 */
export async function getCurrentProject(): Promise<Project> {
  const chosen = (await cookies()).get(PROJECT_COOKIE)?.value;
  return build(isProjectId(chosen) ? chosen : DEFAULT_PROJECT);
}
