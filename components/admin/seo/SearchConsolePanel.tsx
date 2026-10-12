'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { useProject } from '@/components/admin/ProjectScope';
import {
  addSearchConsoleQueries, connectSearchConsole, disconnectSearchConsole, searchConsoleProperties, selectSearchConsoleProperty, syncSearchConsole,
  type PropertyChoice,
} from '@/lib/cms/search-console-actions';
import type { ConnectionSummary } from '@/lib/cms/search-console-data';
import type { SeoResult } from '@/lib/cms/seo-write';
import {
  DATA_DELAY_DAYS, describePosition, MULTI_PAGE_NOTE, PRESETS, type Change, type KeyRow, type Metrics, type QueryRow, type Report, type ReportQueryPages,
} from '@/lib/seo/search-console';
import { Status } from './KeywordManager';

const n = (v: number) => Math.round(v).toLocaleString('en');
const ctr = (v: number) => `${(v * 100).toFixed(1)}%`;
const pos = (v: number) => (v > 0 ? v.toFixed(1) : '—');
const when = (iso?: string) => (iso ? new Date(iso).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' }) : '—');
const day = (iso: string) => new Date(`${iso}T00:00:00Z`).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
const signed = (v: number, digits = 0) => `${v > 0 ? '+' : v < 0 ? '−' : ''}${Math.abs(v).toLocaleString('en', { maximumFractionDigits: digits, minimumFractionDigits: digits })}`;

/**
 * Google Search Console for the page's project (Vioniche). Tokens never
 * reach this component — only the connection's public details and the
 * report the server built.
 */
export default function SearchConsolePanel({ projectName, website, configProblem, connection: initial, initialReport, justConnected }: {
  projectName: string; website: string; configProblem?: string; connection: ConnectionSummary; initialReport: Report | null; justConnected: boolean;
}) {
  const project = useProject();
  const [conn, setConn] = useState(initial);
  const [properties, setProperties] = useState<PropertyChoice[] | null>(null);
  const [choice, setChoice] = useState(initial.property ?? '');
  const [report, setReport] = useState<Report | null>(initialReport);
  const [preset, setPreset] = useState<keyof typeof PRESETS | 'custom'>('28d');
  const [range, setRange] = useState({ start: '', end: '' });
  const [busy, setBusy] = useState('');
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const act = async <T,>(label: string, fn: () => Promise<T>, done: (r: T) => void) => {
    setBusy(label); setMsg(null);
    try { done(await fn()); } catch { setMsg({ ok: false, text: 'Search Console is temporarily unavailable. Sign in again if this keeps happening, then retry.' }); }
    finally { setBusy(''); }
  };
  const failed = (r: { message: string; reconnect?: boolean }) => {
    setMsg({ ok: false, text: r.message });
    setConn((c) => ({ ...c, lastError: { at: new Date().toISOString(), message: r.message } }));
  };

  const connect = () => act('connect', () => connectSearchConsole(project.id), (r) => (r.ok ? window.location.assign(r.url) : failed(r)));
  const refresh = () => act('properties', () => searchConsoleProperties(project.id), (r) => {
    if (!r.ok) return failed(r);
    setProperties(r.properties);
    setConn((c) => ({ ...c, lastError: undefined }));
    if (!choice) setChoice(r.properties.find((p) => p.usable)?.siteUrl ?? '');
  });
  const select = () => act('select', () => selectSearchConsoleProperty(project.id, choice), (r) => {
    if (!r.ok) return failed(r);
    setConn((c) => ({ ...c, property: r.property, lastError: undefined })); setReport(null); setMsg({ ok: true, text: r.message });
  });
  const sync = () => act('sync', () => syncSearchConsole(project.id, preset === 'custom' ? { preset, ...range } : { preset }), (r) => {
    if (!r.ok) return failed(r);
    setReport(r.report); setConn((c) => ({ ...c, lastSync: r.report.syncedAt, lastError: undefined }));
    if (r.message) setMsg({ ok: true, text: r.message });
  });
  const disconnect = () => act('disconnect', () => disconnectSearchConsole(project.id), (r) => {
    if (!r.ok) return failed(r);
    setConn({ connected: false }); setProperties(null); setReport(null); setChoice(''); setMsg({ ok: true, text: r.message });
  });

  // Right after connecting, list the account's properties once so one can be chosen.
  useEffect(() => { if (justConnected && conn.connected && !conn.property) refresh(); }, []);

  return (
    <div className="ad-gsc" data-testid="gsc">
      <section className="ad-panel" data-testid="gsc-connection">
        <h2>Google Search Console · {projectName}</h2>
        <p className="ad-hint">This connection belongs to <b>{projectName}</b> ({website.replace('https://', '')}) only. It is read-only and kept on the server — the CMS never sees your Google password.</p>
        {configProblem && <p className="ad-note ad-note--warn">{configProblem}</p>}
        <dl className="ad-gsc-status">
          <div><dt>Status</dt><dd data-testid="gsc-status">{conn.connected ? <span className="ad-use ad-use--ok">Connected</span> : <span className="ad-use">Not connected</span>}</dd></div>
          <div><dt>Property</dt><dd data-testid="gsc-property">{conn.property ? <code>{conn.property}</code> : 'Not selected'}</dd></div>
          <div><dt>Last successful sync</dt><dd data-testid="gsc-last-sync">{when(conn.lastSync)}</dd></div>
          <div><dt>Last error</dt><dd data-testid="gsc-last-error">{conn.lastError ? <span className="ad-warn-text">{conn.lastError.message} <span className="ad-hint">({when(conn.lastError.at)})</span></span> : 'None'}</dd></div>
        </dl>
        <div className="ad-seo-toolbar">
          {!conn.connected
            ? <button type="button" className="btn btn-dark" onClick={connect} disabled={Boolean(busy) || Boolean(configProblem)} data-testid="gsc-connect">{busy === 'connect' ? 'Opening Google…' : 'Connect Google Search Console'} <span className="dot">→</span></button>
            : <>
              <button type="button" className="ad-btn" onClick={refresh} disabled={Boolean(busy)} data-testid="gsc-refresh">{busy === 'properties' ? 'Loading…' : 'Refresh properties'}</button>
              <button type="button" className="ad-btn" onClick={sync} disabled={Boolean(busy) || !conn.property} data-testid="gsc-sync">{busy === 'sync' ? 'Syncing…' : 'Sync now'}</button>
              <button type="button" className="ad-btn ad-btn--danger" onClick={disconnect} disabled={Boolean(busy)} data-testid="gsc-disconnect">Disconnect</button>
            </>}
        </div>
        {msg && <p className={`ad-note ${msg.ok ? '' : 'ad-note--error'}`} role="status" data-testid="gsc-message">{msg.text}</p>}

        {properties && (
          <fieldset className="ad-radios ad-gsc-props" data-testid="gsc-properties">
            <legend className="ad-label">Properties this Google account can access ({properties.length})</legend>
            {properties.length === 0 && <p className="ad-hint">This Google account has no Search Console properties. Add it as a user of the {projectName} property in Search Console, then refresh.</p>}
            {properties.length > 0 && !properties.some((p) => p.usable) && (
              <p className="ad-note ad-note--warn" data-testid="gsc-no-access">None of these is a {projectName} property this account can read. In Search Console → Settings → Users and permissions, add this Google account to the {projectName} property, then refresh.</p>
            )}
            {properties.map((p) => (
              <label key={p.siteUrl} data-site={p.siteUrl} data-usable={p.usable ? 'yes' : 'no'}>
                <input type="radio" name="gsc-property" value={p.siteUrl} checked={choice === p.siteUrl} disabled={!p.usable} onChange={() => setChoice(p.siteUrl)} />
                <code>{p.siteUrl}</code> <span className="ad-hint">{p.permission}{p.reason ? ` · ${p.reason}` : ''}{p.siteUrl === conn.property ? ' · selected' : ''}</span>
              </label>
            ))}
            {properties.some((p) => p.usable) && (
              <button type="button" className="btn btn-dark" onClick={select} disabled={Boolean(busy) || !choice || choice === conn.property} data-testid="gsc-select">Use this property <span className="dot">→</span></button>
            )}
          </fieldset>
        )}

        {conn.connected && conn.property && (
          <div className="ad-kw-grid ad-gsc-period">
            <label className="field ad-field"><span className="ad-label">Reporting period</span>
              <select value={preset} onChange={(e) => setPreset(e.target.value as typeof preset)} data-testid="gsc-preset">
                {Object.entries(PRESETS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                <option value="custom">Custom range</option>
              </select></label>
            {preset === 'custom' && <>
              <label className="field ad-field"><span className="ad-label">From</span><input type="date" value={range.start} onChange={(e) => setRange((r) => ({ ...r, start: e.target.value }))} data-testid="gsc-start" /></label>
              <label className="field ad-field"><span className="ad-label">To</span><input type="date" value={range.end} onChange={(e) => setRange((r) => ({ ...r, end: e.target.value }))} data-testid="gsc-end" /></label>
            </>}
          </div>
        )}
      </section>

      {report && <Dashboard report={report} projectId={project.id} />}
      {conn.connected && conn.property && !report && <p className="ad-note">Press <b>Sync now</b> to read {projectName}&rsquo;s performance data from Search Console.</p>}
    </div>
  );
}

/* ---------- the dashboard ---------- */

function Dashboard({ report, projectId }: { report: Report; projectId: string }) {
  const c = report.comparison;
  return (
    <div data-testid="gsc-dashboard">
      <p className="ad-note" data-testid="gsc-period">
        <b>{report.period.label}:</b> {day(report.period.start)} – {day(report.period.end)} ({report.period.days} days)
        {report.previous ? <> · compared with {day(report.previous.start)} – {day(report.previous.end)}</> : ' · no earlier period of the same length is available to compare'}
        <span className="ad-hint ad-block">
          Property <code>{report.property}</code> · Web search · final data only. Search Console usually needs {DATA_DELAY_DAYS - 1}–{DATA_DELAY_DAYS} days to finalise, so the latest days are not included
          {report.mayBeIncomplete ? ' — this range reaches into recent days, which may still be incomplete.' : '.'} Synced {when(report.syncedAt)}.
        </span>
      </p>

      <div className="ad-stats ad-stats--seo" data-testid="gsc-overview">
        <Tile label="Clicks" value={n(report.totals.clicks)} change={c && <Delta ch={c.clicks} />} />
        <Tile label="Impressions" value={n(report.totals.impressions)} change={c && <Delta ch={c.impressions} />} />
        <Tile label="CTR" value={ctr(report.totals.ctr)} change={c && (
          <span data-testid="gsc-ctr-change">{signed(c.ctr.points, 2)} percentage points{c.ctr.percent !== null && <> ({signed(c.ctr.percent, 1)}% relative)</>}</span>
        )} />
        <Tile label="Average position" value={pos(report.totals.position)} change={c && <span data-testid="gsc-position-change">{describePosition(c.position)}</span>} />
      </div>
      <p className="ad-hint">Impressions count how often a result from the site was shown in Google — they are not search volume. Average position is where the site&rsquo;s result appeared on average; a lower number is a better ranking, and it is not keyword difficulty.</p>

      {report.totals.impressions === 0 && report.queries.length === 0 && (
        <p className="ad-note ad-note--warn" data-testid="gsc-empty">Search Console has no performance data for this property in this period.</p>
      )}

      <Section title="Top queries" count={report.counts.queries} testid="gsc-queries">
        <MetricTable rows={report.queries} first="Query" cell={(q) => <><b>{q.query}</b><LibraryTag q={q} /></>} rowKey={(q) => q.query} />
        <p className="ad-hint">Google hides some rare queries for privacy, so query rows do not add up to the totals.</p>
      </Section>

      <Section title="Top pages" count={report.counts.pages} testid="gsc-pages">
        <MetricTable rows={report.pages} first="Page" cell={(p) => <><code>{p.path}</code>{p.assigned.length > 0 && <span className="ad-hint ad-block">Primary keyword in the CMS: {p.assigned.map((a) => a.name).join(', ')}</span>}</>} rowKey={(p) => p.page} />
      </Section>

      <div className="ad-section-head"><h2>Opportunities</h2></div>
      <p className="ad-hint">Possible places to improve — not guarantees. Rankings depend on far more than these figures.</p>
      <div className="ad-opps" data-testid="gsc-opportunities">
        <Opp title="Queries at positions 4–10" note="On page one, below the top three results." rows={report.opportunities.positions4to10} testid="gsc-opp-4-10" />
        <Opp title="Queries at positions 11–20" note="Usually on page two." rows={report.opportunities.positions11to20} testid="gsc-opp-11-20" />
        <Opp title="High impressions, comparatively low CTR"
          note={`At least ${n(report.opportunities.lowCtrRule.minImpressions)} impressions and a CTR below ${ctr(report.opportunities.lowCtrRule.maxCtr)} — half of the site's CTR for this period. Position affects CTR, so compare like with like.`}
          rows={report.opportunities.lowCtr} testid="gsc-opp-ctr" />
      </div>

      <Section title="Query → page" count={report.queryPages.length} testid="gsc-query-pages">
        <p className="ad-hint">Which page Search Console shows for each query (visibility = impressions) and which one gets the clicks. Nothing here changes a page assignment or any metadata.</p>
        <QueryPageTable rows={report.queryPages} />
      </Section>

      <Section title="Queries reaching multiple pages" count={report.multiPage.length} testid="gsc-multi-page">
        {report.multiPage.length === 0 ? <p className="ad-hint">No query reaches more than one page with a meaningful share of its impressions in this period.</p> : (
          <>
            <p className="ad-note ad-note--warn">{MULTI_PAGE_NOTE}</p>
            <QueryPageTable rows={report.multiPage} showNote />
          </>
        )}
      </Section>

      <Discoveries report={report} projectId={projectId} />

      <div className="ad-opps">
        <Small title="Countries" rows={report.countries} label={(k) => k.toUpperCase()} testid="gsc-countries" />
        <Small title="Devices" rows={report.devices} label={(k) => k.charAt(0) + k.slice(1).toLowerCase()} testid="gsc-devices" />
        <Small title="Search appearance" rows={report.appearances} label={(k) => k.replace(/_/g, ' ').toLowerCase()} testid="gsc-appearance" empty="No search appearance data for this period." />
      </div>
      <details className="ad-panel" data-testid="gsc-dates">
        <summary>Daily figures ({report.dates.length} days)</summary>
        <MetricTable rows={report.dates} first="Date" cell={(d) => day(d.key)} rowKey={(d) => d.key} limit={400} />
      </details>
    </div>
  );
}

function Tile({ label, value, change }: { label: string; value: string; change: ReactNode }) {
  return <div className="ad-stat" data-metric={label}><span>{label}</span><b>{value}</b>{change && <em className="ad-gsc-change">{change}</em>}</div>;
}

function Delta({ ch }: { ch: Change }) {
  return <>{signed(ch.change)} vs previous{ch.percent !== null ? ` (${signed(ch.percent, 1)}%)` : ''}</>;
}

function Section({ title, count, testid, children }: { title: string; count: number; testid: string; children: ReactNode }) {
  return (
    <section className="ad-gsc-section" data-testid={testid}>
      <div className="ad-section-head"><h2>{title} <span className="ad-count-pill">{count}</span></h2></div>
      {children}
    </section>
  );
}

function MetricTable<T extends Metrics>({ rows, first, cell, rowKey, limit = 25 }: { rows: T[]; first: string; cell: (r: T) => ReactNode; rowKey: (r: T) => string; limit?: number }) {
  const [all, setAll] = useState(false);
  if (!rows.length) return <p className="ad-hint">No rows for this period.</p>;
  return (
    <div className="ad-table-wrap">
      <table className="ad-table ad-research-table">
        <thead><tr><th scope="col">{first}</th><th scope="col">Clicks</th><th scope="col">Impressions</th><th scope="col">CTR</th><th scope="col">Avg. position</th></tr></thead>
        <tbody>
          {(all ? rows : rows.slice(0, limit)).map((r) => (
            <tr key={rowKey(r)} data-row={rowKey(r)}><td>{cell(r)}</td><td>{n(r.clicks)}</td><td>{n(r.impressions)}</td><td>{ctr(r.ctr)}</td><td>{pos(r.position)}</td></tr>
          ))}
        </tbody>
      </table>
      {rows.length > limit && <button type="button" className="ad-mini" onClick={() => setAll((v) => !v)}>{all ? 'Show fewer' : `Show all ${rows.length}`}</button>}
    </div>
  );
}

function LibraryTag({ q }: { q: { library?: Report['queries'][number]['library'] } }) {
  if (!q.library) return null;
  return <span className="ad-use ad-use--ok ad-gsc-lib" data-testid="gsc-in-library" title="Matched by the keyword library's own normalisation">In keyword library{q.library.keyword !== undefined && ` as “${q.library.keyword}”`}{q.library.clusterName ? ` · ${q.library.clusterName}` : ''}</span>;
}

function Opp({ title, note, rows, testid }: { title: string; note: string; rows: QueryRow[]; testid: string }) {
  return (
    <section className="ad-panel" data-testid={testid}>
      <h2>{title} <span className="ad-count-pill">{rows.length}</span></h2>
      <p className="ad-hint">{note}</p>
      {rows.length === 0 ? <p className="ad-hint">None in this period.</p> : (
        <ul className="ad-opp-list">{rows.slice(0, 15).map((q) => <li key={q.query}><b>{q.query}</b> <span className="ad-hint">· position {pos(q.position)} · {n(q.impressions)} impressions · CTR {ctr(q.ctr)}</span></li>)}</ul>
      )}
    </section>
  );
}

function QueryPageTable({ rows, showNote = false }: { rows: ReportQueryPages[]; showNote?: boolean }) {
  const [all, setAll] = useState(false);
  if (!rows.length) return <p className="ad-hint">No query and page rows for this period.</p>;
  return (
    <div className="ad-table-wrap">
      <table className="ad-table ad-research-table">
        <thead><tr><th scope="col">Query</th><th scope="col">Most visible page</th><th scope="col">Most clicked page</th><th scope="col">Pages</th><th scope="col">Signals</th></tr></thead>
        <tbody>
          {(all ? rows : rows.slice(0, 25)).map((q) => (
            <tr key={q.query} data-query={q.query} data-multi={q.multiplePages ? 'yes' : 'no'}>
              <td><b>{q.query}</b><span className="ad-hint ad-block">{n(q.impressions)} impressions · {n(q.clicks)} clicks</span>{q.library && <LibraryTag q={q} />}</td>
              <td><code>{q.topVisibility}</code></td>
              <td>{q.topClicks ? <code>{q.topClicks}</code> : <span className="ad-hint">No clicks</span>}</td>
              <td>
                <ul className="ad-gsc-pages">{q.pages.slice(0, 5).map((p) => <li key={p.path}><code>{p.path}</code> <span className="ad-hint">{n(p.impressions)} impr. · {n(p.clicks)} clicks · pos. {pos(p.position)}</span></li>)}</ul>
              </td>
              <td className="ad-gsc-signals">
                {q.multiplePages && <span className="ad-warn-text ad-block" data-signal="multi">{showNote ? 'Visibility across multiple pages' : MULTI_PAGE_NOTE}</span>}
                {q.cmsCannibalisation && <span className="ad-warn-text ad-block" data-signal="cms">The CMS also finds two pages with this primary keyword (see SEO overview).</span>}
                {q.clickMismatch && <span className="ad-hint ad-block" data-signal="clicks">Most visibility and most clicks go to different pages.</span>}
                {q.assignmentMismatch && <span className="ad-hint ad-block" data-signal="assignment">Assigned in the CMS as primary keyword of {q.assigned.filter((a) => a.role === 'primary').map((a) => a.path).join(', ')} — Search Console shows {q.topVisibility} most.</span>}
                {!q.multiplePages && !q.cmsCannibalisation && !q.clickMismatch && !q.assignmentMismatch && <span className="ad-hint">—</span>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {rows.length > 25 && <button type="button" className="ad-mini" onClick={() => setAll((v) => !v)}>{all ? 'Show fewer' : `Show all ${rows.length}`}</button>}
    </div>
  );
}

function Small({ title, rows, label, testid, empty = 'No data for this period.' }: { title: string; rows: KeyRow[]; label: (k: string) => string; testid: string; empty?: string }) {
  return (
    <section className="ad-panel" data-testid={testid}>
      <h2>{title}</h2>
      {rows.length === 0 ? <p className="ad-hint">{empty}</p> : (
        <table className="ad-table ad-research-table">
          <thead><tr><th scope="col">{title.replace(/s$/, '')}</th><th scope="col">Clicks</th><th scope="col">Impressions</th><th scope="col">CTR</th></tr></thead>
          <tbody>{rows.slice(0, 10).map((r) => <tr key={r.key}><td>{label(r.key)}</td><td>{n(r.clicks)}</td><td>{n(r.impressions)}</td><td>{ctr(r.ctr)}</td></tr>)}</tbody>
        </table>
      )}
    </section>
  );
}

/** Queries not in the library. Shown only; added only when the admin selects and confirms. */
function Discoveries({ report, projectId }: { report: Report; projectId: string }) {
  const [selected, setSelected] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<SeoResult | null>(null);
  const [added, setAdded] = useState<string[]>([]);
  const rows = report.discoveries.filter((q) => !added.includes(q.query));
  const add = async () => {
    setBusy(true); setResult(null);
    try {
      const r = await addSearchConsoleQueries(projectId, selected, { start: report.period.start, end: report.period.end });
      setResult(r);
      if (r.ok) { setAdded((a) => [...a, ...selected]); setSelected([]); }
    } catch {
      setResult({ ok: false, message: 'Could not reach the server. Nothing was saved.' });
    } finally { setBusy(false); }
  };
  return (
    <Section title="Potential keyword discoveries" count={rows.length} testid="gsc-discoveries">
      <p className="ad-hint">Queries with at least 10 impressions that are not in the keyword library. Nothing is added unless you choose it; added queries become keyword ideas with no figures — impressions are not search volume.</p>
      {rows.length === 0 ? <p className="ad-hint">Every query with meaningful visibility is already in the library.</p> : (
        <>
          <ul className="ad-gsc-disc">
            {rows.slice(0, 50).map((q) => (
              <li key={q.query}>
                <label><input type="checkbox" checked={selected.includes(q.query)} onChange={() => setSelected((s) => (s.includes(q.query) ? s.filter((x) => x !== q.query) : [...s, q.query]))} data-query={q.query} />
                  <b>{q.query}</b> <span className="ad-hint">{n(q.impressions)} impressions · position {pos(q.position)}</span></label>
              </li>
            ))}
          </ul>
          {result && <Status result={result} />}
          <button type="button" className="ad-btn" onClick={add} disabled={busy || !selected.length} data-testid="gsc-add">{busy ? 'Adding…' : `Add ${selected.length} to keyword library`}</button>
        </>
      )}
    </Section>
  );
}
