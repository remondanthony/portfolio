'use client';

import { useProject } from '@/components/admin/ProjectScope';
import { useState } from 'react';
import { confirmImport, previewImport, type ImportRowResult, type SeoResult } from '@/lib/cms/seo-actions';
import { decodeExport, MAX_IMPORT_ROWS, parseKeywordExport, type ParsedExport } from '@/lib/seo/csv';
import { KEYWORD_TYPES, SOURCES, STATUSES } from '@/lib/seo/keywords';
import { Status } from './KeywordManager';

const MAX_FILE_BYTES = 5 * 1024 * 1024;
const label: Record<ImportRowResult['status'], string> = {
  new: 'New', existing: 'Already in library', 'duplicate-in-file': 'Duplicate in file', invalid: 'Invalid',
};

/**
 * Upload → parse in the browser → server preview → confirm.
 *
 * The file never leaves the browser as a file: only the parsed rows are sent,
 * first to classify them and then, on confirmation, to import them. The
 * server classifies them again on import, so the preview cannot be bypassed.
 */
export default function CsvImport({ clusters }: { clusters: { id: string; name: string }[] }) {
  const project = useProject();
  const [parsed, setParsed] = useState<(ParsedExport & { fileName: string }) | null>(null);
  const [defaults, setDefaults] = useState({ source: 'google-keyword-planner', type: 'secondary', status: 'idea', country: '', location: '', cluster: '' });
  const [preview, setPreview] = useState<ImportRowResult[] | null>(null);
  const [update, setUpdate] = useState<number[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<SeoResult | null>(null);

  const pick = async (file?: File) => {
    setParsed(null); setPreview(null); setResult(null); setError(''); setUpdate([]);
    if (!file) return;
    if (file.size > MAX_FILE_BYTES) { setError('That file is larger than 5 MB.'); return; }
    const text = decodeExport(new Uint8Array(await file.arrayBuffer()));
    const p = parseKeywordExport(text);
    if (p.error) { setError(p.error); return; }
    if (!p.rows.length) { setError('The file has a header row but no keywords under it.'); return; }
    setParsed({ ...p, fileName: file.name });
  };

  const runPreview = async () => {
    if (!parsed) return;
    setBusy(true); setError(''); setResult(null);
    try {
      const r = await previewImport(project.id, parsed.rows, defaults);
      if (!r.ok) setError(r.message); else { setPreview(r.rows); setUpdate([]); }
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
      const r = await confirmImport(project.id, parsed.rows, defaults, update);
      setResult(r);
      if (r.ok) { setPreview(null); setParsed(null); }
    } catch (e) {
      setResult({ ok: false, message: `Could not reach the server: ${(e as Error).message}` });
    } finally {
      setBusy(false);
    }
  };

  const count = (s: ImportRowResult['status']) => preview?.filter((r) => r.status === s).length ?? 0;
  const setD = (k: keyof typeof defaults) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => { setDefaults({ ...defaults, [k]: e.target.value }); setPreview(null); };

  return (
    <div className="ad-seo">
      {result && <Status result={result} />}
      <section className="ad-panel">
        <h2>1 · Choose a file</h2>
        <label className="field ad-field">
          <span className="ad-label">CSV or TSV export</span>
          <input type="file" accept=".csv,.tsv,.txt,text/csv,text/tab-separated-values" onChange={(e) => pick(e.target.files?.[0])} disabled={busy} data-testid="csv-file" />
        </label>
        <p className="ad-hint">
          Google Keyword Planner&rsquo;s &ldquo;Download keyword ideas&rdquo; (CSV) works as it is. Other files need a <b>Keyword</b> column; these are
          also read when present: Search Volume (or Avg. monthly searches), Competition, CPC, Keyword Difficulty, Search Intent, Location, Country, Source, Notes.
          Up to {MAX_IMPORT_ROWS} rows.
        </p>
        {error && <p className="ad-note ad-note--error" role="alert">{error}</p>}
        {parsed && (
          <p className="ad-note">
            <b>{parsed.fileName}</b>: {parsed.rows.length} row{parsed.rows.length === 1 ? '' : 's'}
            {parsed.truncated && ` (only the first ${MAX_IMPORT_ROWS} are used)`}. Columns read: {parsed.columns.map((c) => c.name).join(', ')}.
            {parsed.ignored.length > 0 && <> Ignored: {parsed.ignored.join(', ')}.</>}
          </p>
        )}
      </section>

      {parsed && (
        <section className="ad-panel">
          <h2>2 · Defaults for rows that don&rsquo;t say</h2>
          <div className="ad-kw-grid">
            <label className="field ad-field"><span className="ad-label">Source</span>
              <select value={defaults.source} onChange={setD('source')}>{Object.entries(SOURCES).map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></label>
            <label className="field ad-field"><span className="ad-label">Keyword type</span>
              <select value={defaults.type} onChange={setD('type')}>{KEYWORD_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}</select></label>
            <label className="field ad-field"><span className="ad-label">Status</span>
              <select value={defaults.status} onChange={setD('status')}>{Object.entries(STATUSES).map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></label>
            <label className="field ad-field"><span className="ad-label">Target country</span><input value={defaults.country} onChange={setD('country')} placeholder="Optional" /></label>
            <label className="field ad-field"><span className="ad-label">Target location</span><input value={defaults.location} onChange={setD('location')} placeholder="e.g. New York, USA" /></label>
            <label className="field ad-field"><span className="ad-label">Topic cluster</span>
              <select value={defaults.cluster} onChange={setD('cluster')}><option value="">None</option>{clusters.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
          </div>
          <button type="button" className="btn btn-dark" onClick={runPreview} disabled={busy}>{busy && !preview ? 'Checking…' : 'Preview import'} <span className="dot">→</span></button>
        </section>
      )}

      {preview && (
        <section className="ad-panel" data-testid="import-preview">
          <h2>3 · Review and confirm</h2>
          <p className="ad-import-summary">
            <span className="ad-use ad-use--ok">{count('new')} new</span>{' '}
            <span className="ad-use">{count('existing')} already in library</span>{' '}
            <span className="ad-use ad-use--warn">{count('duplicate-in-file')} duplicates in file</span>{' '}
            <span className="ad-use ad-use--warn">{count('invalid')} invalid</span>
          </p>
          <p className="ad-hint">Invalid and duplicate rows are skipped. Keywords already in the library are left as they are unless you tick “Update” — then only the fields this file provides change.</p>
          <div className="ad-table-wrap">
            <table className="ad-table ad-import-table">
              <thead><tr><th scope="col">Line</th><th scope="col">Keyword</th><th scope="col">Result</th><th scope="col">Details</th></tr></thead>
              <tbody>
                {preview.map((r) => (
                  <tr key={r.line} data-status={r.status}>
                    <td data-label="Line">{r.line}</td>
                    <td data-label="Keyword">{r.keyword || <span className="ad-hint">(empty)</span>}</td>
                    <td data-label="Result"><span className={`ad-use ${r.status === 'new' ? 'ad-use--ok' : r.status === 'existing' ? '' : 'ad-use--warn'}`}>{label[r.status]}</span></td>
                    <td data-label="Details">
                      {r.problems?.join('; ')}
                      {r.status === 'existing' && (r.changes?.length ? (
                        <label className="ad-inline-check">
                          <input type="checkbox" checked={update.includes(r.line)} onChange={(e) => setUpdate((u) => (e.target.checked ? [...u, r.line] : u.filter((x) => x !== r.line)))} />
                          Update {r.changes.join(', ')}
                        </label>
                      ) : <span className="ad-hint">Nothing new in this row</span>)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="ad-dialog-actions">
            <button type="button" className="ad-btn" onClick={() => setPreview(null)} disabled={busy}>Back</button>
            <button type="button" className="btn btn-dark" onClick={runImport} disabled={busy || (count('new') === 0 && update.length === 0)}>
              {busy ? 'Importing…' : `Import ${count('new')} new${update.length ? ` and update ${update.length}` : ''}`} <span className="dot">→</span>
            </button>
          </div>
        </section>
      )}
    </div>
  );
}
