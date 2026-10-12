'use client';

/**
 * When an admin page cannot load — most often because the active project's
 * GitHub repository cannot be reached. The project switcher above stays
 * usable. Production hides the server's error text, so nothing internal is
 * shown here; the dashboard explains the repository's status.
 */
export default function CmsError({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return (
    <div className="ad-note ad-note--error" role="alert" data-testid="cms-error">
      <p><b>This page could not be loaded.</b> The active project&rsquo;s GitHub repository may be unreachable, or the GitHub App may not have access to it.</p>
      <p className="ad-hint">
        The <a href="/admin/dashboard">dashboard</a> shows the repository status for the active project. Nothing was saved or changed.
        {error.digest && <> Reference: <code>{error.digest}</code></>}
      </p>
      <button type="button" className="ad-btn" onClick={() => retry()}>Try again</button>
    </div>
  );
}
