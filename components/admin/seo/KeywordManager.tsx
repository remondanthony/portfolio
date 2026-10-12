'use client';

import { useProject } from '@/components/admin/ProjectScope';
import { useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { assignKeyword, deleteKeyword, saveKeyword, setKeywordCluster, type SeoResult } from '@/lib/cms/seo-actions';
import { csvCell } from '@/lib/seo/csv';
import { COMPETITION, INTENTS, KEYWORD_TYPES, SOURCES, STATUSES, normalizeKeyword, type Cluster, type Keyword } from '@/lib/seo/keywords';

export type Target = {
  kind: 'page' | 'article';
  id: string;
  name: string;
  path: string;
  status: string;
  primaryKeyword: string;
  secondaryKeywords: string[];
  relatedKeywords: string[];
  /** Article file version, or the page entry's updatedAt. */
  version: string;
};

type Role = 'primary' | 'secondary' | 'related';
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

const cell = csvCell;

/** The selected keywords as CSV, with every metric's source in its own column. */
function exportCsv(list: Keyword[], clusterName: (id?: string) => string, usedBy: (k: Keyword) => { t: Target; role: Role }[]) {
  const head = ['Keyword', 'Type', 'Search intent', 'Country', 'Location', 'Volume', 'Volume range', 'Keyword difficulty', 'CPC',
    'Competition', 'Metrics source', 'Status', 'Cluster',
    'Google Trends avg interest (relative 0-100)', 'Google Trends place', 'Google Trends range', 'Google Trends date', 'Used by', 'Notes',
    // Appended, so the earlier columns keep their positions for anything that reads this file.
    'Keyword Planner avg monthly searches', 'Keyword Planner volume range', 'Keyword Planner competition', 'Keyword Planner competition index',
    'Keyword Planner three month change %', 'Keyword Planner YoY change %', 'Keyword Planner top of page bid low', 'Keyword Planner top of page bid high',
    'Keyword Planner currency', 'Keyword Planner location', 'Keyword Planner import date'];
  const lines = list.map((k) => [
    k.keyword, k.type, k.intent, k.country, k.location, k.volume, k.volumeRange, k.difficulty, k.cpc, k.competition, SOURCES[k.source], STATUSES[k.status],
    clusterName(k.cluster),
    k.trends?.average, k.trends ? k.trends.geo || 'Worldwide' : undefined, k.trends?.range, k.trends?.importedAt.slice(0, 10),
    usedBy(k).map((u) => `${u.t.path} (${u.role})`).join('; '), k.notes,
    k.planner?.volume, k.planner?.volumeRange, k.planner?.competition, k.planner?.competitionIndex, k.planner?.threeMonthChange, k.planner?.yoyChange,
    k.planner?.bidLow, k.planner?.bidHigh, k.planner?.currency, k.planner?.location, k.planner?.importedAt.slice(0, 10),
  ].map(cell).join(','));
  const blob = new Blob([`\ufeff${[head.map(cell).join(','), ...lines].join('\r\n')}\r\n`], { type: 'text/csv;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `vioniche-keywords-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

/**
 * A figure with the tool it came from underneath. The record's own figures
 * carry the record's source; Keyword Planner's sit in their own block and
 * are always labelled as Keyword Planner's.
 */
function Volume({ k }: { k: Keyword }) {
  const own = k.volume !== undefined ? k.volume.toLocaleString('en') : k.volumeRange;
  const kp = k.planner?.volume !== undefined ? k.planner.volume.toLocaleString('en') : k.planner?.volumeRange;
  if (!own && !kp) return <>—</>;
  return (
    <>
      {own && <div className="ad-metric">{own}<span className="ad-srcl">{SOURCES[k.source]}</span></div>}
      {kp && <div className="ad-metric" data-source="planner">{kp}<span className="ad-srcl">Google Keyword Planner</span></div>}
    </>
  );
}

function Comp({ k }: { k: Keyword }) {
  const p = k.planner;
  const kp = p?.competition || p?.competitionIndex !== undefined;
  if (!k.competition && !kp) return <>—</>;
  return (
    <>
      {k.competition && <div className="ad-metric">{cap(k.competition)}<span className="ad-srcl">{SOURCES[k.source]}</span></div>}
      {kp && (
        <div className="ad-metric" data-source="planner">
          {p!.competition ? cap(p!.competition) : '—'}{p!.competitionIndex !== undefined && ` · ${p!.competitionIndex}`}
          <span className="ad-srcl" title="Google Ads competition — not SEO keyword difficulty">Keyword Planner competition</span>
        </div>
      )}
    </>
  );
}

const blank = { keyword: '', type: 'secondary', intent: '', country: '', location: '', volume: '', volumeRange: '', difficulty: '', cpc: '', competition: '', source: 'google-keyword-planner', status: 'idea', cluster: '', notes: '' };
type Form = typeof blank;
const toForm = (k: Keyword): Form => ({
  keyword: k.keyword, type: k.type, intent: k.intent ?? '', country: k.country ?? '', location: k.location ?? '',
  volume: k.volume?.toString() ?? '', volumeRange: k.volumeRange ?? '', difficulty: k.difficulty?.toString() ?? '', cpc: k.cpc?.toString() ?? '',
  competition: k.competition ?? '', source: k.source, status: k.status, cluster: k.cluster ?? '', notes: k.notes ?? '',
});

/**
 * The keyword library in the browser. Filtering is local (everything is on
 * the page); every change goes to a server action, which re-validates it,
 * commits it, and refuses it if the record changed since this page loaded.
 */
export default function KeywordManager({ keywords, clusters, targets, initialAssign, canAssign = true }: {
  keywords: Keyword[]; clusters: Cluster[]; targets: Target[]; initialAssign: string | null;
  /** False for a project whose pages are not managed here: no assigning, no "assigned" filter. */
  canAssign?: boolean;
}) {
  const project = useProject();
  const router = useRouter();
  const [q, setQ] = useState('');
  const [f, setF] = useState({ type: '', intent: '', status: '', source: '', cluster: '', usage: '' });
  const [editing, setEditing] = useState<{ id: string | null; updatedAt?: string; form: Form } | null>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<SeoResult | null>(null);
  const [assigning, setAssigning] = useState<Keyword | null>(() => keywords.find((k) => k.id === initialAssign) ?? null);
  const [deleting, setDeleting] = useState<Keyword | null>(null);

  const usage = useMemo(() => {
    const m = new Map<string, { t: Target; role: Role }[]>();
    const add = (kw: string, t: Target, role: Role) => {
      const k = normalizeKeyword(kw);
      if (k) m.set(k, [...(m.get(k) ?? []), { t, role }]);
    };
    for (const t of targets) {
      if (t.primaryKeyword) add(t.primaryKeyword, t, 'primary');
      t.secondaryKeywords.forEach((k) => add(k, t, 'secondary'));
      t.relatedKeywords.forEach((k) => add(k, t, 'related'));
    }
    return m;
  }, [targets]);
  const usedBy = (k: Keyword) => usage.get(normalizeKeyword(k.keyword)) ?? [];
  const clusterName = (id?: string) => clusters.find((c) => c.id === id)?.name ?? '';

  const shown = keywords.filter((k) => {
    const needle = q.trim().toLowerCase();
    if (needle && !`${k.keyword} ${k.location ?? ''} ${k.notes ?? ''}`.toLowerCase().includes(needle)) return false;
    if (f.type && k.type !== f.type) return false;
    if (f.intent && (k.intent ?? '') !== f.intent) return false;
    if (f.status && k.status !== f.status) return false;
    if (f.source && k.source !== f.source) return false;
    if (f.cluster && (f.cluster === '-' ? k.cluster : k.cluster !== f.cluster)) return false;
    if (f.usage && (f.usage === 'used') !== usedBy(k).length > 0) return false;
    return true;
  });

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

  const save = () => {
    if (!editing) return;
    const raw = { ...editing.form };
    run(() => saveKeyword(project.id, raw, { id: editing.id ?? undefined, updatedAt: editing.updatedAt }), (r) => { if (r.ok) setEditing(null); });
  };

  const setFilter = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLSelectElement>) => setF((p) => ({ ...p, [k]: e.target.value }));

  return (
    <div className="ad-seo">
      {result && <Status result={result} />}

      <div className="ad-seo-toolbar">
        <button type="button" className="btn btn-dark" onClick={() => setEditing({ id: null, form: { ...blank } })} disabled={busy}>Add keyword <span className="dot">+</span></button>
      </div>

      {editing && (
        <KeywordForm
          form={editing.form}
          clusters={clusters}
          isNew={!editing.id}
          busy={busy}
          onChange={(form) => setEditing({ ...editing, form })}
          onCancel={() => setEditing(null)}
          onSave={save}
        />
      )}

      <div className="ad-filters" role="search">
        <label className="field ad-field ad-filter-q">
          <span className="ad-label">Search</span>
          <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Keyword, location or notes" />
        </label>
        <Select label="Type" value={f.type} onChange={setFilter('type')} options={KEYWORD_TYPES.map((t) => [t, cap(t)])} />
        <Select label="Intent" value={f.intent} onChange={setFilter('intent')} options={INTENTS.map((t) => [t, cap(t)])} />
        <Select label="Status" value={f.status} onChange={setFilter('status')} options={Object.entries(STATUSES)} />
        <Select label="Source" value={f.source} onChange={setFilter('source')} options={Object.entries(SOURCES)} />
        <Select label="Cluster" value={f.cluster} onChange={setFilter('cluster')} options={[['-', 'No cluster'], ...clusters.map((c): [string, string] => [c.id, c.name])]} />
        {canAssign && <Select label="Content" value={f.usage} onChange={setFilter('usage')} options={[['used', 'Assigned'], ['unused', 'Not assigned']]} />}
      </div>
      <p className="ad-hint ad-count" aria-live="polite">
        {shown.length} of {keywords.length} keywords
        {shown.length > 0 && <> · <button type="button" className="ad-linkbtn" onClick={() => exportCsv(shown, clusterName, usedBy)}>Export {shown.length === keywords.length ? 'all' : 'these'} as CSV</button></>}
      </p>

      {selected.length > 0 && (
        <div className="ad-bulk">
          <span>{selected.length} selected</span>
          <label className="field ad-field">
            <span className="ad-sr">Move to cluster</span>
            <select defaultValue="" onChange={(e) => {
              const v = e.target.value;
              if (!v) return;
              run(() => setKeywordCluster(project.id, selected, v === '-' ? null : v), (r) => { if (r.ok) setSelected([]); });
              e.target.value = '';
            }} disabled={busy}>
              <option value="">Move to cluster…</option>
              <option value="-">No cluster</option>
              {clusters.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </label>
          <button type="button" className="ad-mini" onClick={() => exportCsv(keywords.filter((k) => selected.includes(k.id)), clusterName, usedBy)} data-testid="export-selected">Export CSV</button>
          <button type="button" className="ad-mini" onClick={() => setSelected([])}>Clear</button>
        </div>
      )}

      {keywords.length === 0 ? (
        <div className="ad-empty">
          <p>No keywords yet. Add one from your Keyword Planner research, or import an export.</p>
          <a className="btn btn-dark" href="/admin/seo/import">Import CSV <span className="dot">→</span></a>
        </div>
      ) : shown.length === 0 ? (
        <div className="ad-empty"><p>No keywords match these filters.</p></div>
      ) : (
        <div className="ad-table-wrap">
          <table className="ad-table ad-kw-table">
            <thead>
              <tr>
                <th scope="col"><span className="ad-sr">Select</span></th>
                <th scope="col">Keyword</th>
                <th scope="col">Type</th>
                <th scope="col">Intent</th>
                <th scope="col">Volume</th>
                <th scope="col">KD</th>
                <th scope="col">CPC</th>
                <th scope="col">Comp.</th>
                <th scope="col">Cluster</th>
                <th scope="col">Used by</th>
                <th scope="col">Status</th>
                <th scope="col"><span className="ad-sr">Actions</span></th>
              </tr>
            </thead>
            <tbody>
              {shown.map((k) => {
                const used = usedBy(k);
                return (
                  <tr key={k.id} data-keyword={k.keyword}>
                    <td data-label="Select">
                      <input type="checkbox" aria-label={`Select ${k.keyword}`} checked={selected.includes(k.id)}
                        onChange={(e) => setSelected((s) => (e.target.checked ? [...s, k.id] : s.filter((x) => x !== k.id)))} />
                    </td>
                    <td data-label="Keyword">
                      <b>{k.keyword}</b>
                      {(k.location || k.country) && <span className="ad-hint ad-block">{[k.location, k.country].filter(Boolean).join(' · ')}</span>}
                      <span className="ad-hint ad-block">{SOURCES[k.source]}</span>
                      {k.trends && <span className="ad-hint ad-block" title="Google Trends relative interest — not search volume">Google Trends interest {k.trends.average}/100 · {k.trends.geo || 'Worldwide'}</span>}
                    </td>
                    <td data-label="Type"><span className={`ad-pill ad-kw-type ad-kw-type--${k.type}`}>{k.type}</span></td>
                    <td data-label="Intent">{k.intent ? cap(k.intent) : '—'}</td>
                    <td data-label="Volume"><Volume k={k} /></td>
                    <td data-label="KD">{k.difficulty ?? '—'}</td>
                    <td data-label="CPC">{k.cpc !== undefined ? k.cpc.toFixed(2) : '—'}</td>
                    <td data-label="Comp."><Comp k={k} /></td>
                    <td data-label="Cluster">{clusterName(k.cluster) || '—'}</td>
                    <td data-label="Used by">
                      {used.length === 0 ? <span className="ad-hint">Not assigned</span> : (
                        <ul className="ad-used">
                          {used.map((u) => <li key={`${u.t.kind}:${u.t.id}:${u.role}`}>{u.t.name} <span className="ad-hint">({u.role})</span></li>)}
                        </ul>
                      )}
                      {used.filter((u) => u.role === 'primary').length > 1 && <span className="ad-warn-text">Potential keyword cannibalization</span>}
                    </td>
                    <td data-label="Status">{STATUSES[k.status]}</td>
                    <td className="ad-actions">
                      <button type="button" className="ad-row-btn" onClick={() => setEditing({ id: k.id, updatedAt: k.updatedAt, form: toForm(k) })}>Edit</button>
                      {canAssign && <button type="button" className="ad-row-btn" onClick={() => setAssigning(k)}>Assign</button>}
                      <button type="button" className="ad-row-btn ad-danger" onClick={() => setDeleting(k)}>Delete</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {canAssign && assigning && (
        <AssignDialog
          keyword={assigning}
          targets={targets}
          used={usedBy(assigning)}
          onClose={(changed) => { setAssigning(null); if (changed) router.refresh(); }}
        />
      )}
      {deleting && (
        <Confirm
          title="Delete keyword?"
          confirm="Delete keyword"
          danger
          busy={busy}
          onCancel={() => setDeleting(null)}
          onConfirm={() => run(() => deleteKeyword(project.id, deleting.id, deleting.updatedAt), () => setDeleting(null))}
        >
          <p className="ad-dialog-subject">{deleting.keyword}</p>
          <p>This removes the research record from the keyword library.</p>
          {usedBy(deleting).length > 0 && (
            <p className="ad-dialog-warn">It is used by {usedBy(deleting).map((u) => u.t.name).join(', ')}. Those pages keep the keyword — only the library record goes.</p>
          )}
        </Confirm>
      )}
    </div>
  );
}

function Select({ label, value, onChange, options }: { label: string; value: string; onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void; options: readonly (readonly [string, string])[] }) {
  return (
    <label className="field ad-field">
      <span className="ad-label">{label}</span>
      <select value={value} onChange={onChange}>
        <option value="">All</option>
        {options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
      </select>
    </label>
  );
}

export function Status({ result }: { result: SeoResult }) {
  return (
    <div className={`ad-status ${result.ok ? 'ad-status--ok' : 'ad-status--error'}`} role="status">
      <p><b>{result.message}</b>{result.ok && result.commit?.url && <> <a href={result.commit.url} target="_blank" rel="noopener noreferrer">View commit ↗</a></>}</p>
      {!result.ok && result.problems && <ul>{result.problems.map((p) => <li key={p}>{p}</li>)}</ul>}
    </div>
  );
}

function KeywordForm({ form, clusters, isNew, busy, onChange, onCancel, onSave }: {
  form: Form; clusters: Cluster[]; isNew: boolean; busy: boolean; onChange: (f: Form) => void; onCancel: () => void; onSave: () => void;
}) {
  const set = (k: keyof Form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => onChange({ ...form, [k]: e.target.value });
  return (
    <form className="ad-panel ad-kw-form" onSubmit={(e) => { e.preventDefault(); onSave(); }}>
      <h2>{isNew ? 'Add keyword' : `Edit “${form.keyword}”`}</h2>
      <div className="ad-kw-grid">
        <label className="field ad-field ad-kw-wide"><span className="ad-label">Keyword</span><input required value={form.keyword} onChange={set('keyword')} placeholder="website development company New York" /></label>
        <label className="field ad-field"><span className="ad-label">Keyword type</span>
          <select value={form.type} onChange={set('type')}>{KEYWORD_TYPES.map((t) => <option key={t} value={t}>{cap(t)}</option>)}</select></label>
        <label className="field ad-field"><span className="ad-label">Search intent</span>
          <select value={form.intent} onChange={set('intent')}><option value="">—</option>{INTENTS.map((t) => <option key={t} value={t}>{cap(t)}</option>)}</select></label>
        <label className="field ad-field"><span className="ad-label">Target country</span><input value={form.country} onChange={set('country')} placeholder="USA" /></label>
        <label className="field ad-field"><span className="ad-label">Target city / location</span><input value={form.location} onChange={set('location')} placeholder="New York, USA" /></label>
        <label className="field ad-field"><span className="ad-label">Search volume</span><input inputMode="numeric" value={form.volume} onChange={set('volume')} placeholder="Optional" /></label>
        <label className="field ad-field"><span className="ad-label">Volume range</span><input value={form.volumeRange} onChange={set('volumeRange')} placeholder="e.g. 1K – 10K" /></label>
        <label className="field ad-field"><span className="ad-label">Keyword difficulty</span><input inputMode="decimal" value={form.difficulty} onChange={set('difficulty')} placeholder="0–100, optional" /></label>
        <label className="field ad-field"><span className="ad-label">CPC</span><input inputMode="decimal" value={form.cpc} onChange={set('cpc')} placeholder="Optional" /></label>
        <label className="field ad-field"><span className="ad-label">Competition</span>
          <select value={form.competition} onChange={set('competition')}><option value="">—</option>{COMPETITION.map((c) => <option key={c} value={c}>{cap(c)}</option>)}</select></label>
        <label className="field ad-field"><span className="ad-label">Source</span>
          <select value={form.source} onChange={set('source')}>{Object.entries(SOURCES).map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></label>
        <label className="field ad-field"><span className="ad-label">Status</span>
          <select value={form.status} onChange={set('status')}>{Object.entries(STATUSES).map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></label>
        <label className="field ad-field"><span className="ad-label">Topic cluster</span>
          <select value={form.cluster} onChange={set('cluster')}><option value="">None</option>{clusters.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
        <label className="field ad-field ad-kw-wide"><span className="ad-label">Notes</span><textarea rows={2} value={form.notes} onChange={set('notes')} placeholder="Why this keyword, who it is for" /></label>
      </div>
      <p className="ad-hint">Metrics are optional — leave them empty when the research tool did not give one.</p>
      <div className="ad-dialog-actions">
        <button type="button" className="ad-btn" onClick={onCancel} disabled={busy}>Cancel</button>
        <button type="submit" className="btn btn-dark" disabled={busy}>{busy ? 'Saving…' : isNew ? 'Add keyword' : 'Save changes'}</button>
      </div>
    </form>
  );
}

function Confirm({ title, confirm, danger, busy, onCancel, onConfirm, children }: {
  title: string; confirm: string; danger?: boolean; busy: boolean; onCancel: () => void; onConfirm: () => void; children: React.ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  return (
    <dialog ref={(d) => { ref.current = d; if (d && !d.open) d.showModal(); }} className="ad-dialog" onCancel={(e) => { e.preventDefault(); if (!busy) onCancel(); }} aria-label={title}>
      <div className="ad-dialog-body">
        <h2>{title}</h2>
        {children}
        <div className="ad-dialog-actions">
          <button type="button" className="ad-btn" onClick={onCancel} disabled={busy} autoFocus>Cancel</button>
          <button type="button" className={danger ? 'ad-btn ad-btn--danger' : 'btn btn-dark'} onClick={onConfirm} disabled={busy}>{busy ? 'Working…' : confirm}</button>
        </div>
      </div>
    </dialog>
  );
}

/** Choose a page or article and a role; warns about cannibalisation before saving it. */
function AssignDialog({ keyword, targets, used, onClose }: {
  keyword: Keyword; targets: Target[]; used: { t: Target; role: Role }[]; onClose: (changed: boolean) => void;
}) {
  const project = useProject();
  const [target, setTarget] = useState('');
  const [role, setRole] = useState<Role>(keyword.type);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<SeoResult | null>(null);
  const [changed, setChanged] = useState(false);
  const t = targets.find((x) => `${x.kind}:${x.id}` === target);
  const otherPrimary = targets.filter((x) => x !== t && x.primaryKeyword && normalizeKeyword(x.primaryKeyword) === normalizeKeyword(keyword.keyword));

  const go = async (r: Role | null, dest: Target, confirmed = false) => {
    setBusy(true);
    setResult(null);
    try {
      const res = await assignKeyword(project.id, keyword.keyword, { kind: dest.kind, id: dest.id }, r, dest.version, confirmed);
      setResult(res);
      if (res.ok) setChanged(true);
    } catch (e) {
      setResult({ ok: false, message: `Could not reach the server: ${(e as Error).message}` });
    } finally {
      setBusy(false);
    }
  };

  return (
    <dialog ref={(d) => { if (d && !d.open) d.showModal(); }} className="ad-dialog ad-dialog--wide" onCancel={(e) => { e.preventDefault(); if (!busy) onClose(changed); }} aria-label="Assign keyword">
      <div className="ad-dialog-body">
        <h2>Assign keyword</h2>
        <p className="ad-dialog-subject">{keyword.keyword}{keyword.location && ` · ${keyword.location}`}</p>
        {used.length > 0 && (
          <div className="ad-assign-current">
            <span className="ad-label">Currently used by</span>
            <ul>
              {used.map((u) => (
                <li key={`${u.t.kind}:${u.t.id}:${u.role}`}>
                  {u.t.name} <span className="ad-hint">({u.role})</span>{' '}
                  <button type="button" className="ad-mini" disabled={busy || changed} onClick={() => go(null, u.t)}>Remove</button>
                </li>
              ))}
            </ul>
          </div>
        )}
        <label className="field ad-field"><span className="ad-label">Page or article</span>
          <select value={target} onChange={(e) => { setTarget(e.target.value); setResult(null); }} disabled={busy || changed}>
            <option value="">Choose…</option>
            <optgroup label="Pages">{targets.filter((x) => x.kind === 'page').map((x) => <option key={x.id} value={`page:${x.id}`}>{x.name} ({x.path})</option>)}</optgroup>
            <optgroup label="Articles">{targets.filter((x) => x.kind === 'article').map((x) => <option key={x.id} value={`article:${x.id}`}>{x.name} · {x.status}</option>)}</optgroup>
          </select>
        </label>
        <fieldset className="ad-radios" disabled={busy || changed}>
          <legend className="ad-label">Role on that page</legend>
          {(['primary', 'secondary', 'related'] as Role[]).map((r) => (
            <label key={r}><input type="radio" name="role" checked={role === r} onChange={() => setRole(r)} /> {cap(r)}</label>
          ))}
        </fieldset>
        {t && role === 'primary' && t.primaryKeyword && normalizeKeyword(t.primaryKeyword) !== normalizeKeyword(keyword.keyword) && (
          <p className="ad-dialog-warn">Replaces its current primary keyword, “{t.primaryKeyword}”.</p>
        )}
        {t && role === 'primary' && otherPrimary.length > 0 && (
          <p className="ad-dialog-warn">This keyword is already being targeted by another page: {otherPrimary.map((o) => o.name).join(', ')}.</p>
        )}
        {result && <p className={result.ok ? 'ad-dialog-ok' : result.needsConfirm ? 'ad-dialog-warn' : 'ad-dialog-error'} role="status">{result.message}</p>}
        <div className="ad-dialog-actions">
          <button type="button" className="ad-btn" onClick={() => onClose(changed)} disabled={busy}>{changed ? 'Close' : 'Cancel'}</button>
          {!changed && (result && !result.ok && result.needsConfirm && t ? (
            <button type="button" className="btn btn-dark" onClick={() => go(role, t, true)} disabled={busy}>Assign anyway</button>
          ) : (
            <button type="button" className="btn btn-dark" onClick={() => t && go(role, t)} disabled={busy || !t}>{busy ? 'Saving…' : 'Assign'}</button>
          ))}
        </div>
      </div>
    </dialog>
  );
}
