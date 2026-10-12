import { PRESETS, resolvePeriod, type Report } from '@/lib/seo/search-console';
import { oauthConfig, readConnection } from './google-oauth';
import type { Project } from './projects';
import { cacheKey, cached } from './search-console-api';

/**
 * What the Search Console screen needs on load, for one project: whether
 * OAuth is configured, the connection's public details, and a report already
 * in the server cache. Makes no request to Google. Server only.
 */

/** The connection as the browser may see it: no token, ever. */
export type ConnectionSummary = {
  connected: boolean;
  property?: string;
  connectedAt?: string;
  lastSync?: string;
  lastError?: { at: string; message: string };
};

export async function searchConsoleState(project: Project): Promise<{ configProblem?: string; connection: ConnectionSummary; report: Report | null; preset: keyof typeof PRESETS }> {
  const config = oauthConfig();
  const c = project.features.searchConsole ? await readConnection(project.id) : null;
  const connection: ConnectionSummary = c
    ? { connected: true, property: c.property, connectedAt: c.connectedAt, lastSync: c.lastSync, lastError: c.lastError }
    : { connected: false };
  let report: Report | null = null;
  if (c?.property) {
    const p = resolvePeriod({ preset: '28d' });
    if (!('error' in p)) report = cached<Report>(cacheKey(project.id, c.property, p));
  }
  return { ...('problem' in config && { configProblem: config.problem }), connection, report, preset: '28d' };
}
