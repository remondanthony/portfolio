import { randomUUID } from 'node:crypto';
import { libraryProblems, type KeywordLibrary } from '@/lib/seo/keywords';
import { GitHubError } from './github';
import { authorizeProject } from './project-access';
import { loadLibrary } from './seo-data';
import { SEO_DATA_FILES } from './store';

/**
 * Shared by the SEO and research server actions: the read–change–validate–
 * commit cycle for the keyword library. A plain server module, deliberately
 * not 'use server' — nothing here may be callable from the browser.
 */

export type SeoResult =
  | { ok: true; message: string; commit?: { sha?: string; url?: string }; /** New version of what was written, for a follow-up edit. */ version?: string }
  | { ok: false; message: string; conflict?: boolean; problems?: string[]; needsConfirm?: boolean };

export const now = () => new Date().toISOString();
export const newId = (prefix: string) => `${prefix}-${randomUUID().replace(/-/g, '').slice(0, 12)}`;
export const noStore = 'Saving is not available: GitHub is not configured on this deployment. See docs/cms-setup.md.';
export const changed = 'This was changed elsewhere since the page loaded. Reload to see the latest version, then try again.';

export const failed = (e: unknown): SeoResult => ({
  ok: false,
  message: e instanceof GitHubError ? `GitHub rejected the change: ${e.message.replace(/\.$/, '')}. Nothing was saved.` : `Could not save: ${(e as Error).message.replace(/\.$/, '')}. Nothing was saved.`,
});

export const json = (data: unknown) => `${JSON.stringify(data, null, 2)}\n`;

/**
 * Reads the project's library, applies `change`, validates the whole file,
 * and commits to that project's repository only. `projectId` is checked
 * against the server-side project list before anything is read.
 */
export async function withLibrary(projectId: unknown, message: string, change: (lib: KeywordLibrary) => SeoResult | void): Promise<SeoResult> {
  const access = await authorizeProject(projectId, 'keywords');
  if (!access.ok) return access;
  const { project, store } = access;
  try {
    const loaded = await loadLibrary(store);
    if (loaded.error) return { ok: false, message: `${loaded.error}. Fix the file in the repository first.` };
    const lib = structuredClone(loaded.data);
    const r = change(lib);
    if (r && !r.ok) return r;
    const p = libraryProblems(lib);
    if (p.length) return { ok: false, message: 'Not saved.', problems: p };
    const commit = await store.commit([{ path: SEO_DATA_FILES.keywords, content: json(lib) }], `Keywords: ${message}\n\nVia the Vioniche CMS (${project.name}).`);
    return { ok: true, message: r?.message ?? 'Saved.', commit };
  } catch (e) {
    return failed(e);
  }
}

