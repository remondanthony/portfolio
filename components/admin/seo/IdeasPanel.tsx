'use client';

import { useProject } from '@/components/admin/ProjectScope';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { checkKeywordIdeas, saveKeywordIdeas, type CheckedIdea } from '@/lib/cms/research-actions';
import type { SeoResult } from '@/lib/cms/seo-actions';
import { csvCell } from '@/lib/seo/csv';
import {
  IDEA_LANGUAGES, IDEA_REGIONS, MAX_IDEAS, googleSearchUrl, ideaQueries, seedProblems, type IdeaLanguage, type IdeaRegion,
} from '@/lib/seo/ideas';
import { KEYWORD_TYPES } from '@/lib/seo/keywords';
import { TRENDS_MAX_TERMS, trendsExploreUrl } from '@/lib/seo/trends';
import { Status } from './KeywordManager';
import type { SaveTarget } from './ResearchProviders';

/**
 * Keyword Ideas: discover related searches from Google's suggestions.
 * The CMS builds the searches; you open them in your own browser and paste
 * back what Google suggests. Nothing is requested from Google by the CMS.
 */
export default function IdeasPanel({ target }: { target: SaveTarget }) {
  const project = useProject();
  const router = useRouter();
  const [seed, setSeed] = useState('');
  const [region, setRegion] = useState<IdeaRegion>('IN');
  const [language, setLanguage] = useState<IdeaLanguage>('en');
  const [shown, setShown] = useState<{ seed: string; region: IdeaRegion; language: IdeaLanguage } | null>(null);
  const [paste, setPaste] = useState('');
  const [ideas, setIdeas] = useState<CheckedIdea[] | null>(null);
  const [info, setInfo] = useState('');
  const [selected, setSelected] = useState<string[]>([]);
  const [type, setType] = useState('secondary');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<SeoResult | null>(null);
  const [copied, setCopied] = useState('');

  const seedError = seed.trim() ? seedProblems(seed)[0] : '';
  const showSearches = () => {
    setError('');
    const p = seedProblems(seed);
    if (p.length) { setError(p[0]); return; }
    setShown({ seed: seed.trim().replace(/\s+/g, ' '), region, language });
    setIdeas(null); setResult(null);
  };

  const find = async () => {
    if (!shown) return;
    setBusy(true); setError(''); setResult(null); setIdeas(null);
    try {
      const r = await checkKeywordIdeas(project.id, paste, shown.seed, shown.region, shown.language);
      if (!r.ok) { setError(r.message); return; }
      setIdeas(r.ideas);
      setInfo(`${r.ideas.length} idea${r.ideas.length === 1 ? '' : 's'}${r.duplicates ? ` · ${r.duplicates} repeat${r.duplicates === 1 ? '' : 's'} removed` : ''}${r.truncated ? ` · only the first ${MAX_IDEAS} are used` : ''}`);
      setSelected(r.ideas.filter((i) => !i.problems.length && !i.existing).map((i) => i.keyword));
    } catch {
      setError('Keyword suggestions are temporarily unavailable. Please try again later.');
    } finally {
      setBusy(false);
    }
  };

  const save = async () => {
    if (!shown) return;
    setBusy(true); setResult(null);
    try {
      const r = await saveKeywordIdeas(project.id, selected, shown, { type });
      setResult(r);
      if (r.ok) { router.refresh(); setIdeas((list) => list?.map((i) => (selected.includes(i.keyword) ? { ...i, existing: i.existing ?? { keyword: i.keyword, planner: false, trends: false, cluster: false } } : i)) ?? null); }
    } catch (e) {
      setResult({ ok: false, message: `Could not reach the server: ${(e as Error).message}` });
    } finally {
      setBusy(false);
    }
  };

  const copy = (text: string, key: string) => navigator.clipboard?.writeText(text).then(() => { setCopied(key); setTimeout(() => setCopied(''), 1500); }, () => {});

  const exportCsv = () => {
    if (!ideas || !shown) return;
    const date = new Date().toISOString().slice(0, 10);
    const rows = ideas.filter((i) => selected.length === 0 || selected.includes(i.keyword)).filter((i) => !i.problems.length);
    const text = [['Keyword', 'Source', 'Country', 'Language', 'Research Date', 'In library'].map(csvCell).join(','),
      ...rows.map((i) => [i.keyword, 'Google Autocomplete', IDEA_REGIONS[shown.region], IDEA_LANGUAGES[shown.language], date, i.existing ? 'Yes' : 'No'].map(csvCell).join(','))].join('\r\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([`﻿${text}\r\n`], { type: 'text/csv;charset=utf-8' }));
    a.download = `keyword-ideas-${shown.seed.replace(/[^a-z0-9]+/gi, '-').slice(0, 40)}-${date}.csv`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  };

  const usable = ideas?.filter((i) => !i.problems.length) ?? [];
  const trendsTerms = selected.slice(0, TRENDS_MAX_TERMS);

  return (
    <div className="ad-provider-panel" data-panel="keyword-ideas">
      <section className="ad-panel">
        <h2>Keyword Ideas</h2>
        <p className="ad-note" data-testid="ideas-note">
          Keyword Ideas uses Google autocomplete suggestions to discover related searches. It does not provide search volume or keyword difficulty.
        </p>
        <div className="ad-kw-grid">
          <label className="field ad-field ad-kw-wide"><span className="ad-label">Seed keyword</span>
            <input value={seed} onChange={(e) => setSeed(e.target.value)} placeholder="youtube seo" maxLength={120} aria-invalid={Boolean(seedError)} /></label>
          <label className="field ad-field"><span className="ad-label">Suggestion region</span>
            <select value={region} onChange={(e) => setRegion(e.target.value as IdeaRegion)}>{Object.entries(IDEA_REGIONS).map(([c, n]) => <option key={c} value={c}>{n}</option>)}</select></label>
          <label className="field ad-field"><span className="ad-label">Language</span>
            <select value={language} onChange={(e) => setLanguage(e.target.value as IdeaLanguage)}>{Object.entries(IDEA_LANGUAGES).map(([c, n]) => <option key={c} value={c}>{n}</option>)}</select></label>
        </div>
        {seedError && <p className="ad-note ad-note--error">{seedError}</p>}
        <button type="button" className="btn btn-dark" onClick={showSearches} disabled={busy} data-testid="ideas-searches-btn">Show Google searches <span className="dot">→</span></button>
        {error && !shown && <p className="ad-note ad-note--error" role="alert">{error}</p>}
      </section>

      {shown && (
        <section className="ad-panel" data-testid="ideas-searches">
          <h2>1 · Look at Google&rsquo;s suggestions</h2>
          <p className="ad-hint">
            Suggestion region: <b>{IDEA_REGIONS[shown.region]}</b> · {IDEA_LANGUAGES[shown.language]}. Open a search, then click into Google&rsquo;s search box to see its
            suggestions; related searches are also listed at the bottom of the results. Copy the useful ones into the box below. The region only shapes
            Google&rsquo;s suggestions — it is not Keyword Planner location targeting.
          </p>
          <ul className="ad-idea-queries">
            {ideaQueries(shown.seed).map((q) => (
              <li key={q}>
                <a href={googleSearchUrl(q, shown.region, shown.language)} target="_blank" rel="noopener noreferrer">{q} ↗</a>
                <button type="button" className="ad-mini" onClick={() => copy(q, q)} title="Copy this search to type it into Google yourself">{copied === q ? 'Copied' : 'Copy'}</button>
              </li>
            ))}
          </ul>
          <p className="ad-hint">At most 27 searches per seed — open only the ones you need.</p>
        </section>
      )}

      {shown && (
        <section className="ad-panel">
          <h2>2 · Paste the suggestions</h2>
          <label className="field ad-field"><span className="ad-label">One suggestion per line</span>
            <textarea rows={8} value={paste} onChange={(e) => setPaste(e.target.value)} placeholder={'youtube seo agency\nyoutube seo for beginners\nyoutube seo tools'} data-testid="ideas-paste" /></label>
          <button type="button" className="btn btn-dark" onClick={find} disabled={busy || !paste.trim()} data-testid="ideas-find-btn">{busy && !ideas ? 'Checking…' : 'Find Keyword Ideas'} <span className="dot">→</span></button>
          {error && <p className="ad-note ad-note--error" role="alert">{error}</p>}
        </section>
      )}

      {ideas && shown && (
        <section className="ad-panel" data-testid="ideas-results">
          <h2>3 · Keyword ideas</h2>
          <p className="ad-hint">{info} · suggestion region {IDEA_REGIONS[shown.region]} · no search volume or difficulty — import a Keyword Planner export later for that.</p>
          <div className="ad-seo-toolbar">
            <button type="button" className="ad-mini" onClick={() => setSelected(usable.map((i) => i.keyword))}>Select all</button>
            <button type="button" className="ad-mini" onClick={() => setSelected([])}>Clear selection</button>
            <button type="button" className="ad-mini" disabled={!selected.length} onClick={() => copy(selected.join('\n'), 'kp')} title="Paste into Keyword Planner's 'Get search volume and forecasts'">{copied === 'kp' ? 'Copied' : `Copy ${selected.length} for Keyword Planner`}</button>
            {trendsTerms.length > 0 && (
              <a className="ad-mini" href={trendsExploreUrl(trendsTerms, shown.region, 'today 12-m')} target="_blank" rel="noopener noreferrer" data-testid="ideas-trends">
                Open {trendsTerms.length} in Google Trends ↗
              </a>
            )}
            <button type="button" className="ad-mini" onClick={exportCsv} data-testid="ideas-export">Export {selected.length ? 'selected' : 'all'} (CSV)</button>
          </div>
          <div className="ad-table-wrap">
            <table className="ad-table ad-research-table">
              <thead><tr><th scope="col">Select</th><th scope="col">Keyword</th><th scope="col">Existing</th><th scope="col">Source</th></tr></thead>
              <tbody>
                {ideas.map((i) => (
                  <tr key={i.keyword} data-keyword={i.keyword} data-existing={i.existing ? 'yes' : 'no'}>
                    <td><input type="checkbox" aria-label={`Select ${i.keyword}`} disabled={i.problems.length > 0} checked={selected.includes(i.keyword)}
                      onChange={() => setSelected((s) => (s.includes(i.keyword) ? s.filter((x) => x !== i.keyword) : [...s, i.keyword]))} /></td>
                    <td>{i.keyword}{i.problems.length > 0 && <span className="ad-hint ad-block">{i.problems.join('; ')}</span>}</td>
                    <td>
                      {i.existing ? <span className="ad-use">Already in library</span> : 'No'}
                      {i.existing && (i.existing.planner || i.existing.trends || i.existing.cluster) && (
                        <span className="ad-hint ad-block">Has {[i.existing.planner && 'Keyword Planner data', i.existing.trends && 'Google Trends data', i.existing.cluster && 'a cluster'].filter(Boolean).join(', ')} — kept as is</span>
                      )}
                    </td>
                    <td>Google Autocomplete</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="ad-kw-grid">
            <label className="field ad-field"><span className="ad-label">Save new ideas as</span>
              <select value={type} onChange={(e) => setType(e.target.value)}>{KEYWORD_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}</select></label>
          </div>
          {result && <Status result={result} />}
          <button type="button" className="btn btn-dark" onClick={save} disabled={busy || !selected.length || !target.canSave} data-testid="ideas-save-btn">
            {busy ? 'Saving…' : `Save Selected (${selected.length})`} <span className="dot">→</span>
          </button>
          <p className="ad-hint">One commit to the keyword library. Assign clusters and pages afterwards on the Keywords screen.</p>
        </section>
      )}
    </div>
  );
}
