import type { Project } from '@/lib/cms/projects';

/** Shown instead of a screen the active project does not have — never another project's data in its place. */
export default function ProjectNotice({ project, what }: { project: Project; what: string }) {
  return (
    <div className="ad-note ad-note--warn" data-testid="project-notice">
      <b>{what}</b> {what.endsWith('s') ? 'are' : 'is'} not set up for <b>{project.name}</b> in this CMS. It belongs to the Vioniche website —
      switch to Vioniche with the Project menu at the top to use it.
    </div>
  );
}
