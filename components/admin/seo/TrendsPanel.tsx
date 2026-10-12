'use client';

import { useProject } from '@/components/admin/ProjectScope';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { saveTrendsResults } from '@/lib/cms/research-actions';
import type { SeoResult } from '@/lib/cms/seo-actions';
import { decodeExport } from '@/lib/seo/csv';
import { KEYWORD_TYPES } from '@/lib/seo/keywords';
import {
  GEO, TRENDS_MAX_TERMS, TRENDS_PLACES, TRENDS_RANGES, parseInterestOverTime, parseRelatedQueries, summarize, trendsExploreUrl, trendsTermProblems,
  type InterestOverTime, type RelatedQueries, type TrendsRange,
} from '@/lib/seo/trends';
import { Status } from './KeywordManager';
import type { SaveTarget } from './ResearchProviders';
import TrendsChart from './TrendsChart';

const split = (s: string) => s.split(/[\n,]/).map((x) => x.trim()).filter(Boolean);
const readFile = async (f: File) => (f.size > 2_000_000 ? null : decodeExport(new Uint8Array(await f.arrayBuffer())));

/**
 * Google Trends, the free way: the official report link, then the report's
 * own CSV downloads read here. No request is made to Google from the CMS.
 */
export default function TrendsPanel({ defaultGeo, target }: { defaultGeo: string; target: SaveTarget }) {
  const project = useProject();
  const router = useRouter();
  const [terms, setTerms] = useState('');
  const [geo, setGeo] = useState(defaultGeo);
  const [range, setRange] = useState<TrendsRange>('today 12-m');
  const [series, setSeries] = useState<InterestOverTime | null>(null);
  const [related, setRelated] = useState<RelatedQueries | null>(null);
  const [error, setError] = useState('');
  const [pick, setPick] = useState<string[]>([]);
  const [opts, setOpts] = useState({ type: 'secondary', cluster: '' });
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<SeoResult | null>(null);

  const list = split(terms);
  const problems = list.length ? trendsTermProblems(list) : [];
  const geoOk = GEO.test(geo);
  const url = list.length && !problems.length && geoOk ? trendsExploreUrl(list, geo, range) : null;

  const loadSeries = async (f?: File) => {
    setError(''); setResult(null);
    if (!f) return;
    const text = await readFile(f);
    const r = text === null ? { error: 'That file is larger than 2 MB.' } : parseInterestOverTime(text);
    if ('error' in r) { setError(r.error); setSeries(null); return; }
    setSeries(r);
    setPick((p) => [...new Set([...p, ...r.series.map((s) => `term:${s.term}`)])]);
  };
  const loadRelated = async (f?: File) => {
    setError(''); setResult(null);
    if (!f) return;
    const text = await readFile(f);
    const r = text === null ? { error: 'That file is larger than 2 MB.' } : parseRelatedQueries(text);
    if ('error' in r) { setError(r.error); setRelated(null); return; }
    setRelated(r);
  };

  const toggle = (k: string) => setPick((p) => (p.includes(k) ? p.filter((x) => x !== k) : [...p, k]));

  const save = async () => {
    setBusy(true); setResult(null);
    try {
      const chosenTerms = (series?.series ?? []).filter((s) => pick.includes(`term:${s.term}`))
        .map((s) => ({ keyword: s.term, ...summarize(s.values) }));
      const chosenRelated = [
        ...(related?.top ?? []).filter((q) => pick.includes(`top:${q.query}`)).map((q) => ({ keyword: q.query, note: `top related query, ${q.value}/100` })),
        ...(related?.rising ?? []).filter((q) => pick.includes(`rising:${q.query}`)).map((q) => ({ keyword: q.query, note: `rising query, ${q.value}` })),
      ];
      const r = await saveTrendsResults(project.id, chosenTerms, { geo, range, comparedWith: series?.series.map((s) => s.term) ?? [] }, chosenRelated, { type: opts.type, cluster: opts.cluster || undefined });
      setResult(r);
      if (r.ok) { setPick([]); router.refresh(); }
    } catch (e) {
      setResult({ ok: false, message: `Could not reach the server: ${(e as Error).message}` });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="ad-provider-panel" data-panel="google-trends">
      <section className="ad-panel">
        <h2>1 · Open the Google Trends report</h2>
        <div className="ad-kw-grid">
          <label className="field ad-field ad-kw-wide"><span className="ad-label">Keywords to compare (up to {TRENDS_MAX_TERMS}, one per line or comma-separated)</span>
            <textarea rows={2} value={terms} onChange={(e) => setTerms(e.target.value)} placeholder={'website development company\nweb design company'} /></label>
          <label className="field ad-field"><span className="ad-label">Country or region</span>
            <select value={TRENDS_PLACES.some(([c]) => c === geo) ? geo : '__custom'} onChange={(e) => setGeo(e.target.value === '__custom' ? '' : e.target.value)}>
              {TRENDS_PLACES.map(([c, n]) => <option key={c || 'ww'} value={c}>{n}</option>)}
              <option value="__custom">Other code…</option>
            </select></label>
          <label className="field ad-field"><span className="ad-label">Code</span>
            <input value={geo} onChange={(e) => setGeo(e.target.value.toUpperCase())} placeholder="Worldwide" aria-invalid={!geoOk} /></label>
          <label className="field ad-field"><span className="ad-label">Time range</span>
            <select value={range} onChange={(e) => setRange(e.target.value as TrendsRange)}>
              {Object.entries(TRENDS_RANGES).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select></label>
        </div>
        {problems.length > 0 && <p className="ad-note ad-note--error">{problems.join(' ')}</p>}
        {!geoOk && <p className="ad-note ad-note--error">Use a code like IN, US or US-NY, or leave it empty for worldwide.</p>}
        <p>
          {url ? <a className="btn btn-dark" href={url} target="_blank" rel="noopener noreferrer" data-testid="trends-link">Open in Google Trends ↗</a>
            : <span className="ad-hint">Enter keywords to get the report link.</span>}
        </p>
        <p className="ad-hint">
          Google Trends shows <b>relative interest</b> on a 0–100 scale, not search volume. Google&rsquo;s Trends API is an invitation-only alpha,
          so the CMS does not fetch Trends data itself; it reads the files you download from the report instead.
        </p>
      </section>

      <section className="ad-panel">
        <h2>2 · Load the report&rsquo;s CSV downloads</h2>
        <p className="ad-hint">In the report, use the download button (↓) on <b>Interest over time</b> and, if you like, on <b>Related queries</b>.</p>
        <div className="ad-kw-grid">
          <label className="field ad-field"><span className="ad-label">Interest over time (multiTimeline.csv)</span>
            <input type="file" accept=".csv,text/csv" onChange={(e) => loadSeries(e.target.files?.[0])} data-testid="trends-series" /></label>
          <label className="field ad-field"><span className="ad-label">Related queries (relatedQueries.csv)</span>
            <input type="file" accept=".csv,text/csv" onChange={(e) => loadRelated(e.target.files?.[0])} data-testid="trends-related" /></label>
        </div>
        {error && <p className="ad-note ad-note--error" role="alert">{error}</p>}
        {series && <TrendsChart data={series} />}
        {series && (
          <table className="ad-table ad-research-table">
            <thead><tr><th scope="col">Save</th><th scope="col">Term</th><th scope="col">Average interest</th><th scope="col">Peak</th><th scope="col">Latest</th></tr></thead>
            <tbody>
              {series.series.map((s) => {
                const m = summarize(s.values);
                return (
                  <tr key={s.term} data-term={s.term}>
                    <td><input type="checkbox" aria-label={`Save ${s.term}`} checked={pick.includes(`term:${s.term}`)} onChange={() => toggle(`term:${s.term}`)} /></td>
                    <td>{s.term}</td><td>{m.average}/100</td><td>{m.peak}</td><td>{m.latest}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
        {related && (
          <div className="ad-related">
            {(['top', 'rising'] as const).map((sec) => (
              <div key={sec}>
                <p className="ad-label">{sec === 'top' ? 'Top related queries (0–100)' : 'Rising queries'}</p>
                {related[sec].length === 0 ? <p className="ad-hint">None in this export.</p> : (
                  <ul className="ad-opp-list">
                    {related[sec].map((q) => (
                      <li key={q.query}>
                        <label className="ad-inline-check">
                          <input type="checkbox" checked={pick.includes(`${sec}:${q.query}`)} onChange={() => toggle(`${sec}:${q.query}`)} />
                          {q.query} <span className="ad-hint">{sec === 'top' ? `${q.value}/100` : q.value}</span>
                        </label>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {(series || related) && (
        <section className="ad-panel">
          <h2>3 · Save to the keyword library</h2>
          <div className="ad-kw-grid">
            <label className="field ad-field"><span className="ad-label">New keywords as</span>
              <select value={opts.type} onChange={(e) => setOpts({ ...opts, type: e.target.value })}>{KEYWORD_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}</select></label>
            <label className="field ad-field"><span className="ad-label">Topic cluster</span>
              <select value={opts.cluster} onChange={(e) => setOpts({ ...opts, cluster: e.target.value })}><option value="">None</option>{target.clusters.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
          </div>
          <p className="ad-hint">Existing keywords keep their cluster, type and assignments; the Trends scores are added alongside, labelled as relative interest for this place and range.</p>
          {result && <Status result={result} />}
          <button type="button" className="btn btn-dark" disabled={busy || !pick.length || !target.canSave || !geoOk} onClick={save}>
            {busy ? 'Saving…' : `Save ${pick.length} to the library`} <span className="dot">→</span>
          </button>
        </section>
      )}
    </div>
  );
}
