'use client';

import { useProject } from '@/components/admin/ProjectScope';
import { useState } from 'react';
import { saveResearchSettings } from '@/lib/cms/research-actions';
import type { SeoResult } from '@/lib/cms/seo-actions';
import type { Keyword } from '@/lib/seo/keywords';
import { PROVIDERS, type Provider, type ResearchSettings } from '@/lib/seo/settings';
import ComparePanel from './ComparePanel';
import CsvImport from './CsvImport';
import IdeasPanel from './IdeasPanel';
import PlannerPanel from './PlannerPanel';
import { Status } from './KeywordManager';
import TrendsPanel from './TrendsPanel';

export type SaveTarget = { clusters: { id: string; name: string }[]; canSave: boolean };

const BLURB: Record<Provider, string> = {
  'google-trends': 'Relative search interest over time, compared across up to five terms, plus related and rising queries. No account or key.',
  'keyword-planner': 'Import keyword ideas exported from Google Keyword Planner: average monthly searches, Google Ads competition, trend changes and bids. No connection to Google Ads.',
  'keyword-ideas': 'Discover related searches and long-tail variations from Google\u2019s suggestions, then save the ones you want. Ideas only — no search volume or difficulty.',
  manual: 'Type keywords in, or import CSV exports from keyword research tools. No account or key.',
};

/**
 * The provider switcher. Switching changes the research tools on this page —
 * and is remembered in content/seo/settings.json — but never the keyword
 * library, clusters or page assignments.
 */
export default function ResearchProviders({ settings, canSave, clusters, keywords }: {
  settings: ResearchSettings; canSave: boolean;
  clusters: { id: string; name: string }[]; keywords: Keyword[];
}) {
  const project = useProject();
  const [provider, setProvider] = useState<Provider>(settings.provider);
  const [result, setResult] = useState<SeoResult | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState<Provider>(settings.provider);

  const choose = async (p: Provider) => {
    setProvider(p);
    setResult(null);
    if (!canSave || p === saved) return;
    setSaving(true);
    try {
      const r = await saveResearchSettings(project.id, { provider: p });
      setResult(r);
      if (r.ok) setSaved(p);
    } catch (e) {
      setResult({ ok: false, message: `Could not save the preference: ${(e as Error).message}` });
    } finally {
      setSaving(false);
    }
  };

  const target: SaveTarget = { clusters, canSave };

  return (
    <div className="ad-seo ad-research">
      <fieldset className="ad-providers" disabled={saving}>
        <legend className="ad-label">Research provider</legend>
        {(Object.keys(PROVIDERS) as Provider[]).map((p) => (
          <label key={p} className={`ad-provider ${provider === p ? 'is-on' : ''}`} data-provider={p}>
            <input type="radio" name="provider" checked={provider === p} onChange={() => choose(p)} />
            <span className="ad-provider-head"><b>{PROVIDERS[p].label}</b> <span className="ad-pill ad-pill--free">{PROVIDERS[p].mode}</span></span>
            <span className="ad-hint">{BLURB[p]}</span>
          </label>
        ))}
      </fieldset>
      {result && <Status result={result} />}

      {provider === 'google-trends' && <TrendsPanel defaultGeo={settings.trendsGeo} target={target} />}
      {provider === 'keyword-planner' && <PlannerPanel target={target} />}
      {provider === 'keyword-ideas' && <IdeasPanel target={target} />}
      {provider === 'manual' && (
        <>
          <section className="ad-panel">
            <h2>Manual entry</h2>
            <p className="ad-hint">Add keywords one at a time, with whatever metrics you have, on the Keywords screen.</p>
            <p><a className="ad-btn" href="/admin/seo/keywords">Add a keyword</a></p>
          </section>
          <CsvImport clusters={clusters} />
        </>
      )}

      <ComparePanel keywords={keywords} />
    </div>
  );
}
