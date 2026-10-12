/**
 * Research settings: which provider the Research screen opens on, and its
 * default place. Stored as content/seo/settings.json through the same GitHub
 * commit path as the keyword library. The provider decides which research
 * tools are shown — never which keywords are visible.
 *
 * A missing file means the defaults (Google Trends), so nothing breaks before
 * the first save.
 *
 * Pure and browser-safe.
 */
export const PROVIDERS = {
  'google-trends': { label: 'Google Trends', mode: 'Free' },
  'keyword-planner': { label: 'Google Keyword Planner', mode: 'Free' },
  'keyword-ideas': { label: 'Keyword Ideas', mode: 'Free' },
  manual: { label: 'Manual / CSV', mode: 'Free' },
} as const;
export type Provider = keyof typeof PROVIDERS;

export type ResearchSettings = { version: 1; provider: Provider; trendsGeo: string; updatedAt?: string };

export const defaultSettings = (): ResearchSettings => ({ version: 1, provider: 'google-trends', trendsGeo: 'IN' });

/**
 * A settings file written by an earlier version may name a provider that no
 * longer exists (the removed Ahrefs option) or carry its old fields. Those
 * are read leniently — an unknown provider falls back to the default and
 * unknown fields are ignored — so an old file never breaks the screen.
 */
export function normalizeSettings(raw: unknown): ResearchSettings {
  const v = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  const d = defaultSettings();
  return {
    version: 1,
    provider: typeof v.provider === 'string' && v.provider in PROVIDERS ? (v.provider as Provider) : d.provider,
    trendsGeo: typeof v.trendsGeo === 'string' && /^([A-Z]{2}(-[A-Z0-9]{1,3})?)?$/.test(v.trendsGeo) ? v.trendsGeo : d.trendsGeo,
    ...(typeof v.updatedAt === 'string' && { updatedAt: v.updatedAt }),
  };
}

/** Rules for what the CMS writes. */
export function settingsProblems(s: unknown): string[] {
  const v = s as Partial<ResearchSettings> | null;
  if (!v || typeof v !== 'object' || v.version !== 1) return ['content/seo/settings.json must be { "version": 1, … }'];
  const out: string[] = [];
  if (!v.provider || !(v.provider in PROVIDERS)) out.push('provider must be google-trends, keyword-planner, keyword-ideas or manual');
  if (typeof v.trendsGeo !== 'string' || !/^([A-Z]{2}(-[A-Z0-9]{1,3})?)?$/.test(v.trendsGeo)) out.push('trendsGeo must be empty (worldwide) or a code like IN or US-NY');
  for (const k of Object.keys(v)) if (!['version', 'provider', 'trendsGeo', 'updatedAt'].includes(k)) out.push(`Unknown setting: ${k}`);
  return out;
}
