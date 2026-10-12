'use client';

import { createContext, useContext, useState, type ReactNode } from 'react';
import { switchProject } from '@/lib/cms/project-actions';
import type { ProjectSummary } from '@/lib/cms/projects';

/**
 * The project the current page was rendered for. Client components send its
 * ID with every project-aware action, so a save always goes to the project
 * whose data is on screen — even if another tab has switched since. Only the
 * ID, name and website are here; the server resolves everything else.
 */
const Ctx = createContext<ProjectSummary | null>(null);

export function ProjectScope({ project, children }: { project: ProjectSummary; children: ReactNode }) {
  return <Ctx.Provider value={project}>{children}</Ctx.Provider>;
}

/** The page's project. Throws outside a ProjectScope rather than guessing one. */
export function useProject(): ProjectSummary {
  const p = useContext(Ctx);
  if (!p) throw new Error('useProject() used outside <ProjectScope>.');
  return p;
}

/**
 * Project: [Vioniche ▼]. Changing it stores the choice on the server and
 * reloads the page in full, so nothing from the previous project stays in
 * memory on screen.
 */
export function ProjectSwitcher({ projects }: { projects: ProjectSummary[] }) {
  const current = useProject();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const change = async (id: string) => {
    if (id === current.id) return;
    setBusy(true); setError('');
    try {
      const r = await switchProject(id);
      if (!r.ok) { setError(r.message); setBusy(false); return; }
      window.location.reload();
    } catch {
      setError('Could not switch project. Sign in again and retry.');
      setBusy(false);
    }
  };
  return (
    <label className="ad-project" data-testid="project-switcher" title={error || `Working on ${current.name} — ${current.website}`}>
      <span className="ad-project-label">Project</span>
      <select value={current.id} onChange={(e) => change(e.target.value)} disabled={busy} aria-label="Active project" aria-invalid={Boolean(error)}>
        {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
      </select>
      {error && <span className="ad-project-error" role="alert">{error}</span>}
    </label>
  );
}
