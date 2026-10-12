import { createSign } from 'node:crypto';
import type { Project, ProjectId } from './projects';

/**
 * The CMS's only route to GitHub: a GitHub App, authenticated on the server.
 *
 * The app signs a short-lived JWT with its private key and exchanges it for
 * an installation token limited to one project's repository. Tokens live in
 * server memory for their lifetime (about an hour), one per repository, and
 * are never sent to the browser, logged, or written anywhere.
 *
 * Which repository is decided by lib/cms/projects.ts alone: a config is
 * built from a Project, so a request can only ever reach a repository on
 * that server-side list.
 *
 * Required app permissions: Contents — read and write. Optional: Deployments
 * — read, so the editor can report Vercel's progress instead of guessing.
 */

export type GitHubConfig = {
  project: ProjectId;
  appId: string;
  privateKey: string;
  installationId: string;
  owner: string;
  repo: string;
  branch: string;
  api: string;
};

/** Whether the GitHub App itself is configured on this deployment (for any project). */
export const githubAppConfigured = () =>
  Boolean(process.env.GITHUB_APP_ID && process.env.GITHUB_APP_PRIVATE_KEY && process.env.GITHUB_APP_INSTALLATION_ID);

/** The project's repository, reached through the GitHub App — or null if either is not configured. */
export function githubConfig(project: Project): GitHubConfig | null {
  const { GITHUB_APP_ID, GITHUB_APP_PRIVATE_KEY, GITHUB_APP_INSTALLATION_ID } = process.env;
  if (!GITHUB_APP_ID || !GITHUB_APP_PRIVATE_KEY || !GITHUB_APP_INSTALLATION_ID || !project.github) return null;
  return {
    project: project.id,
    appId: GITHUB_APP_ID,
    // Environment variables often carry the PEM with literal "\n".
    privateKey: GITHUB_APP_PRIVATE_KEY.replace(/\\n/g, '\n'),
    installationId: project.github.installationId ?? GITHUB_APP_INSTALLATION_ID,
    owner: project.github.owner,
    repo: project.github.repo,
    branch: project.github.branch,
    api: (process.env.GITHUB_API_URL || 'https://api.github.com').replace(/\/$/, ''),
  };
}

export class GitHubError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
  }
}

const b64url = (v: string | Buffer) => Buffer.from(v).toString('base64url');

function appJwt(c: GitHubConfig) {
  const now = Math.floor(Date.now() / 1000);
  const head = b64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  // Backdated a minute for clock drift; GitHub allows at most ten minutes.
  const body = b64url(JSON.stringify({ iat: now - 60, exp: now + 540, iss: c.appId }));
  const sig = createSign('RSA-SHA256').update(`${head}.${body}`).sign(c.privateKey);
  return `${head}.${body}.${b64url(sig)}`;
}

/** One token per app, installation and repository: a token for one project's repository is never used for another's. */
const tokens = new Map<string, { token: string; expires: number }>();
/** Requests in flight, so parallel reads on one page share a single token request. */
const pending = new Map<string, Promise<string>>();

function installationToken(c: GitHubConfig): Promise<string> {
  const key = `${c.appId}:${c.installationId}:${c.owner}/${c.repo}`.toLowerCase();
  const cached = tokens.get(key);
  if (cached && cached.expires - Date.now() > 5 * 60_000) return Promise.resolve(cached.token);
  let p = pending.get(key);
  if (!p) {
    p = requestToken(c, key).finally(() => pending.delete(key));
    pending.set(key, p);
  }
  return p;
}

async function requestToken(c: GitHubConfig, key: string) {
  const res = await fetch(`${c.api}/app/installations/${c.installationId}/access_tokens`, {
    method: 'POST',
    headers: headers(appJwt(c)),
    // Only this repository, whatever else the installation can see.
    body: JSON.stringify({ repositories: [c.repo] }),
    cache: 'no-store',
  });
  if (!res.ok) {
    // 422 / 404: the installation exists but cannot reach this repository.
    throw new GitHubError(res.status === 422 || res.status === 404
      ? `The GitHub App cannot access ${c.owner}/${c.repo} (${res.status}). Add the repository to the app's installation.`
      : `GitHub App authentication failed (${res.status}). Check the app ID, private key and installation ID.`, res.status);
  }
  const data = (await res.json()) as { token: string; expires_at: string };
  tokens.set(key, { token: data.token, expires: Date.parse(data.expires_at) });
  return data.token;
}

const headers = (token: string) => ({
  Authorization: `Bearer ${token}`,
  Accept: 'application/vnd.github+json',
  'X-GitHub-Api-Version': '2022-11-28',
  'User-Agent': 'vioniche-cms',
  'Content-Type': 'application/json',
});

export async function gh<T>(c: GitHubConfig, path: string, init: { method?: string; body?: unknown } = {}): Promise<T> {
  const token = await installationToken(c);
  const res = await fetch(`${c.api}/repos/${c.owner}/${c.repo}${path}`, {
    method: init.method ?? 'GET',
    headers: headers(token),
    body: init.body === undefined ? undefined : JSON.stringify(init.body),
    cache: 'no-store',
  });
  if (!res.ok) {
    let detail = '';
    try { detail = ((await res.json()) as { message?: string }).message ?? ''; } catch {}
    throw new GitHubError(`GitHub ${init.method ?? 'GET'} ${path.split('?')[0]} failed (${res.status})${detail ? `: ${detail}` : ''}`, res.status);
  }
  return (res.status === 204 ? undefined : await res.json()) as T;
}

export type RepoStatus =
  | { state: 'connected'; repository: string; branch: string }
  | { state: 'access-required' | 'not-configured' | 'error'; repository?: string; message: string };

/**
 * Whether the project's repository and branch can be reached with the app's
 * credentials. Reads only; never changes any permission.
 */
export async function repoStatus(project: Project): Promise<RepoStatus> {
  if (!project.github) return { state: 'not-configured', message: project.githubProblem ?? 'No repository configured.' };
  const repository = `${project.github.owner}/${project.github.repo}`;
  const c = githubConfig(project);
  if (!c) return { state: 'not-configured', repository, message: 'The GitHub App is not configured on this deployment.' };
  try {
    await gh(c, `/git/ref/heads/${encodeURIComponent(c.branch)}`);
    return { state: 'connected', repository, branch: c.branch };
  } catch (e) {
    const status = e instanceof GitHubError ? e.status : 0;
    if (status === 401 || status === 403 || status === 404 || status === 422) {
      return { state: 'access-required', repository, message: `The GitHub App cannot read ${repository} on ${c.branch}. Grant the app access to this repository.` };
    }
    return { state: 'error', repository, message: `GitHub could not be reached (${status || 'network error'}).` };
  }
}

export type Change = { path: string; content: string | Buffer } | { path: string; remove: true };

/**
 * One commit containing every change, built with the Git Data API: blobs,
 * a tree on top of the branch head, a commit, then a fast-forward of the
 * branch. All files land together or not at all. If the branch moved while
 * this was being built, it starts again on the new head once; it never forces.
 */
export async function commitChanges(c: GitHubConfig, changes: Change[], message: string) {
  const ref = `heads/${encodeURIComponent(c.branch)}`;

  for (let attempt = 0; attempt < 2; attempt++) {
    const head = await gh<{ object: { sha: string } }>(c, `/git/ref/${ref}`);
    const base = await gh<{ tree: { sha: string } }>(c, `/git/commits/${head.object.sha}`);

    const tree = await Promise.all(
      changes.map(async (ch) => {
        if ('remove' in ch) return { path: ch.path, mode: '100644', type: 'blob', sha: null };
        if (typeof ch.content === 'string') return { path: ch.path, mode: '100644', type: 'blob', content: ch.content };
        const blob = await gh<{ sha: string }>(c, '/git/blobs', {
          method: 'POST',
          body: { content: ch.content.toString('base64'), encoding: 'base64' },
        });
        return { path: ch.path, mode: '100644', type: 'blob', sha: blob.sha };
      }),
    );

    const newTree = await gh<{ sha: string }>(c, '/git/trees', { method: 'POST', body: { base_tree: base.tree.sha, tree } });
    const commit = await gh<{ sha: string; html_url: string }>(c, '/git/commits', {
      method: 'POST',
      body: { message, tree: newTree.sha, parents: [head.object.sha] },
    });
    try {
      await gh(c, `/git/refs/${ref}`, { method: 'PATCH', body: { sha: commit.sha, force: false } });
      return { sha: commit.sha, url: commit.html_url };
    } catch (e) {
      if (attempt === 0 && e instanceof GitHubError && e.status === 422) continue;
      throw e;
    }
  }
  throw new GitHubError('The branch kept moving while publishing. Try again.', 409);
}

export type DeployState = 'pending' | 'in_progress' | 'success' | 'failure' | 'unknown';

/**
 * What Vercel has reported to GitHub for a commit. Vercel's Git integration
 * creates a GitHub deployment per commit and updates its status; reading it
 * needs the optional Deployments permission. Without it, the honest answer
 * is "unknown", never "done".
 */
export async function deploymentState(c: GitHubConfig, sha: string): Promise<{ state: DeployState; url?: string }> {
  try {
    const deployments = await gh<{ id: number }[]>(c, `/deployments?sha=${sha}&per_page=5`);
    if (!deployments.length) return { state: 'pending' };
    const [status] = await gh<{ state: string; environment_url?: string; target_url?: string }[]>(
      c, `/deployments/${deployments[0].id}/statuses?per_page=1`,
    );
    if (!status) return { state: 'pending' };
    const state: DeployState =
      status.state === 'success' ? 'success'
      : status.state === 'failure' || status.state === 'error' ? 'failure'
      : 'in_progress';
    return { state, url: status.environment_url || status.target_url };
  } catch (e) {
    if (e instanceof GitHubError && (e.status === 403 || e.status === 404)) return { state: 'unknown' };
    throw e;
  }
}
