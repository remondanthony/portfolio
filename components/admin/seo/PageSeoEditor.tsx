'use client';

import { useProject } from '@/components/admin/ProjectScope';
import { useState } from 'react';
import { savePageSeo, type SeoResult } from '@/lib/cms/seo-actions';
import { primaryConflicts, relatedByKeywords, seoChecklist, editHref, type PageSeo, type SeoItem, type readHtml } from '@/lib/seo/content';
import { INTENTS } from '@/lib/seo/keywords';
import { Status } from './KeywordManager';
import SeoChecklistView from './SeoChecklistView';

type Rendered = ReturnType<typeof readHtml> | null;
type Fields = Record<'primaryKeyword' | 'secondaryKeywords' | 'relatedKeywords' | 'searchIntent' | 'targetAudience' | 'targetLocation' | 'cluster' | 'keywordNotes'
  | 'seoTitle' | 'metaDescription' | 'canonical' | 'ogTitle' | 'ogDescription' | 'ogImage', string> & { noindex: boolean; nofollow: boolean };

const split = (s: string) => s.split(',').map((x) => x.trim()).filter(Boolean);

/**
 * SEO settings for one code-built page. Empty fields keep the page's own
 * value from code, shown as the placeholder. The checklist reads the page as
 * it is rendered now, with the title and description you are typing.
 */
export default function PageSeoEditor({ pageKey, path, saved, rendered, keywords, clusters, items, storeKind }: {
  pageKey: string; path: string; saved: PageSeo; rendered: Rendered;
  keywords: { keyword: string; location?: string; intent?: string }[]; clusters: { id: string; name: string }[];
  items: SeoItem[]; storeKind: 'github' | 'local';
}) {
  const project = useProject();
  const [f, setF] = useState<Fields>(() => ({
    primaryKeyword: saved.primaryKeyword ?? '', secondaryKeywords: (saved.secondaryKeywords ?? []).join(', '), relatedKeywords: (saved.relatedKeywords ?? []).join(', '),
    searchIntent: saved.searchIntent ?? '', targetAudience: saved.targetAudience ?? '', targetLocation: saved.targetLocation ?? '',
    // A cluster deleted since this page chose it is dropped rather than resubmitted.
    cluster: saved.cluster && clusters.some((c) => c.id === saved.cluster) ? saved.cluster : '',
    keywordNotes: saved.keywordNotes ?? '', seoTitle: saved.seoTitle ?? '', metaDescription: saved.metaDescription ?? '', canonical: saved.canonical ?? '',
    ogTitle: saved.ogTitle ?? '', ogDescription: saved.ogDescription ?? '', ogImage: saved.ogImage ?? '', noindex: Boolean(saved.noindex), nofollow: Boolean(saved.nofollow),
  }));
  const [version, setVersion] = useState(saved.updatedAt ?? '');
  const [busy, setBusy] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [result, setResult] = useState<SeoResult | null>(null);

  const set = (k: keyof Fields) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const v = e.target.type === 'checkbox' ? (e.target as HTMLInputElement).checked : e.target.value;
    setF((p) => ({ ...p, [k]: v }));
    setDirty(true);
  };

  const seo = { primaryKeyword: f.primaryKeyword.trim() || undefined, secondaryKeywords: split(f.secondaryKeywords), relatedKeywords: split(f.relatedKeywords), cluster: f.cluster || undefined };
  const conflicts = f.primaryKeyword.trim() ? primaryConflicts(f.primaryKeyword, items, { kind: 'page', id: pageKey }) : [];
  const related = relatedByKeywords({ kind: 'page', id: pageKey, seo }, items);
  const checklist = seoChecklist({
    primaryKeyword: f.primaryKeyword,
    title: f.seoTitle.trim() || rendered?.title || '',
    h1: rendered?.h1 ?? '',
    text: rendered?.text ?? '',
    metaDescription: f.metaDescription.trim() || rendered?.description || '',
    path,
    internalLinks: rendered?.internalLinks ?? 0,
    images: rendered?.images ?? 0,
    imagesMissingAlt: rendered?.imagesMissingAlt ?? 0,
  });

  const save = async (confirmed = false) => {
    setBusy(true);
    setResult(null);
    try {
      const r = await savePageSeo(project.id, pageKey, { ...f, secondaryKeywords: split(f.secondaryKeywords), relatedKeywords: split(f.relatedKeywords) }, version, confirmed);
      setResult(r);
      if (r.ok) { setVersion(r.version ?? ''); setDirty(false); }
    } catch (e) {
      setResult({ ok: false, message: `Could not reach the server: ${(e as Error).message}` });
    } finally {
      setBusy(false);
    }
  };

  const titleLen = (f.seoTitle.trim() || rendered?.title || '').length;
  const descLen = (f.metaDescription.trim() || rendered?.description || '').length;

  return (
    <div className="ad-ed-grid ad-seo-ed">
      <div className="ad-ed-main">
        {result && (
          <>
            <Status result={result} />
            {!result.ok && result.needsConfirm && (
              <p><button type="button" className="btn btn-dark" disabled={busy} onClick={() => save(true)}>Save anyway</button></p>
            )}
          </>
        )}
        <form className="ad-panel" onSubmit={(e) => { e.preventDefault(); save(); }}>
          <h2>Keywords</h2>
          <datalist id="library-keywords">{keywords.map((k) => <option key={`${k.keyword}|${k.location ?? ''}`} value={k.keyword}>{k.location}</option>)}</datalist>
          <div className="ad-kw-grid">
            <label className="field ad-field ad-kw-wide"><span className="ad-label">Primary keyword</span>
              <input list="library-keywords" value={f.primaryKeyword} onChange={set('primaryKeyword')} placeholder="Choose from the library or type one" /></label>
            <label className="field ad-field ad-kw-wide"><span className="ad-label">Secondary keywords</span>
              <input list="library-keywords" value={f.secondaryKeywords} onChange={set('secondaryKeywords')} placeholder="Comma-separated" /></label>
            <label className="field ad-field ad-kw-wide"><span className="ad-label">Related keywords</span>
              <input value={f.relatedKeywords} onChange={set('relatedKeywords')} placeholder="Comma-separated" /></label>
            <label className="field ad-field"><span className="ad-label">Search intent</span>
              <select value={f.searchIntent} onChange={set('searchIntent')}><option value="">—</option>{INTENTS.map((i) => <option key={i} value={i}>{i.charAt(0).toUpperCase() + i.slice(1)}</option>)}</select></label>
            <label className="field ad-field"><span className="ad-label">Target location</span><input value={f.targetLocation} onChange={set('targetLocation')} placeholder="e.g. New York, USA" /></label>
            <label className="field ad-field"><span className="ad-label">Target audience</span><input value={f.targetAudience} onChange={set('targetAudience')} placeholder="Optional" /></label>
            <label className="field ad-field"><span className="ad-label">Topic cluster</span>
              <select value={f.cluster} onChange={set('cluster')}><option value="">None</option>{clusters.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
            <label className="field ad-field ad-kw-wide"><span className="ad-label">Keyword notes</span><textarea rows={2} value={f.keywordNotes} onChange={set('keywordNotes')} /></label>
          </div>
          {conflicts.length > 0 && (
            <p className="ad-note ad-note--warn" role="alert">
              This keyword is already being targeted by another page: {conflicts.map((c) => <a key={c.id} href={editHref(c)}>{c.name}</a>).reduce<React.ReactNode[]>((a, x, i) => (i ? [...a, ', ', x] : [x]), [])}. Two pages with the same primary keyword can compete with each other in search.
            </p>
          )}

          <h2 className="ad-h2-gap">Search appearance</h2>
          <p className="ad-hint">Leave a field empty to keep the page&rsquo;s own value (shown greyed out).</p>
          <div className="ad-kw-grid">
            <label className="field ad-field ad-kw-wide"><span className="ad-label">SEO title · {titleLen} characters</span>
              <input value={f.seoTitle} onChange={set('seoTitle')} placeholder={rendered?.title || 'From the page’s code'} /></label>
            <label className="field ad-field ad-kw-wide"><span className="ad-label">Meta description · {descLen} characters</span>
              <textarea rows={3} value={f.metaDescription} onChange={set('metaDescription')} placeholder={rendered?.description || 'From the page’s code'} /></label>
            <label className="field ad-field ad-kw-wide"><span className="ad-label">Canonical URL</span>
              <input value={f.canonical} onChange={set('canonical')} placeholder={rendered?.canonical || `https://www.vioniche.com${path}`} /></label>
            <label className="field ad-field"><span className="ad-label">Open Graph title</span><input value={f.ogTitle} onChange={set('ogTitle')} placeholder="Defaults to the SEO title" /></label>
            <label className="field ad-field"><span className="ad-label">Social image</span><input value={f.ogImage} onChange={set('ogImage')} placeholder="/case-studies/born21/og.jpg" /></label>
            <label className="field ad-field ad-kw-wide"><span className="ad-label">Open Graph description</span><input value={f.ogDescription} onChange={set('ogDescription')} placeholder="Defaults to the meta description" /></label>
          </div>
          <fieldset className="ad-radios">
            <legend className="ad-label">Indexing</legend>
            <label><input type="checkbox" checked={f.noindex} onChange={set('noindex')} /> noindex — ask search engines not to list this page (it also leaves the sitemap)</label>
            <label><input type="checkbox" checked={f.nofollow} onChange={set('nofollow')} /> nofollow — ask search engines not to follow its links</label>
          </fieldset>
          {f.canonical.trim() && f.canonical.trim() !== `https://www.vioniche.com${path === '/' ? '/' : path}` && (
            <p className="ad-note ad-note--warn">This canonical points to a different page, so search engines may index that page instead of this one, and this page leaves the sitemap.</p>
          )}
          {(f.noindex || f.nofollow) && <p className="ad-note ad-note--warn">Robots settings change how search engines treat a live page. Only use them deliberately.</p>}

          <div className="ad-dialog-actions">
            {dirty && <span className="ad-unsaved">Unsaved changes</span>}
            <button type="submit" className="btn btn-dark" disabled={busy}>{busy ? 'Saving…' : 'Save SEO settings'} <span className="dot">→</span></button>
          </div>
          <p className="ad-hint">{storeKind === 'github' ? 'Saves one commit to GitHub; the page’s metadata changes when Vercel finishes deploying.' : 'Saves to content/seo/pages.json in this checkout.'}</p>
        </form>
      </div>

      <aside className="ad-ed-side">
        <section className="ad-panel">
          <h2>SEO checklist</h2>
          {!rendered && <p className="ad-note ad-note--warn">The rendered page could not be read, so the H1, content, link and image checks are unavailable.</p>}
          <SeoChecklistView items={checklist} />
          {rendered && <p className="ad-hint">Read from the page as it is {process.env.NODE_ENV === 'development' ? 'rendered by this dev server' : 'live on www.vioniche.com'}. H1: “{rendered.h1}”.</p>}
        </section>
        <section className="ad-panel">
          <h2>Related content you may want to link to</h2>
          {related.length === 0 ? <p className="ad-hint">Add keywords or a cluster to see related pages and articles.</p> : (
            <ul className="ad-opp-list">
              {related.map((r) => (
                <li key={`${r.item.kind}:${r.item.id}`}>
                  <b>{r.item.name}</b> <code>{r.item.path}</code>
                  <span className="ad-hint ad-block">{r.reasons.join(' · ')}</span>
                </li>
              ))}
            </ul>
          )}
          <p className="ad-hint">Suggestions only — nothing is linked automatically. This page&rsquo;s links live in its code.</p>
        </section>
      </aside>
    </div>
  );
}
