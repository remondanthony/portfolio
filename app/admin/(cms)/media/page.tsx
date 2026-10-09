import MediaLibrary from '@/components/admin/MediaLibrary';
import { requireSession } from '@/lib/admin/session';
import { catalog } from '@/lib/cms/catalog';
import { imageUsage } from '@/lib/cms/media';
import { getStore } from '@/lib/cms/store';

/**
 * Images the CMS manages: public/blog/<article>/<image>, and nothing else.
 * Listing, uploading and showing where each image is used — no deletion.
 * "Unused" means no article mentions the image; it does not mean nothing
 * else links to it, so removing one stays a deliberate repository change.
 */
export default async function Media() {
  await requireSession();
  const store = getStore();
  const [stored, entries] = store ? await Promise.all([store.listImages(), catalog(store)]) : [[], []];
  const srcs = stored.map((i) => `/${i.path.slice('public/'.length)}`);
  const usage = imageUsage(srcs, entries);
  const titles = Object.fromEntries(entries.map((e) => [e.slug, e.meta.title ?? e.slug]));
  const images = stored.map((i, n) => {
    const [, , folder, file] = i.path.split('/');
    return { src: srcs[n], folder, file, bytes: i.size, ...usage[srcs[n]] };
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
        titles={titles}
        storeKind={store?.kind ?? null}
      />
    </>
  );
}
