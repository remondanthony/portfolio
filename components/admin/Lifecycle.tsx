'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  articleImpact, deleteArticle, publishArticle, unpublishArticle,
  type Impact, type LifecycleResult,
} from '@/lib/cms/actions';

type Status = 'draft' | 'published';
type Kind = 'publish' | 'unpublish' | 'delete';
type Stage =
  | { at: 'confirm'; kind: Kind; impact?: Impact; loading: boolean; error?: string }
  | { at: 'working'; kind: Kind; label: string }
  | { at: 'done'; kind: Kind; result: LifecycleResult };

/**
 * Publish, unpublish and delete for one article, each confirmed in a modal
 * dialog that also shows the outcome. The server decides everything again:
 * the slug and version sent here are only a claim, checked against the
 * stored file before anything is committed.
 *
 * In the article list a finished action refreshes the list when the dialog
 * closes. In the editor, `onUnpublished` lets the editor carry on with the
 * new version, and a delete leaves the editor for the list.
 */
export default function Lifecycle({ slug, version, status, title, place, unsaved, onUnpublished, onLeave }: {
  slug: string;
  version: string;
  status: Status;
  title: string;
  place: 'row' | 'editor';
  unsaved?: boolean;
  onUnpublished?: (version: string) => void;
  /** Called before the editor navigates away after a delete, to drop its unsaved-changes guard. */
  onLeave?: () => void;
}) {
  const router = useRouter();
  const ref = useRef<HTMLDialogElement>(null);
  const [stage, setStage] = useState<Stage | null>(null);

  const open = async (kind: Kind) => {
    setStage({ at: 'confirm', kind, loading: kind !== 'publish' });
    ref.current?.showModal();
    if (kind === 'publish') return;
    try {
      const r = await articleImpact(slug, version);
      setStage((s) => s?.at === 'confirm' && s.kind === kind
        ? 'impact' in r ? { ...s, impact: r.impact, loading: false } : { ...s, loading: false, error: r.message }
        : s);
    } catch (e) {
      setStage((s) => (s?.at === 'confirm' ? { ...s, loading: false, error: `Could not reach the server: ${(e as Error).message}` } : s));
    }
  };

  const run = async (kind: Kind) => {
    setStage({
      at: 'working',
      kind,
      label: kind === 'publish' ? 'Publishing…' : kind === 'unpublish' ? 'Unpublishing…' : 'Deleting…',
    });
    let result: LifecycleResult;
    try {
      result = kind === 'publish' ? await publishArticle(slug, version)
        : kind === 'unpublish' ? await unpublishArticle(slug, version)
        : await deleteArticle(slug, version, status);
    } catch (e) {
      result = { ok: false, message: `Could not reach the server: ${(e as Error).message}. Reload to see whether anything changed.` };
    }
    setStage({ at: 'done', kind, result });
    if (result.ok && kind === 'unpublish' && result.version) onUnpublished?.(result.version);
  };

  const close = () => {
    const done = stage?.at === 'done' ? stage : null;
    ref.current?.close();
    setStage(null);
    if (!done) return;
    if (place === 'editor' && done.result.ok && done.kind === 'delete') {
      // Let the editor drop its unsaved-changes guard before leaving.
      onLeave?.();
      setTimeout(() => window.location.assign('/admin/blog'), 0);
    } else if (place === 'row' || (done.result.ok === false && done.result.conflict)) {
      router.refresh();
    }
  };

  const working = stage?.at === 'working';
  const blocked = stage?.at === 'confirm' && (stage.loading || Boolean(stage.error) || Boolean(stage.impact?.sharedWith.length));
  const btn = place === 'row' ? 'ad-row-btn' : 'ad-btn';

  return (
    <>
      {status === 'draft' && place === 'row' && (
        <button type="button" className={btn} onClick={() => open('publish')}>Publish</button>
      )}
      {status === 'published' && (
        <button type="button" className={btn} onClick={() => open('unpublish')}>Unpublish</button>
      )}
      <button type="button" className={`${btn} ad-danger`} onClick={() => open('delete')}>
        {status === 'draft' ? 'Delete draft' : 'Delete permanently'}
      </button>

      <dialog
        ref={ref}
        className="ad-dialog"
        aria-labelledby={`lc-${place}-${slug}`}
        // Escape closes the dialog, except while a commit is in flight.
        onCancel={(e) => { e.preventDefault(); if (!working) close(); }}
      >
        {stage && (
          <div className="ad-dialog-body">
            {stage.at === 'done' ? (
              <>
                <h2 id={`lc-${place}-${slug}`}>{stage.result.ok ? doneTitle(stage.kind, status) : 'Nothing was changed'}</h2>
                <p className={stage.result.ok ? '' : 'ad-dialog-error'} role="status">{stage.result.message}</p>
                {stage.result.ok && stage.result.commit?.url && (
                  <p><a href={stage.result.commit.url} target="_blank" rel="noopener noreferrer">View commit ↗</a></p>
                )}
                <div className="ad-dialog-actions">
                  <button type="button" className="btn btn-dark" onClick={close} autoFocus>
                    {place === 'editor' && stage.result.ok && stage.kind === 'delete' ? 'Back to articles' : 'Close'}
                  </button>
                </div>
              </>
            ) : stage.kind === 'delete' ? (
              <>
                <h2 id={`lc-${place}-${slug}`}>{status === 'draft' ? 'Delete draft?' : 'Delete article permanently?'}</h2>
                <p className="ad-dialog-subject">{title}</p>
                <p>This will permanently remove:</p>
                <ul>
                  <li>{status === 'draft' ? 'Article' : 'Published article'}</li>
                  <li>Article images{stage.at === 'confirm' && stage.impact ? ` (${stage.impact.images})` : ''}</li>
                  {status === 'published' && <li>Public URL <code>/blog/{slug}</code></li>}
                </ul>
                <p><b>This cannot be undone.</b></p>
                {status === 'published' && <p>If you only want to hide the article, use Unpublish instead.</p>}
                <Notes stage={stage} unsaved={unsaved} />
                <div className="ad-dialog-actions">
                  <button type="button" className="ad-btn" onClick={close} disabled={working} autoFocus>Cancel</button>
                  {status === 'published' && (
                    <button type="button" className="ad-btn" onClick={() => run('unpublish')} disabled={working || (stage.at === 'confirm' && (stage.loading || Boolean(stage.error)))}>
                      Unpublish
                    </button>
                  )}
                  <button type="button" className="ad-btn ad-btn--danger" onClick={() => run('delete')} disabled={working || blocked}>
                    {working ? stage.label : status === 'draft' ? 'Delete draft' : 'Delete permanently'}
                  </button>
                </div>
              </>
            ) : stage.kind === 'unpublish' ? (
              <>
                <h2 id={`lc-${place}-${slug}`}>Unpublish article?</h2>
                <p className="ad-dialog-subject">{title}</p>
                <p>
                  It becomes a draft and leaves the blog, the sitemap and <code>/blog/{slug}</code> once the site has
                  redeployed. Its text and images are kept, and it can be published again.
                </p>
                <Notes stage={stage} unsaved={false} />
                <div className="ad-dialog-actions">
                  <button type="button" className="ad-btn" onClick={close} disabled={working} autoFocus>Cancel</button>
                  <button type="button" className="btn btn-dark" onClick={() => run('unpublish')} disabled={working || (stage.at === 'confirm' && (stage.loading || Boolean(stage.error)))}>
                    {working ? stage.label : 'Unpublish'}
                  </button>
                </div>
              </>
            ) : (
              <>
                <h2 id={`lc-${place}-${slug}`}>Publish article?</h2>
                <p className="ad-dialog-subject">{title}</p>
                <p>
                  It is checked as the editor checks it, then goes live at <code>/blog/{slug}</code> once the site has
                  redeployed.
                </p>
                <div className="ad-dialog-actions">
                  <button type="button" className="ad-btn" onClick={close} disabled={working} autoFocus>Cancel</button>
                  <button type="button" className="btn btn-dark" onClick={() => run('publish')} disabled={working}>
                    {working ? stage.label : 'Publish'}
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </dialog>
    </>
  );
}

function Notes({ stage, unsaved }: { stage: Stage; unsaved?: boolean }) {
  if (stage.at !== 'confirm') return null;
  const i = stage.impact;
  return (
    <>
      {stage.loading && <p className="ad-hint">Checking what else uses this article…</p>}
      {stage.error && <p className="ad-dialog-error" role="alert">{stage.error}</p>}
      {i && i.sharedWith.length > 0 && stage.kind === 'delete' && (
        <p className="ad-dialog-error" role="alert">
          Cannot delete: {i.sharedWith.join(', ')} {i.sharedWith.length === 1 ? 'uses' : 'use'} images from this
          article&rsquo;s folder. Change {i.sharedWith.length === 1 ? 'that article' : 'those articles'} first.
        </p>
      )}
      {i && i.linkedFrom.length > 0 && (
        <p className="ad-dialog-warn">
          Linked from {i.linkedFrom.join(', ')}. Those links will stop working until they are changed.
        </p>
      )}
      {unsaved && stage.kind === 'delete' && <p className="ad-dialog-warn">Your unsaved changes in the editor will be lost.</p>}
    </>
  );
}

const doneTitle = (kind: Kind, status: Status) =>
  kind === 'publish' ? 'Published' : kind === 'unpublish' ? 'Unpublished' : status === 'draft' ? 'Draft deleted' : 'Article deleted';
