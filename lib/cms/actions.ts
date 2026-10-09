'use server';

import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { assertSession, adminConfigured, endSession, startSession } from '@/lib/admin/session';
import { verifyPassword } from '@/lib/admin/password';
import { clearFailures, isLimited, recordFailure } from '@/lib/admin/rate-limit';
import type { Post } from '@/lib/blog/model';
import { blocking, runChecks, toMeta } from './article';
import { asPost, catalog, relatedFor } from './catalog';
import { GitHubError, deploymentState, githubConfig, type Change } from './github';
import { MAX_IMAGE_BYTES, imageName, inspectImage } from './images';
import { parseArticle, serializeArticle } from './mdx-file';
import { bodyProblems, compileForPreview } from './safety';
import { articlePath, getStore, isImagePath, versionOf } from './store';
import type { Check, EditorData, Intent, SaveResult, Step } from './types';

/**
 * Every CMS mutation goes through here. Server Actions are POST-only and
 * Next.js rejects any whose Origin does not match the host, which covers
 * CSRF; each one also re-checks the session itself before doing anything.
 * Return values carry only what the editor shows — never tokens or config.
 */

const MAX_BODY_CHARS = 200_000;

/* ---------- sign in / out ---------- */

export async function login(_: { error?: string; userId?: string } | undefined, form: FormData) {
  if (!adminConfigured()) return { error: 'The admin is not configured on this deployment. Set ADMIN_USER_ID, ADMIN_PASSWORD_HASH and SESSION_SECRET.' };

  const h = await headers();
  const ip = (h.get('x-forwarded-for') ?? '').split(',')[0].trim() || h.get('x-real-ip') || 'local';
  // Compared exactly as typed, apart from surrounding spaces.
  const userId = String(form.get('userId') ?? '').trim().slice(0, 200);
  if (isLimited(ip)) return { error: 'Too many attempts. Wait fifteen minutes and try again.', userId };

  const password = String(form.get('password') ?? '');
  // The form marks both fields required; this is the server's own check.
  if (!userId || !password) return { error: 'Enter your user ID and password.', userId };

  // The hash is checked even for a wrong user ID, so both failures take the same time.
  const passwordOk = await verifyPassword(password, process.env.ADMIN_PASSWORD_HASH);
  const userOk = userId === process.env.ADMIN_USER_ID!.trim();

  if (!passwordOk || !userOk) {
    recordFailure(ip);
    // The user ID comes back so the form can keep it; the password never does.
    return { error: 'That user ID and password do not match.', userId };
  }
  clearFailures(ip);
  await startSession(userId);
  // A fixed destination: nothing from the request decides where this goes.
  redirect('/admin/dashboard');
}

export async function logout() {
  await endSession();
  redirect('/admin/login');
}

/* ---------- reading the editor's payload ---------- */

function readData(raw: unknown): EditorData {
  const d = (typeof raw === 'string' ? JSON.parse(raw) : raw) as EditorData;
  const str = (v: unknown, max = 2000) => (typeof v === 'string' ? v.slice(0, max) : '');
  const arr = (v: unknown) => (Array.isArray(v) ? v.slice(0, 50).map((x) => str(x, 200)) : []);
  const body = str(d?.body, MAX_BODY_CHARS + 1);
  if (body.length > MAX_BODY_CHARS) throw new Error('The article is too long to save in one go.');
  return {
    originalSlug: d?.originalSlug ? str(d.originalSlug, 120) : null,
    baseVersion: d?.baseVersion ? str(d.baseVersion, 64) : null,
    wasPublished: Boolean(d?.wasPublished),
    slug: str(d?.slug, 120).trim(),
    title: str(d?.title, 300), description: str(d?.description, 500), excerpt: str(d?.excerpt, 500),
    published: str(d?.published, 10), updated: str(d?.updated, 10),
    author: str(d?.author, 40), category: str(d?.category, 40), tags: arr(d?.tags),
    image: {
      src: str(d?.image?.src, 300), alt: str(d?.image?.alt, 300),
      width: Math.max(0, Math.min(20000, Number(d?.image?.width) || 0)),
      height: Math.max(0, Math.min(20000, Number(d?.image?.height) || 0)),
    },
    canonical: str(d?.canonical, 500),
    related: arr(d?.related), caseStudies: arr(d?.caseStudies), services: arr(d?.services),
    primaryKeyword: str(d?.primaryKeyword, 200), secondaryKeywords: arr(d?.secondaryKeywords),
    searchIntent: str(d?.searchIntent, 20),
    // Text fields only; the blog model's ctaProblems() checks the rest.
    cta: d?.cta && typeof d.cta === 'object' && !Array.isArray(d.cta)
      ? Object.fromEntries(Object.entries(d.cta).slice(0, 10).map(([k, v]) => [str(k, 40), str(v, 500)]))
      : null,
    body,
  };
}

const noStore = 'Saving is not available: GitHub is not configured on this deployment. See docs/cms-setup.md.';

/* ---------- checks and preview ---------- */

export async function checkArticle(raw: EditorData, intent: Intent, hasUpload: boolean): Promise<Check[]> {
  await assertSession();
  const store = getStore();
  const existing = store ? (await catalog(store)).map((e) => e.slug) : [];
  return runChecks(readData(raw), intent, { existingSlugs: existing, hasUpload });
}

export async function previewArticle(raw: EditorData): Promise<
  { ok: true; code: string; post: Post; related: Post[] } | { ok: false; problems: string[] }
> {
  await assertSession();
  const d = readData(raw);
  const unsafe = bodyProblems(d.body);
  if (unsafe.length) return { ok: false, problems: unsafe };
  try {
    const code = await compileForPreview(d.body);
    const meta = toMeta(d, d.wasPublished ? 'publish' : 'draft');
    const post = asPost(d.slug || 'preview', { ...meta, title: meta.title || 'Untitled article' }, d.body);
    const store = getStore();
    const related = store ? relatedFor(post, await catalog(store)) : [];
    return { ok: true, code, post, related };
  } catch (e) {
    return { ok: false, problems: [String((e as Error).message).split('\n')[0]] };
  }
}

/* ---------- save and publish ---------- */

export async function saveArticle(form: FormData): Promise<SaveResult> {
  await assertSession();
  const intent: Intent = form.get('intent') === 'publish' ? 'publish' : 'draft';
  const steps: Step[] = [];
  const fail = (message: string, checks: Check[] = []): SaveResult => ({ ok: false, message, checks, steps });

  const store = getStore();
  if (!store) return fail(noStore);

  let d: EditorData;
  try { d = readData(form.get('data')); } catch (e) { return fail((e as Error).message); }

  try {
    const entries = await catalog(store);
    const existingSlugs = entries.map((e) => e.slug);

    // The stored file, not the browser, says whether this article is live.
    const stored = d.originalSlug ? entries.find((e) => e.slug === d.originalSlug) : undefined;
    if (d.originalSlug && !stored) return fail(`"${d.originalSlug}" no longer exists in ${store.describe}. Reload the dashboard.`);
    if (stored && stored.version !== d.baseVersion) {
      return fail('This article was changed elsewhere since you opened it. Copy your changes, reload, and apply them again.');
    }
    d.wasPublished = stored ? !stored.meta.draft : false;
    if (intent === 'draft' && d.wasPublished) {
      return fail('This article is live. Saving it as a draft would take it off the site — use Update to publish your changes.');
    }

    // Featured image upload, checked from its bytes.
    const changes: Change[] = [];
    const file = form.get('image');
    if (file instanceof File && file.size > 0) {
      if (file.size > MAX_IMAGE_BYTES) return fail(`The image is ${(file.size / 1048576).toFixed(1)} MB; the limit is 3 MB.`);
      const bytes = Buffer.from(await file.arrayBuffer());
      const info = inspectImage(bytes);
      if (!info) return fail('The image must be a JPEG, PNG or WebP file.');
      if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(d.slug)) return fail('Set a valid slug before uploading an image — it names the image folder.');
      const name = `${imageName(file.name)}.${info.ext}`;
      d.image = { src: `/blog/${d.slug}/${name}`, alt: d.image.alt, width: info.width, height: info.height };
      changes.push({ path: `public/blog/${d.slug}/${name}`, content: bytes });
    }

    const checks = await runChecks(d, intent, { existingSlugs, hasUpload: false });
    if (blocking(checks)) {
      return fail(intent === 'publish' ? 'Not published — fix the errors below first.' : 'Not saved — fix the errors below first.', checks);
    }
    steps.push({ label: 'Article validated', done: true });

    const meta = toMeta(d, intent);
    const preamble = stored ? parseArticle(stored.source).preamble : '';
    const content = serializeArticle(meta, d.body, preamble);
    changes.unshift({ path: articlePath(d.slug), content });
    // A draft renamed before it was ever published: move it in the same commit.
    if (stored && d.originalSlug !== d.slug) changes.push({ path: articlePath(d.originalSlug!), remove: true });
    steps.push({ label: 'MDX generated', done: true });

    const verb = intent === 'draft' ? 'Save draft' : d.wasPublished ? 'Update' : 'Publish';
    const result = await store.commit(changes, `${verb}: ${meta.title}\n\nVia the Vioniche CMS.`);

    if (store.kind === 'github') {
      steps.push({ label: 'GitHub updated', done: true }, { label: 'Commit created', done: true });
    } else {
      steps.push({ label: `Written to ${articlePath(d.slug)} (local development)`, done: true });
    }

    const live = intent === 'publish';
    return {
      ok: true,
      message:
        store.kind === 'github'
          ? live ? 'Published to GitHub. Vercel deployment is in progress.' : 'Draft saved to GitHub. It is not public.'
          : live ? 'Published locally. Push or deploy to make it live.' : 'Draft saved locally.',
      checks,
      steps,
      slug: d.slug,
      version: versionOf(content),
      wasPublished: live,
      commit: result,
      store: store.kind,
      image: d.image,
    };
  } catch (e) {
    const msg = e instanceof GitHubError ? `GitHub rejected the update: ${e.message}` : `Could not save: ${(e as Error).message}`;
    return fail(`${msg} Nothing was published.`);
  }
}

/* ---------- media library ---------- */

export type UploadResult =
  | { ok: true; src: string; width: number; height: number; commit?: { sha?: string; url?: string }; store: 'github' | 'local' }
  | { ok: false; message: string };

/**
 * Adds an image to an existing article's folder, public/blog/<slug>/, through
 * the same checks as an article upload: the type is read from the bytes, the
 * size is capped, the name is reduced to a safe slug, and the final path must
 * match the CMS image pattern. A name already in that folder gets a numbered
 * suffix, so an upload can never replace an image an article is using.
 */
export async function uploadImage(form: FormData): Promise<UploadResult> {
  await assertSession();
  const store = getStore();
  if (!store) return { ok: false, message: noStore };

  const slug = String(form.get('slug') ?? '');
  const file = form.get('image');
  if (!(file instanceof File) || file.size === 0) return { ok: false, message: 'Choose an image to upload.' };
  if (file.size > MAX_IMAGE_BYTES) return { ok: false, message: `The image is ${(file.size / 1048576).toFixed(1)} MB; the limit is 3 MB.` };

  try {
    const entries = await catalog(store);
    if (!entries.some((e) => e.slug === slug)) return { ok: false, message: 'Choose one of the existing articles as the image folder.' };

    const bytes = Buffer.from(await file.arrayBuffer());
    const info = inspectImage(bytes);
    if (!info) return { ok: false, message: 'The image must be a JPEG, PNG or WebP file.' };

    const taken = new Set(await store.listImages());
    const base = imageName(file.name, 'image');
    let name = `${base}.${info.ext}`;
    for (let n = 2; taken.has(`public/blog/${slug}/${name}`); n++) name = `${base}-${n}.${info.ext}`;
    const repoPath = `public/blog/${slug}/${name}`;
    if (!isImagePath(repoPath)) return { ok: false, message: 'That file name cannot be used.' };

    const commit = await store.commit([{ path: repoPath, content: bytes }], `Upload image: ${slug}/${name}\n\nVia the Vioniche CMS.`);
    return { ok: true, src: `/blog/${slug}/${name}`, width: info.width, height: info.height, commit, store: store.kind };
  } catch (e) {
    const msg = e instanceof GitHubError ? `GitHub rejected the upload: ${e.message}` : `Could not upload: ${(e as Error).message}`;
    return { ok: false, message: msg };
  }
}

export async function deploymentStatus(sha: string) {
  await assertSession();
  const c = githubConfig();
  if (!c || !/^[0-9a-f]{40}$/.test(sha)) return { state: 'unknown' as const };
  return deploymentState(c, sha);
}
