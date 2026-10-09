'use client';

import { useEffect, useRef, useState, type ComponentType, type ReactNode } from 'react';
import * as runtime from 'react/jsx-runtime';
import ArticleView from '@/components/blog/ArticleView';
import { AUTHORS, CATEGORIES, type Post } from '@/lib/blog/model';
import { CASE_STUDIES, SERVICES } from '@/lib/blog/links';
import { checkArticle, deploymentStatus, previewArticle, saveArticle } from '@/lib/cms/actions';
import type { Check, EditorData, Intent, SaveResult } from '@/lib/cms/types';
import { readiness } from '@/lib/cms/readiness';
import { suggestLinks, type CatalogItem } from '@/lib/cms/suggestions';
import { useMDXComponents } from '@/mdx-components';
import Lifecycle from './Lifecycle';

/**
 * The article editor.
 *
 * Markdown, not rich text: the blog's files are MDX, and a WYSIWYG editor
 * would have to translate to and from them. Writing the format directly keeps
 * what is saved exactly what was written. The toolbar inserts the same
 * Markdown a writer would type.
 *
 * Nothing here talks to GitHub. Every button calls a Server Action, which
 * re-checks the session, validates, and commits on the server.
 */

type Other = CatalogItem;
type MDXContent = ComponentType<{ components?: unknown }>;
type Preview =
  | { state: 'closed' }
  | { state: 'loading' }
  | { state: 'error'; problems: string[] }
  | { state: 'open'; Content: MDXContent; post: Post; related: Post[] };

const MAX_IMAGE = 3 * 1024 * 1024;
const slugify = (s: string) =>
  s.toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80);
const splitList = (s: string) => s.split(',').map((x) => x.trim()).filter(Boolean);

// Runs MDX compiled on the server (function-body output) with React's runtime.
const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor as new (body: string) => (
  scope: unknown,
) => Promise<{ default: MDXContent }>;

export default function Editor({ initial, others, storeKind, copyOf }: {
  initial: EditorData;
  others: Other[];
  storeKind: 'github' | 'local' | null;
  /** Set when this new article started as a duplicate of an existing one. */
  copyOf?: { slug: string; title: string };
}) {
  const [d, setD] = useState<EditorData>(initial);
  const [slugTouched, setSlugTouched] = useState(Boolean(initial.originalSlug));
  const [dirty, setDirty] = useState(false);
  const [checks, setChecks] = useState<Check[] | null>(null);
  const [busy, setBusy] = useState<null | 'check' | Intent | 'preview'>(null);
  const [result, setResult] = useState<SaveResult | null>(null);
  const [deploy, setDeploy] = useState<{ state: string; url?: string } | null>(null);
  const [preview, setPreview] = useState<Preview>({ state: 'closed' });
  const [upload, setUpload] = useState<{ file: File; url: string; width: number; height: number } | null>(null);
  const [imageError, setImageError] = useState('');
  const bodyRef = useRef<HTMLTextAreaElement>(null);
  const components = useMDXComponents();

  const isNew = !d.originalSlug;
  const slugLocked = d.wasPublished;

  const set = <K extends keyof EditorData>(key: K, value: EditorData[K]) => {
    setD((prev) => {
      const next = { ...prev, [key]: value };
      if (key === 'title' && !slugTouched && !prev.wasPublished) next.slug = slugify(String(value));
      return next;
    });
    setDirty(true);
  };

  // A new article defaults to today in the writer's time zone, not the server's UTC date.
  useEffect(() => {
    if (initial.originalSlug) return;
    const t = new Date();
    const local = `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')}`;
    setD((p) => (p.published === initial.published ? { ...p, published: local } : p));
  }, [initial.originalSlug, initial.published]);

  // Warn before leaving with unsaved changes.
  useEffect(() => {
    const onLeave = (e: BeforeUnloadEvent) => { if (dirty) e.preventDefault(); };
    window.addEventListener('beforeunload', onLeave);
    return () => window.removeEventListener('beforeunload', onLeave);
  }, [dirty]);

  // After a publish, follow Vercel's progress as GitHub reports it.
  useEffect(() => {
    const sha = result?.ok && result.store === 'github' && result.wasPublished ? result.commit?.sha : undefined;
    if (!sha) return;
    let stop = false;
    let tries = 0;
    const poll = async () => {
      if (stop) return;
      const s = await deploymentStatus(sha).catch(() => ({ state: 'unknown' as const }));
      if (stop) return;
      setDeploy(s);
      if ((s.state === 'pending' || s.state === 'in_progress') && ++tries < 60) setTimeout(poll, 5000);
    };
    poll();
    return () => { stop = true; };
  }, [result]);

  useEffect(() => () => { if (upload) URL.revokeObjectURL(upload.url); }, [upload]);

  /* ---------- toolbar ---------- */
  const edit = (fn: (sel: string) => { text: string; select?: [number, number] }) => {
    const ta = bodyRef.current;
    if (!ta) return;
    const { selectionStart: a, selectionEnd: b, value } = ta;
    const { text, select } = fn(value.slice(a, b));
    const next = value.slice(0, a) + text + value.slice(b);
    set('body', next);
    requestAnimationFrame(() => {
      ta.focus();
      const [s, e] = select ?? [text.length, text.length];
      ta.setSelectionRange(a + s, a + e);
    });
  };
  const wrap = (before: string, after: string, placeholder: string) =>
    edit((sel) => {
      const inner = sel || placeholder;
      return { text: before + inner + after, select: [before.length, before.length + inner.length] };
    });
  const prefix = (p: string, placeholder: string) =>
    edit((sel) => {
      const lines = (sel || placeholder).split('\n').map((l, i) => (p === '1. ' ? `${i + 1}. ` : p) + l);
      const text = (bodyRef.current && bodyRef.current.selectionStart > 0 ? '\n' : '') + lines.join('\n');
      return { text, select: [text.length, text.length] };
    });

  const TOOLS: { label: string; title: string; run: () => void }[] = [
    { label: 'H2', title: 'Section heading', run: () => prefix('## ', 'Section heading') },
    { label: 'H3', title: 'Sub-heading', run: () => prefix('### ', 'Sub-heading') },
    { label: 'B', title: 'Bold', run: () => wrap('**', '**', 'bold text') },
    { label: 'I', title: 'Italic', run: () => wrap('*', '*', 'italic text') },
    { label: 'Link', title: 'Link', run: () => wrap('[', '](/blog/)', 'link text') },
    { label: '• List', title: 'Bulleted list', run: () => prefix('- ', 'List item') },
    { label: '1. List', title: 'Numbered list', run: () => prefix('1. ', 'List item') },
    { label: 'Quote', title: 'Blockquote', run: () => prefix('> ', 'Quoted text') },
    { label: 'Code', title: 'Inline code', run: () => wrap('`', '`', 'code') },
    { label: '{ } Block', title: 'Code block', run: () => wrap('\n```\n', '\n```\n', 'code') },
    {
      label: 'Image', title: 'Image (Figure)',
      run: () => edit(() => {
        const t = `\n<Figure src="/blog/${d.slug || 'slug'}/image.jpg" alt="Describe the image" width={1600} height={900} caption="" />\n`;
        return { text: t, select: [15, 15 + `/blog/${d.slug || 'slug'}/image.jpg`.length] };
      }),
    },
  ];

  /* ---------- featured image ---------- */
  const pickImage = (file: File | undefined) => {
    setImageError('');
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) return setImageError('Use a JPEG, PNG or WebP image.');
    if (file.size > MAX_IMAGE) return setImageError(`That image is ${(file.size / 1048576).toFixed(1)} MB; the limit is 3 MB.`);
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      setUpload({ file, url, width: img.naturalWidth, height: img.naturalHeight });
      setD((p) => ({ ...p, image: { ...p.image, width: img.naturalWidth, height: img.naturalHeight } }));
      setDirty(true);
    };
    img.onerror = () => setImageError('That file could not be read as an image.');
    img.src = url;
  };

  // What preview and checks see: an upload counts as the image, with its real size.
  const withUpload = (): EditorData =>
    upload ? { ...d, image: { ...d.image, src: d.image.src || `/blog/${d.slug || 'slug'}/upload.jpg`, width: upload.width, height: upload.height } } : d;

  /* ---------- actions ---------- */
  const runCheck = async () => {
    setBusy('check');
    try { setChecks(await checkArticle(withUpload(), 'publish', Boolean(upload))); }
    finally { setBusy(null); }
  };

  const openPreview = async () => {
    setBusy('preview');
    setPreview({ state: 'loading' });
    try {
      const r = await previewArticle(withUpload());
      if (!r.ok) return setPreview({ state: 'error', problems: r.problems });
      const mod = await new AsyncFunction(r.code)({ ...runtime, baseUrl: window.location.href });
      setPreview({ state: 'open', Content: mod.default, post: r.post, related: r.related });
    } catch (e) {
      setPreview({ state: 'error', problems: [String((e as Error).message)] });
    } finally {
      setBusy(null);
    }
  };

  const save = async (intent: Intent) => {
    setBusy(intent);
    setResult(null);
    setDeploy(null);
    try {
      const fd = new FormData();
      fd.set('intent', intent);
      fd.set('data', JSON.stringify(d));
      if (upload) fd.set('image', upload.file);
      const r = await saveArticle(fd);
      setResult(r);
      if (r.checks.length) setChecks(r.checks);
      if (r.ok && r.slug) {
        setD((p) => ({ ...p, originalSlug: r.slug!, slug: r.slug!, baseVersion: r.version ?? null, wasPublished: Boolean(r.wasPublished), image: r.image ?? p.image }));
        setUpload(null);
        setDirty(false);
        setSlugTouched(true);
        // Update the address without re-mounting, so the status stays on screen.
        if (r.slug !== initial.originalSlug) window.history.replaceState(null, '', `/admin/blog/${r.slug}/edit`);
      }
    } catch (e) {
      setResult({ ok: false, message: `Could not reach the server: ${(e as Error).message}. Nothing was published.`, checks: [], steps: [] });
    } finally {
      setBusy(null);
    }
  };

  const disabled = busy !== null || !storeKind;
  const ready = readiness(d, Boolean(upload));
  const attention = ready.filter((r) => !r.ok).length;
  const suggestions = suggestLinks(d, others);
  const insertLink = (title: string, href: string) => edit((sel) => {
    const text = `[${sel || title}](${href})`;
    return { text, select: [text.length, text.length] };
  });
  const counts = checks && {
    error: checks.filter((c) => c.level === 'error').length,
    warn: checks.filter((c) => c.level === 'warn').length,
  };

  return (
    <div className="ad-editor">
      <div className="ad-bar">
        <div className="ad-bar-l">
          <a href="/admin/blog" className="ad-link">← Articles</a>
          <span className={`ad-pill ad-pill--${d.wasPublished ? 'published' : 'draft'}`}>{d.wasPublished ? 'published' : isNew ? (copyOf ? 'new draft' : 'new') : 'draft'}</span>
          {dirty && <span className="ad-unsaved">Unsaved changes</span>}
        </div>
        <div className="ad-bar-r">
          {!isNew && (
            // Duplicates the saved version as a new, unsaved draft; this article is untouched.
            <a className="ad-btn" href={`/admin/blog/new?from=${d.originalSlug}`}>Duplicate</a>
          )}
          {!isNew && d.originalSlug && d.baseVersion && (
            <Lifecycle
              slug={d.originalSlug}
              version={d.baseVersion}
              status={d.wasPublished ? 'published' : 'draft'}
              title={d.title || d.originalSlug}
              place="editor"
              unsaved={dirty}
              // Now a draft: the same text, a new stored version.
              onUnpublished={(version) => setD((p) => ({ ...p, baseVersion: version, wasPublished: false }))}
              onLeave={() => setDirty(false)}
            />
          )}
          <button type="button" className="ad-btn" onClick={runCheck} disabled={busy !== null}>{busy === 'check' ? 'Checking…' : 'Check'}</button>
          {!d.wasPublished && (
            <button type="button" className="ad-btn" onClick={() => save('draft')} disabled={disabled}>{busy === 'draft' ? 'Saving…' : 'Save draft'}</button>
          )}
          <button type="button" className="ad-btn" onClick={openPreview} disabled={busy !== null}>Preview</button>
          <button type="button" className="btn btn-dark ad-publish" onClick={() => save('publish')} disabled={disabled}>
            {busy === 'publish' ? 'Publishing…' : d.wasPublished ? 'Update' : 'Publish'} <span className="dot">→</span>
          </button>
        </div>
      </div>

      {!storeKind && (
        <p className="ad-note ad-note--warn">Saving is unavailable: GitHub is not configured on this deployment. You can still write, check and preview.</p>
      )}

      {copyOf && isNew && (
        <p className="ad-note">
          Copy of <a href={`/admin/blog/${copyOf.slug}/edit`}>{copyOf.title}</a> — a new draft, not saved yet. Saving creates{' '}
          <code>/blog/{d.slug || '…'}</code> as a draft; the original is not changed.
        </p>
      )}

      {(busy === 'publish' || busy === 'draft' || result) && (
        <Status busy={busy} result={result} deploy={deploy} />
      )}

      <div className="ad-ed-grid">
        <div className="ad-ed-main">
          <input className="ad-title" placeholder="Article title" value={d.title} onChange={(e) => set('title', e.target.value)} aria-label="Title" />
          <Field label="Description" hint={`${d.description.length} characters · meta description and standfirst · aim for 140–160`}>
            <textarea rows={3} value={d.description} onChange={(e) => set('description', e.target.value)} />
          </Field>
          <Field label="Excerpt" hint="Shorter text for the card on /blog">
            <textarea rows={2} value={d.excerpt} onChange={(e) => set('excerpt', e.target.value)} />
          </Field>

          <div className="ad-content">
            <div className="ad-toolbar" role="toolbar" aria-label="Formatting">
              {TOOLS.map((t) => (
                <button key={t.label} type="button" title={t.title} onClick={t.run}>{t.label}</button>
              ))}
            </div>
            <textarea
              ref={bodyRef}
              className="ad-body"
              value={d.body}
              onChange={(e) => set('body', e.target.value)}
              spellCheck
              aria-label="Article body (Markdown)"
            />
            <p className="ad-hint">Markdown. Sections start at <code>##</code>. Links to Vioniche pages use paths like <code>/case-studies/born21</code>.</p>
          </div>
        </div>

        <aside className="ad-ed-side">
          <Panel title={`Checks${counts ? ` · ${counts.error} errors, ${counts.warn} warnings` : ''}`}>
            {checks ? (
              <ul className="ad-checks">
                {checks.map((c, i) => (
                  <li key={i} className={`ad-check ad-check--${c.level}`}>
                    <span aria-hidden="true">{c.level === 'pass' ? '✓' : c.level === 'warn' ? '⚠' : '✗'}</span>
                    <span><span className="ad-sr">{c.level === 'pass' ? 'Pass: ' : c.level === 'warn' ? 'Warning: ' : 'Error: '}</span>{c.label}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="ad-hint">Run <b>Check</b> to see what publishing needs. Errors block publishing; warnings don&rsquo;t.</p>
            )}
          </Panel>

          <Panel title={`SEO readiness · ${attention ? `${attention} item${attention > 1 ? 's' : ''} need${attention > 1 ? '' : 's'} attention` : 'ready to publish'}`}>
            <ul className="ad-checks">
              {ready.map((r) => (
                <li key={r.label} className={`ad-check ad-check--${r.ok ? 'pass' : 'warn'}`}>
                  <span aria-hidden="true">{r.ok ? '✓' : '⚠'}</span>
                  <span><span className="ad-sr">{r.ok ? 'Done: ' : 'Needs attention: '}</span>{r.label}{r.note && <span className="ad-check-note"> — {r.note}</span>}</span>
                </li>
              ))}
            </ul>
            <p className="ad-hint">A checklist, not a ranking score. Nothing here blocks saving — <b>Check</b> decides what can be published.</p>
          </Panel>

          <Panel title="Publishing">
            <Field label="Slug" hint={slugLocked ? 'Locked: this article is live, and changing its slug would break its URL.' : `/blog/${d.slug || '…'}`}>
              <input value={d.slug} disabled={slugLocked} onChange={(e) => { setSlugTouched(true); set('slug', slugify(e.target.value)); }} />
            </Field>
            <div className="ad-row2">
              <Field label="Published"><input type="date" value={d.published} onChange={(e) => set('published', e.target.value)} /></Field>
              <Field label="Updated"><input type="date" value={d.updated} onChange={(e) => set('updated', e.target.value)} /></Field>
            </div>
            <Field label="Category">
              <select value={d.category} onChange={(e) => set('category', e.target.value)}>
                {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
              </select>
            </Field>
            <Field label="Author">
              <select value={d.author} onChange={(e) => set('author', e.target.value)}>
                {Object.entries(AUTHORS).map(([k, a]) => <option key={k} value={k}>{a.name}</option>)}
              </select>
            </Field>
            <Field label="Tags" hint="Comma-separated">
              <input value={d.tags.join(', ')} onChange={(e) => set('tags', splitList(e.target.value))} />
            </Field>
          </Panel>

          <Panel title="Featured image">
            {(upload || d.image.src) && (
              // eslint-disable-next-line @next/next/no-img-element
              <img className="ad-thumb" src={upload?.url ?? d.image.src} alt="" />
            )}
            <Field label={upload ? `New: ${upload.file.name} (${upload.width}×${upload.height})` : 'Upload'} hint="JPEG, PNG or WebP, up to 3 MB. Committed with the article.">
              <input type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => pickImage(e.target.files?.[0])} />
            </Field>
            {imageError && <p className="ad-note ad-note--error">{imageError}</p>}
            <Field label="Alt text" hint="Describe what the image shows">
              <input value={d.image.alt} onChange={(e) => set('image', { ...d.image, alt: e.target.value })} />
            </Field>
            {!upload && (
              <details className="ad-details">
                <summary>Use an existing site image</summary>
                <Field label="Path"><input value={d.image.src} placeholder="/blog/slug/cover.jpg" onChange={(e) => set('image', { ...d.image, src: e.target.value })} /></Field>
                <div className="ad-row2">
                  <Field label="Width"><input type="number" min={1} value={d.image.width || ''} onChange={(e) => set('image', { ...d.image, width: Number(e.target.value) })} /></Field>
                  <Field label="Height"><input type="number" min={1} value={d.image.height || ''} onChange={(e) => set('image', { ...d.image, height: Number(e.target.value) })} /></Field>
                </div>
              </details>
            )}
          </Panel>

          <Panel title="Internal links">
            <Checklist
              label="Case studies"
              options={Object.entries(CASE_STUDIES).map(([k, c]) => ({ value: k, label: c.title }))}
              value={d.caseStudies}
              onChange={(v) => set('caseStudies', v)}
            />
            <Checklist
              label="Services"
              options={Object.entries(SERVICES).map(([k, s]) => ({ value: k, label: s.title }))}
              value={d.services}
              onChange={(v) => set('services', v)}
            />
            <Checklist
              label="Related articles"
              options={others.map((o) => ({ value: o.slug, label: `${o.title}${o.draft ? ' (draft)' : ''}` }))}
              value={d.related}
              onChange={(v) => set('related', v)}
              empty="No other articles yet."
            />
            <div className="ad-suggest">
              <span className="ad-label">Suggested links</span>
              {suggestions.length ? (
                <ul>
                  {suggestions.map((s) => (
                    <li key={s.href}>
                      <span className="ad-suggest-text"><b>{s.title}</b> <code>{s.href}</code><span className="ad-hint">{s.kind} · {s.reason}</span></span>
                      <span className="ad-suggest-actions">
                        <button type="button" className="ad-mini" onClick={() => insertLink(s.title, s.href)} title="Insert a Markdown link at the cursor">Insert</button>
                        <button type="button" className="ad-mini" onClick={() => navigator.clipboard?.writeText(`[${s.title}](${s.href})`)} title="Copy the Markdown link">Copy</button>
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="ad-hint">Every suggested page is already linked.</p>
              )}
            </div>
          </Panel>

          <Panel title="SEO brief">
            <Field label="Primary keyword"><input value={d.primaryKeyword} onChange={(e) => set('primaryKeyword', e.target.value)} /></Field>
            <Field label="Secondary keywords" hint="Comma-separated"><input value={d.secondaryKeywords.join(', ')} onChange={(e) => set('secondaryKeywords', splitList(e.target.value))} /></Field>
            <Field label="Search intent">
              <select value={d.searchIntent} onChange={(e) => set('searchIntent', e.target.value)}>
                <option value="">—</option>
                <option value="informational">Informational</option>
                <option value="commercial">Commercial</option>
                <option value="transactional">Transactional</option>
                <option value="navigational">Navigational</option>
              </select>
            </Field>
            <Field label="Canonical URL" hint="Leave empty — only for articles first published elsewhere">
              <input value={d.canonical} placeholder="https://…" onChange={(e) => set('canonical', e.target.value)} />
            </Field>
            <p className="ad-hint">The brief is saved with the article but never shown on the site.</p>
          </Panel>
        </aside>
      </div>

      {preview.state !== 'closed' && (
        <div className="ad-overlay" role="dialog" aria-modal="true" aria-label="Article preview">
          <div className="ad-preview-bar">
            <span><b>Preview</b> — unsaved, not public</span>
            <button type="button" className="ad-btn" onClick={() => setPreview({ state: 'closed' })} autoFocus>Close preview</button>
          </div>
          {preview.state === 'loading' && <p className="ad-hint ad-pad">Rendering…</p>}
          {preview.state === 'error' && (
            <div className="ad-note ad-note--error ad-pad">
              <p>The article could not be rendered:</p>
              <ul>{preview.problems.map((p) => <li key={p}>{p}</li>)}</ul>
            </div>
          )}
          {preview.state === 'open' && (
            <div className="ad-preview">
              <ArticleView post={preview.post} related={preview.related} imageSrc={upload?.url}>
                <preview.Content components={components} />
              </ArticleView>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Status({ busy, result, deploy }: { busy: string | null; result: SaveResult | null; deploy: { state: string; url?: string } | null }) {
  if (!result) {
    return <div className="ad-status" role="status"><b>{busy === 'publish' ? 'Publishing…' : 'Saving…'}</b></div>;
  }
  const vercel =
    !result.ok || result.store !== 'github' || !result.wasPublished ? null
    : !deploy ? 'Checking Vercel…'
    : deploy.state === 'pending' ? 'Waiting for Vercel to pick up the commit…'
    : deploy.state === 'in_progress' ? '✓ Vercel deployment triggered — building'
    : deploy.state === 'success' ? '✓ Vercel deployment complete — the article is live'
    : deploy.state === 'failure' ? '✗ Vercel reported a failed deployment — check the Vercel dashboard'
    : 'Vercel status not available here — check the Vercel dashboard. (Give the GitHub App read access to Deployments to show it.)';

  // The summary follows what Vercel has actually reported, never ahead of it.
  const message =
    result.ok && vercel && deploy?.state === 'success' ? 'Published. Vercel has deployed it — the article is live.'
    : result.ok && vercel && deploy?.state === 'failure' ? 'Published to GitHub, but the Vercel deployment failed.'
    : result.message;

  return (
    <div className={`ad-status ad-status--${result.ok ? 'ok' : 'error'}`} role="status">
      <ul>
        {result.steps.map((s) => <li key={s.label}>✓ {s.label}</li>)}
        {vercel && <li>{vercel}{deploy?.url && deploy.state === 'success' && <> — <a href={deploy.url} target="_blank" rel="noopener noreferrer">open</a></>}</li>}
      </ul>
      <p><b>{message}</b>{result.commit?.url && <> <a href={result.commit.url} target="_blank" rel="noopener noreferrer">View commit ↗</a></>}</p>
    </div>
  );
}

function Panel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="ad-panel">
      <h2>{title}</h2>
      {children}
    </section>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="field ad-field">
      <span className="ad-label">{label}</span>
      {children}
      {hint && <span className="ad-hint">{hint}</span>}
    </label>
  );
}

function Checklist({ label, options, value, onChange, empty }: {
  label: string; options: { value: string; label: string }[]; value: string[]; onChange: (v: string[]) => void; empty?: string;
}) {
  return (
    <fieldset className="ad-checklist">
      <legend>{label}</legend>
      {options.length === 0 && <p className="ad-hint">{empty}</p>}
      {options.map((o) => (
        <label key={o.value}>
          <input
            type="checkbox"
            checked={value.includes(o.value)}
            onChange={(e) => onChange(e.target.checked ? [...value, o.value] : value.filter((v) => v !== o.value))}
          />
          {o.label}
        </label>
      ))}
    </fieldset>
  );
}
