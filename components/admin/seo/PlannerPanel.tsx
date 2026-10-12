'use client';

import { useProject } from '@/components/admin/ProjectScope';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { confirmPlannerImport, previewPlannerImport, type PlannerPreviewRow, type SeoResult } from '@/lib/cms/seo-actions';
import { decodeExport, looksMisencoded, MAX_IMPORT_ROWS, parseKeywordExport, type ParsedExport } from '@/lib/seo/csv';
import { KEYWORD_TYPES } from '@/lib/seo/keywords';
import { EXAMPLE_CSV, PLANNER_COLUMNS, PLANNER_LOCATIONS, formatPercent } from '@/lib/seo/planner';
import { Status } from './KeywordManager';
import type { SaveTarget } from './ResearchProviders';

const MAX_FILE_BYTES = 5 * 1024 * 1024;
const NA = <span className="ad-na">—</span>;
const STATUS: Record<PlannerPreviewRow['status'], string> = { new: 'New', existing: 'Already in library', 'duplicate-in-file': 'Duplicate in file', invalid: 'Invalid' };

/**
 * Google Keyword Planner → keyword library, through an export file. Nothing
 * connects to Google Ads: the CSV is parsed here, classified by the server,
 * previewed, and imported in one commit when confirmed.
 */
export default function PlannerPanel({ target }: { target: SaveTarget }) {
  const project = useProject();
  const router = useRouter();
  const [parsed, setParsed] = useState<(ParsedExport & { fileName: string }) | null>(null);
  const [error, setError] = useState('');
  const [drag, setDrag] = useState(false);
  const [opts, setOpts] = useState({ location: '', type: 'secondary', cluster: '', duplicates: 'skip' as 'skip' | 'update' });
  const [preview, setPreview] = useState<PlannerPreviewRow[] | null>(null);
  const [selected, setSelected] = useState<number[]>([]);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<SeoResult | null>(null);

  const pick = async (file?: File) => {
    setParsed(null); setPreview(null); setResult(null); setError('');
    if (!file) return;
    if (file.size > MAX_FILE_BYTES) { setError('That file is larger than 5 MB. Export fewer keyword ideas, or split the file.'); return; }
    const text = decodeExport(new Uint8Array(await file.arrayBuffer()));
    if (looksMisencoded(text)) { setError('The file could not be read as text. Keyword Planner exports are UTF-16 or UTF-8 — download it again as CSV.'); return; }
    const p = parseKeywordExport(text, PLANNER_COLUMNS);
    if (p.error) { setError(`${p.error} Is this a Keyword Planner "keyword ideas" export?`); return; }
    if (!p.rows.length) { setError('The file has a header row but no keywords under it.'); return; }
    setParsed({ ...p, fileName: file.name });
  };

  const runPreview = async () => {
    if (!parsed) return;
    setBusy(true); setError(''); setResult(null);
    try {
      const r = await previewPlannerImport(project.id, parsed.rows, { location: opts.location });
      if (!r.ok) { setError(r.message); return; }
      setPreview(r.rows);
      setSelected(r.rows.filter((x) => x.status === 'new' || (x.status === 'existing' && opts.duplicates === 'update')).map((x) => x.line));
    } catch (e) {
      setError(`Could not reach the server: ${(e as Error).message}`);
    } finally {
      setBusy(false);
    }
  };

  const runImport = async () => {
    if (!parsed) return;
    setBusy(true); setResult(null);
    try {
      const r = await confirmPlannerImport(project.id, parsed.rows, { ...opts, cluster: opts.cluster || undefined }, selected);
      setResult(r);
      if (r.ok) { setPreview(null); setParsed(null); router.refresh(); }
    } catch (e) {
      setResult({ ok: false, message: `Could not reach the server: ${(e as Error).message}` });
    } finally {
      setBusy(false);
    }
  };

  const downloadExample = () => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([EXAMPLE_CSV], { type: 'text/csv;charset=utf-8' }));
    a.download = 'keyword-planner-EXAMPLE-fictional-data.csv';
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  };

  const count = (s: PlannerPreviewRow['status']) => preview?.filter((r) => r.status === s).length ?? 0;
  const setDup = (d: 'skip' | 'update') => {
    setOpts({ ...opts, duplicates: d });
    if (preview) setSelected((sel) => {
      const existing = preview.filter((r) => r.status === 'existing').map((r) => r.line);
      return d === 'update' ? [...new Set([...sel, ...existing])] : sel.filter((l) => !existing.includes(l));
    });
  };
  const chosenNew = preview?.filter((r) => r.status === 'new' && selected.includes(r.line)).length ?? 0;
  const chosenUpdate = opts.duplicates === 'update' ? preview?.filter((r) => r.status === 'existing' && selected.includes(r.line)).length ?? 0 : 0;

  return (
    <div className="ad-provider-panel" data-panel="keyword-planner">
      <section className="ad-panel">
        <h2>Google Keyword Planner</h2>
        <p>Import keyword ideas exported from Google Keyword Planner. Nothing here connects to your Google Ads account.</p>
        <ol className="ad-steps">
          <li>Open <a href="https://ads.google.com/aw/keywordplanner/home" target="_blank" rel="noopener noreferrer">Google Keyword Planner ↗</a> (in Google Ads: <b>Tools → Planning → Keyword Planner</b>).</li>
          <li>Choose <b>Discover new keywords</b> or <b>Get search volume and forecasts</b>, set the location and language, and run it.</li>
          <li>Use the download button (↓) → <b>Download keyword ideas</b> → <b>CSV</b>.</li>
          <li>Upload that file below, check the preview, and import.</li>
        </ol>
        <p><button type="button" className="ad-btn" onClick={downloadExample} data-testid="planner-example">Download an example CSV (fictional data)</button></p>
      </section>

      <section className="ad-panel">
        <h2>1 · Choose the export</h2>
        <label
          className={`ad-drop ${drag ? 'is-over' : ''}`}
          onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
          onDragLeave={() => setDrag(false)}
          onDrop={(e) => { e.preventDefault(); setDrag(false); pick(e.dataTransfer.files?.[0]); }}
        >
          <span>Drop the Keyword Planner CSV here, or choose a file</span>
          <input type="file" accept=".csv,.tsv,.txt,text/csv,text/tab-separated-values" onChange={(e) => pick(e.target.files?.[0])} disabled={busy} data-testid="planner-file" />
        </label>
        <p className="ad-hint">Up to {MAX_IMPORT_ROWS} keywords and 5 MB. Columns are matched by name, so small differences in Google&rsquo;s export are fine; columns the CMS does not use are ignored.</p>
        {error && <p className="ad-note ad-note--error" role="alert">{error}</p>}
        {parsed && (
          <p className="ad-note" data-testid="planner-parsed">
            <b>{parsed.fileName}</b>: {parsed.rows.length} row{parsed.rows.length === 1 ? '' : 's'}{parsed.truncated && ` (only the first ${MAX_IMPORT_ROWS} are used)`}.
            {' '}Columns read: {parsed.columns.map((c) => c.name).join(', ')}.
            {parsed.ignored.length > 0 && <> Ignored: {parsed.ignored.join(', ')}.</>}
          </p>
        )}
      </section>

      {parsed && (
        <section className="ad-panel">
          <h2>2 · Options</h2>
          <div className="ad-kw-grid">
            <label className="field ad-field"><span className="ad-label">Target location</span>
              <input list="planner-locations" value={opts.location} onChange={(e) => { setOpts({ ...opts, location: e.target.value }); setPreview(null); }} placeholder="As set in Keyword Planner — leave empty if unknown" />
              <datalist id="planner-locations">{PLANNER_LOCATIONS.map((l) => <option key={l} value={l} />)}</datalist></label>
            <label className="field ad-field"><span className="ad-label">New keywords as</span>
              <select value={opts.type} onChange={(e) => setOpts({ ...opts, type: e.target.value })}>{KEYWORD_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}</select></label>
            <label className="field ad-field"><span className="ad-label">Topic cluster for new keywords</span>
              <select value={opts.cluster} onChange={(e) => setOpts({ ...opts, cluster: e.target.value })}><option value="">None</option>{target.clusters.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
          </div>
          <fieldset className="ad-radios">
            <legend className="ad-label">Keywords already in the library</legend>
            <label><input type="radio" name="dup" checked={opts.duplicates === 'skip'} onChange={() => setDup('skip')} /> Skip them</label>
            <label><input type="radio" name="dup" checked={opts.duplicates === 'update'} onChange={() => setDup('update')} /> Update their Keyword Planner metrics (cluster, intent, notes, pages and Google Trends data are kept)</label>
          </fieldset>
          <p className="ad-hint">The location is not in Keyword Planner&rsquo;s export; it is only recorded if you enter it here. A keyword researched for a different location is imported as a separate keyword.</p>
          <button type="button" className="btn btn-dark" onClick={runPreview} disabled={busy} data-testid="planner-preview-btn">{busy && !preview ? 'Checking…' : 'Preview import'} <span className="dot">→</span></button>
        </section>
      )}

      {preview && (
        <section className="ad-panel" data-testid="planner-preview">
          <h2>3 · Import preview</h2>
          <dl className="ad-import-counts">
            <div><dt>Total rows</dt><dd>{preview.length}</dd></div>
            <div><dt>Valid</dt><dd>{preview.length - count('invalid')}</dd></div>
            <div><dt>Invalid</dt><dd>{count('invalid')}</dd></div>
            <div><dt>Duplicate in file</dt><dd>{count('duplicate-in-file')}</dd></div>
            <div><dt>New keywords</dt><dd>{count('new')}</dd></div>
            <div><dt>Already in library</dt><dd>{count('existing')}</dd></div>
          </dl>
          <div className="ad-table-wrap">
            <table className="ad-table ad-research-table">
              <thead>
                <tr>
                  <th scope="col">Import</th><th scope="col">Keyword</th><th scope="col">Avg. monthly searches</th><th scope="col">Keyword Planner competition</th>
                  <th scope="col">3-month change</th><th scope="col">YoY change</th><th scope="col">Top-of-page bid</th><th scope="col">Status</th>
                </tr>
              </thead>
              <tbody>
                {preview.map((r) => {
                  const d = r.data;
                  const can = r.status === 'new' || (r.status === 'existing' && opts.duplicates === 'update');
                  return (
                    <tr key={r.line} data-status={r.status} data-keyword={r.keyword}>
                      <td><input type="checkbox" aria-label={`Import ${r.keyword || `line ${r.line}`}`} disabled={!can} checked={can && selected.includes(r.line)}
                        onChange={() => setSelected((s) => (s.includes(r.line) ? s.filter((x) => x !== r.line) : [...s, r.line]))} /></td>
                      <td>{r.keyword || <span className="ad-hint">(empty)</span>}<span className="ad-hint ad-block">line {r.line}</span></td>
                      <td>{d.volume !== undefined ? d.volume.toLocaleString('en') : d.volumeRange ?? NA}</td>
                      <td>{d.competition ? `${d.competition.charAt(0).toUpperCase()}${d.competition.slice(1)}` : NA}{d.competitionIndex !== undefined && <span className="ad-hint"> · index {d.competitionIndex}</span>}</td>
                      <td>{formatPercent(d.threeMonthChange) ?? NA}</td>
                      <td>{formatPercent(d.yoyChange) ?? NA}</td>
                      <td>{d.bidLow !== undefined || d.bidHigh !== undefined ? `${d.bidLow ?? '—'} – ${d.bidHigh ?? '—'}${d.currency ? ` ${d.currency}` : ''}` : NA}</td>
                      <td>
                        <span className={`ad-use ${r.status === 'new' ? 'ad-use--ok' : r.status === 'existing' ? '' : 'ad-use--warn'}`}>{STATUS[r.status]}</span>
                        {r.problems.length > 0 && <span className="ad-hint ad-block">{r.problems.join('; ')}</span>}
                        {r.existing && <span className="ad-hint ad-block">Matches “{r.existing.keyword}”{r.existing.location ? ` (${r.existing.location})` : ''}{r.changes?.length ? ` · would update: ${r.changes.join(', ')}` : ' · no new metrics'}</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {result && <Status result={result} />}
          <div className="ad-dialog-actions">
            <button type="button" className="ad-btn" onClick={() => setPreview(null)} disabled={busy}>Back</button>
            <button type="button" className="btn btn-dark" onClick={runImport} disabled={busy || !target.canSave || chosenNew + chosenUpdate === 0} data-testid="planner-import-btn">
              {busy ? 'Importing…' : `Import ${chosenNew} new${chosenUpdate ? `, update ${chosenUpdate}` : ''}`} <span className="dot">→</span>
            </button>
          </div>
          <p className="ad-hint">One commit to the keyword library. Competition here is Google Ads competition from Keyword Planner — not an SEO difficulty score.</p>
        </section>
      )}
      {!preview && result && <Status result={result} />}
    </div>
  );
}
