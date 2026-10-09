import MediaLibrary from '@/components/admin/MediaLibrary';
import { requireSession } from '@/lib/admin/session';
import { catalog } from '@/lib/cms/catalog';
import { getStore } from '@/lib/cms/store';

/**
 * Images the CMS manages: public/blog/<article>/<image>, and nothing else.
 * Listing and uploading only — no deletion, because the CMS cannot be sure
 * an image is unused by every published article.
 */
export default async function Media() {
  await requireSession();
  const store = getStore();
  const [paths, entries] = store ? await Promise.all([store.listImages(), catalog(store)]) : [[], []];
  const images = paths.map((p) => {
    const [, , folder, file] = p.split('/');
    return { src: `/${p.slice('public/'.length)}`, folder, file };
  });

  return (
    <>
      <div className="ad-head">
        <div>
          <span className="eyebrow">Media</span>
          <h1 className="ad-h1">Images</h1>
          <p className="ad-sub">{images.length} image{images.length === 1 ? '' : 's'} in public/blog/{store ? ` · ${store.describe}` : ''}</p>
        </div>
      </div>
      {!store && <p className="ad-note ad-note--warn">Not connected to GitHub, so images cannot be listed or uploaded on this deployment.</p>}
      <MediaLibrary
        images={images}
        folders={entries.filter((e) => !e.error).map((e) => ({ slug: e.slug, title: e.meta.title ?? e.slug }))}
        storeKind={store?.kind ?? null}
      />
    </>
  );
}
