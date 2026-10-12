import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { commitChanges, gh, githubAppConfigured, githubConfig, type Change } from './github';
import { getProject, type Project, type ProjectId } from './projects';

/**
 * Where the CMS reads and writes a project's files.
 *
 * Every store belongs to one project (lib/cms/projects.ts) and reaches only
 * that project's repository.
 *
 * - GitHub (production, and anywhere the app credentials are set): the
 *   repository on the configured branch is the source of truth. Every save
 *   is a commit; Vercel deploys from it.
 * - Local (development only, when GitHub is not configured): reads and
 *   writes content/blog/ and public/blog/ in this checkout, so the CMS can be
 *   used and tested without credentials. Never available in production,
 *   where the filesystem is not the place an article should live. This
 *   checkout is Vioniche's, so only Vioniche has a local store; another
 *   project without GitHub has no store at all.
 *
 * Every path written goes through allowedPath(), which accepts exactly the
 * article and image shapes plus the SEO data files, and nothing else — so
 * no slug or file name can reach outside them. A project without articles
 * (Born21) may write the SEO data files only.
 */

export type StoredArticle = { slug: string; source: string; version: string };
export type CommitResult = { sha?: string; url?: string };
export type StoredImage = { path: string; size: number };

export interface Store {
  kind: 'github' | 'local';
  /** The project this store belongs to; it can reach no other. */
  project: ProjectId;
  describe: string;
  list(): Promise<StoredArticle[]>;
  get(slug: string): Promise<StoredArticle | null>;
  /** CMS-managed images only — public/blog/<slug>/<name>.(jpg|png|webp) — with their size in bytes. */
  listImages(): Promise<StoredImage[]>;
  /** One of the SEO data files (SEO_DATA_FILES), or null if it does not exist yet. */
  readData(path: SeoDataPath): Promise<{ content: string; version: string } | null>;
  commit(changes: Change[], message: string): Promise<CommitResult>;
}

/** The keyword library, the code-built pages' SEO settings and the research settings. Exact paths, never built from input. */
export const SEO_DATA_FILES = { keywords: 'content/seo/keywords.json', pages: 'content/seo/pages.json', settings: 'content/seo/settings.json' } as const;
export type SeoDataPath = (typeof SEO_DATA_FILES)[keyof typeof SEO_DATA_FILES];
const isSeoDataPath = (p: string): p is SeoDataPath => Object.values(SEO_DATA_FILES).includes(p as SeoDataPath);

export const ARTICLE_DIR = 'content/blog';
const ARTICLE_PATH = /^content\/blog\/[a-z0-9]+(?:-[a-z0-9]+)*\.mdx$/;
const IMAGE_PATH = /^public\/blog\/[a-z0-9]+(?:-[a-z0-9]+)*\/[a-z0-9]+(?:-[a-z0-9]+)*\.(?:jpg|png|webp)$/;

export const articlePath = (slug: string) => `${ARTICLE_DIR}/${slug}.mdx`;
export const isImagePath = (p: string) => IMAGE_PATH.test(p);

export function allowedPath(p: string, project?: Project) {
  if (!ARTICLE_PATH.test(p) && !IMAGE_PATH.test(p) && !isSeoDataPath(p)) throw new Error(`Refusing to write outside content/blog, public/blog and the SEO data files: ${p}`);
  if (project && !project.features.articles && !isSeoDataPath(p)) throw new Error(`Refusing to write ${p}: ${project.name} has no articles or media in this CMS.`);
  return p;
}

/** Git's blob hash — the same value GitHub reports as a file's sha — used to detect edits made elsewhere. */
export const versionOf = (content: string) =>
  createHash('sha1').update(`blob ${Buffer.byteLength(content)}\0`).update(content).digest('hex');

const isArticleFile = (name: string) => name.endsWith('.mdx') && !name.startsWith('_');

function githubStore(project: Project): Store | null {
  const c = githubConfig(project);
  if (!c) return null;
  const ref = encodeURIComponent(c.branch);

  const read = async (slug: string) => {
    try {
      const f = await gh<{ content: string; encoding: string }>(c, `/contents/${articlePath(slug)}?ref=${ref}`);
      const source = Buffer.from(f.content, 'base64').toString('utf8');
      return { slug, source, version: versionOf(source) };
    } catch (e) {
      if ((e as { status?: number }).status === 404) return null;
      throw e;
    }
  };

  return {
    kind: 'github',
    project: project.id,
    describe: `${c.owner}/${c.repo} on ${c.branch}`,
    async list() {
      let entries: { name: string; type: string }[] = [];
      try {
        entries = await gh(c, `/contents/${ARTICLE_DIR}?ref=${ref}`);
      } catch (e) {
        if ((e as { status?: number }).status !== 404) throw e;
      }
      const slugs = entries.filter((e) => e.type === 'file' && isArticleFile(e.name)).map((e) => e.name.slice(0, -4));
      return (await Promise.all(slugs.map(read))).filter((a): a is StoredArticle => a !== null);
    },
    get: read,
    async listImages() {
      // One request for the whole tree, filtered to the CMS image pattern —
      // nothing else in the repository is ever listed.
      const tree = await gh<{ tree: { path: string; type: string; size?: number }[] }>(c, `/git/trees/${ref}?recursive=1`);
      return tree.tree
        .filter((e) => e.type === 'blob' && IMAGE_PATH.test(e.path))
        .map((e) => ({ path: e.path, size: e.size ?? 0 }))
        .sort((a, b) => a.path.localeCompare(b.path));
    },
    async readData(p) {
      if (!isSeoDataPath(p)) throw new Error('Not an SEO data file');
      try {
        const f = await gh<{ content: string }>(c, `/contents/${p}?ref=${ref}`);
        const content = Buffer.from(f.content, 'base64').toString('utf8');
        return { content, version: versionOf(content) };
      } catch (e) {
        if ((e as { status?: number }).status === 404) return null;
        throw e;
      }
    },
    commit: (changes, message) => commitChanges(c, changes.map((ch) => ({ ...ch, path: allowedPath(ch.path, project) })), message),
  };
}

function localStore(): Store {
  const root = process.cwd();
  const abs = (p: string) => {
    // Development only (getStore never returns this in production), so the
    // bundler need not trace these paths into the deployed server code.
    const full = path.resolve(/*turbopackIgnore: true*/ root, allowedPath(p));
    if (!full.startsWith(root + path.sep)) throw new Error(`Refusing path outside the project: ${p}`);
    return full;
  };
  const read = async (slug: string) => {
    try {
      const source = await fs.readFile(abs(articlePath(slug)), 'utf8');
      return { slug, source, version: versionOf(source) };
    } catch {
      return null;
    }
  };

  return {
    kind: 'local',
    project: 'vioniche',
    describe: 'this checkout (local development — not connected to GitHub)',
    async list() {
      const names = await fs.readdir(path.join(/*turbopackIgnore: true*/ root, ARTICLE_DIR)).catch(() => [] as string[]);
      const slugs = names.filter(isArticleFile).map((n) => n.slice(0, -4));
      return (await Promise.all(slugs.map(read))).filter((a): a is StoredArticle => a !== null);
    },
    get: read,
    async listImages() {
      const base = path.join(/*turbopackIgnore: true*/ root, 'public', 'blog');
      const dirs = await fs.readdir(base, { withFileTypes: true }).catch(() => []);
      const out: StoredImage[] = [];
      for (const d of dirs) {
        if (!d.isDirectory()) continue;
        for (const f of await fs.readdir(path.join(base, d.name)).catch(() => [] as string[])) {
          const p = `public/blog/${d.name}/${f}`;
          if (IMAGE_PATH.test(p)) out.push({ path: p, size: (await fs.stat(path.join(base, d.name, f))).size });
        }
      }
      return out.sort((a, b) => a.path.localeCompare(b.path));
    },
    async readData(p) {
      if (!isSeoDataPath(p)) throw new Error('Not an SEO data file');
      try {
        const content = await fs.readFile(abs(p), 'utf8');
        return { content, version: versionOf(content) };
      } catch {
        return null;
      }
    },
    async commit(changes) {
      for (const ch of changes) {
        const file = abs(ch.path);
        if ('remove' in ch) {
          await fs.rm(file, { force: true });
          // An image folder left empty goes too, as it would in Git. rmdir only
          // removes an empty directory, and this one came from a validated path.
          if (IMAGE_PATH.test(ch.path)) await fs.rmdir(path.dirname(file)).catch(() => {});
        }
        else {
          await fs.mkdir(path.dirname(file), { recursive: true });
          await fs.writeFile(file, ch.content);
        }
      }
      return {};
    },
  };
}

/**
 * The project's store: its GitHub repository when the app is configured;
 * for Vioniche only, this checkout in development; otherwise nothing.
 */
export function getStore(project: Project): Store | null {
  // Rebuilt from the server-side list, whatever object was passed in.
  const p = getProject(project?.id);
  if (!p) return null;
  const gh = githubStore(p);
  if (gh) return gh;
  if (process.env.NODE_ENV === 'production' || p.id !== 'vioniche') return null;
  // The app is configured but this repository is not usable: never fall back to the checkout.
  if (githubAppConfigured()) return null;
  return localStore();
}

/** Articles and images belong to the Vioniche website this app builds. */
export const siteStore = () => getStore(getProject('vioniche')!);
