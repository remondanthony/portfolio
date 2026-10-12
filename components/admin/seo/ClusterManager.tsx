'use client';

import { useProject } from '@/components/admin/ProjectScope';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { deleteCluster, saveCluster, type SeoResult } from '@/lib/cms/seo-actions';
import type { Cluster } from '@/lib/seo/keywords';
import { Status } from './KeywordManager';

type Kw = { id: string; keyword: string; type: string; cluster?: string };
type ContentRef = { cluster: string; name: string; path: string; href: string; status: string };

/**
 * Clusters and their members. Keywords join a cluster from the Keywords
 * screen (edit, or select several and "Move to cluster"); pages and articles
 * join from their own SEO settings.
 */
export default function ClusterManager({ clusters, keywords, content }: { clusters: Cluster[]; keywords: Kw[]; content: ContentRef[] }) {
  const project = useProject();
  const router = useRouter();
  const [form, setForm] = useState<{ id: string | null; updatedAt?: string; name: string; primaryKeyword: string; description: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<SeoResult | null>(null);
  const [deleting, setDeleting] = useState<Cluster | null>(null);

  const run = async (fn: () => Promise<SeoResult>, after?: (r: SeoResult) => void) => {
    setBusy(true);
    setResult(null);
    try {
      const r = await fn();
      setResult(r);
      after?.(r);
      if (r.ok) router.refresh();
    } catch (e) {
      setResult({ ok: false, message: `Could not reach the server: ${(e as Error).message}` });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="ad-seo">
      {result && <Status result={result} />}
      <div className="ad-seo-toolbar">
        <button type="button" className="btn btn-dark" disabled={busy} onClick={() => setForm({ id: null, name: '', primaryKeyword: '', description: '' })}>New cluster <span className="dot">+</span></button>
      </div>

      {form && (
        <form className="ad-panel ad-kw-form" onSubmit={(e) => {
          e.preventDefault();
          run(() => saveCluster(project.id, { name: form.name, primaryKeyword: form.primaryKeyword, description: form.description }, { id: form.id ?? undefined, updatedAt: form.updatedAt }),
            (r) => { if (r.ok) setForm(null); });
        }}>
          <h2>{form.id ? `Edit “${form.name}”` : 'New cluster'}</h2>
          <div className="ad-kw-grid">
            <label className="field ad-field"><span className="ad-label">Cluster name</span><input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Website Development" /></label>
            <label className="field ad-field"><span className="ad-label">Primary keyword</span>
              <input list="cluster-kw" value={form.primaryKeyword} onChange={(e) => setForm({ ...form, primaryKeyword: e.target.value })} placeholder="website development company" />
              <datalist id="cluster-kw">{keywords.map((k) => <option key={k.id} value={k.keyword} />)}</datalist>
            </label>
            <label className="field ad-field ad-kw-wide"><span className="ad-label">Description</span><textarea rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></label>
          </div>
          <div className="ad-dialog-actions">
            <button type="button" className="ad-btn" onClick={() => setForm(null)} disabled={busy}>Cancel</button>
            <button type="submit" className="btn btn-dark" disabled={busy}>{busy ? 'Saving…' : form.id ? 'Save changes' : 'Create cluster'}</button>
          </div>
        </form>
      )}

      {clusters.length === 0 ? (
        <div className="ad-empty"><p>No clusters yet. Create one, then move keywords into it from the Keywords screen.</p></div>
      ) : (
        <div className="ad-clusters">
          {clusters.map((c) => {
            const members = keywords.filter((k) => k.cluster === c.id);
            const pages = content.filter((x) => x.cluster === c.id);
            return (
              <section key={c.id} className="ad-panel ad-cluster" data-cluster={c.name}>
                <div className="ad-cluster-head">
                  <h2>{c.name}</h2>
                  <span className="ad-suggest-actions">
                    <button type="button" className="ad-mini" disabled={busy} onClick={() => setForm({ id: c.id, updatedAt: c.updatedAt, name: c.name, primaryKeyword: c.primaryKeyword ?? '', description: c.description ?? '' })}>Edit</button>
                    <button type="button" className="ad-mini ad-danger" disabled={busy} onClick={() => setDeleting(c)}>Delete</button>
                  </span>
                </div>
                {c.description && <p className="ad-hint">{c.description}</p>}
                <p><span className="ad-label">Primary keyword</span> {c.primaryKeyword ? <b>{c.primaryKeyword}</b> : <span className="ad-hint">Not set</span>}</p>
                <p className="ad-label">Keywords ({members.length})</p>
                {members.length ? (
                  <ul className="ad-chips">{members.map((k) => <li key={k.id} className={k.keyword === c.primaryKeyword ? 'is-primary' : undefined}>{k.keyword}</li>)}</ul>
                ) : <p className="ad-hint">None yet — use “Move to cluster” on the Keywords screen.</p>}
                <p className="ad-label">Content in this cluster ({pages.length})</p>
                {pages.length ? (
                  <ul className="ad-opp-list">{pages.map((p) => <li key={p.path}><a className="ad-title-link" href={p.href}>{p.name}</a> <code>{p.path}</code> <span className="ad-hint">· {p.status}</span></li>)}</ul>
                ) : <p className="ad-hint">No page or article has chosen this cluster yet.</p>}
              </section>
            );
          })}
        </div>
      )}

      {deleting && (
        <dialog ref={(d) => { if (d && !d.open) d.showModal(); }} className="ad-dialog" onCancel={(e) => { e.preventDefault(); if (!busy) setDeleting(null); }} aria-label="Delete cluster">
          <div className="ad-dialog-body">
            <h2>Delete cluster?</h2>
            <p className="ad-dialog-subject">{deleting.name}</p>
            <p>Its keywords stay in the library, without a cluster. Pages and articles that chose it keep their setting until edited.</p>
            <div className="ad-dialog-actions">
              <button type="button" className="ad-btn" onClick={() => setDeleting(null)} disabled={busy} autoFocus>Cancel</button>
              <button type="button" className="ad-btn ad-btn--danger" disabled={busy} onClick={() => run(() => deleteCluster(project.id, deleting.id, deleting.updatedAt), () => setDeleting(null))}>Delete cluster</button>
            </div>
          </div>
        </dialog>
      )}
    </div>
  );
}
