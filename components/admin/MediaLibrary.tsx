'use client';

import { useState } from 'react';
import { uploadImage, type UploadResult } from '@/lib/cms/actions';

type Img = {
  src: string;
  folder: string;
  file: string;
  bytes: number;
  /** Articles that use it as the featured image / anywhere else. */
  featured: string[];
  used: string[];
};
type Usage = '' | 'used' | 'unused';

const inUse = (i: Img) => i.featured.length + i.used.length > 0;
const kb = (n: number) => (n >= 1024 * 1024 ? `${(n / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(n / 1024))} KB`);

/**
 * The image grid and the upload form. Previews load from the live site, so an
 * image committed through GitHub shows once Vercel has deployed it; until
 * then the card says so rather than showing a broken image.
 */
export default function MediaLibrary({ images: initial, folders, titles, storeKind }: {
  images: Img[];
  folders: { slug: string; title: string }[];
  titles: Record<string, string>;
  storeKind: 'github' | 'local' | null;
}) {
  const [images, setImages] = useState(initial);
  const [sizes, setSizes] = useState<Record<string, [number, number]>>({});
  const [missing, setMissing] = useState<Record<string, boolean>>({});
  const [filter, setFilter] = useState('');
  const [usage, setUsage] = useState<Usage>('');
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<UploadResult | null>(null);
  const [copied, setCopied] = useState('');

  const copy = (text: string, key: string) => {
    navigator.clipboard?.writeText(text).then(() => { setCopied(key); setTimeout(() => setCopied(''), 1500); }, () => {});
  };

  const upload = async (form: HTMLFormElement) => {
    setBusy(true);
    setResult(null);
    try {
      const data = new FormData(form);
      const bytes = (data.get('image') as File | null)?.size ?? 0;
      const r = await uploadImage(data);
      setResult(r);
      if (r.ok) {
        const [, , folder, file] = r.src.split('/');
        // Nothing can reference a file that did not exist a moment ago.
        setImages((list) => [...list, { src: r.src, folder, file, bytes, featured: [], used: [] }].sort((a, b) => a.src.localeCompare(b.src)));
        setSizes((s) => ({ ...s, [r.src]: [r.width, r.height] }));
        form.reset();
      }
    } catch (e) {
      setResult({ ok: false, message: `Could not reach the server: ${(e as Error).message}` });
    } finally {
      setBusy(false);
    }
  };

  const shown = images.filter((i) =>
    (!filter || i.folder === filter) && (!usage || (usage === 'used') === inUse(i)));
  const unused = images.filter((i) => !inUse(i)).length;
  const names = (slugs: string[]) => slugs.map((s) => titles[s] ?? s).join(', ');

  return (
    <>
      <form
        className="ad-panel ad-upload"
        onSubmit={(e) => { e.preventDefault(); upload(e.currentTarget); }}
      >
        <h2>Upload an image</h2>
        <div className="ad-upload-row">
          <label className="field ad-field">
            <span className="ad-label">Article folder</span>
            <select name="slug" required defaultValue="" disabled={!storeKind || !folders.length}>
              <option value="" disabled>Choose an article…</option>
              {folders.map((f) => <option key={f.slug} value={f.slug}>{f.title}</option>)}
            </select>
          </label>
          <label className="field ad-field">
            <span className="ad-label">Image</span>
            <input type="file" name="image" accept="image/jpeg,image/png,image/webp" required disabled={!storeKind} />
          </label>
          <button type="submit" className="btn btn-dark" disabled={busy || !storeKind}>
            {busy ? 'Uploading…' : 'Upload'} <span className="dot">→</span>
          </button>
        </div>
        <p className="ad-hint">JPEG, PNG or WebP, up to 3 MB. Saved to public/blog/&lt;article&gt;/ {storeKind === 'github' ? 'in a GitHub commit' : 'in this checkout'}. A file with the same name is kept and the new one is numbered.</p>
        {result && (
          <p className={`ad-note ${result.ok ? '' : 'ad-note--error'}`} role="status">
            {result.ok
              ? <>Uploaded <code>{result.src}</code> ({result.width}×{result.height}).{result.store === 'github' && ' It will preview here once Vercel has deployed the commit.'}{result.commit?.url && <> <a href={result.commit.url} target="_blank" rel="noopener noreferrer">View commit ↗</a></>}</>
              : result.message}
          </p>
        )}
      </form>

      <div className="ad-filters">
        <label className="field ad-field">
          <span className="ad-label">Article</span>
          <select value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="">All articles</option>
            {[...new Set(images.map((i) => i.folder))].map((f) => <option key={f} value={f}>{f}</option>)}
          </select>
        </label>
        <label className="field ad-field">
          <span className="ad-label">Usage</span>
          <select value={usage} onChange={(e) => setUsage(e.target.value as Usage)} data-usage-filter>
            <option value="">All</option>
            <option value="used">In use</option>
            <option value="unused">Unused ({unused})</option>
          </select>
        </label>
      </div>
      {unused > 0 && (
        <p className="ad-hint ad-media-note">
          &ldquo;Unused&rdquo; means no article mentions the image. It is not deleted automatically — another page or an
          outside link may still point to it — so removing one is a deliberate change in the repository.
        </p>
      )}

      {shown.length === 0 ? (
        <div className="ad-empty"><p>{images.length ? 'No images match these filters.' : 'No images yet.'}</p></div>
      ) : (
        <ul className="ad-media">
          {shown.map((img) => {
            const size = sizes[img.src];
            const figure = size ? `<Figure src="${img.src}" alt="Describe the image" width={${size[0]}} height={${size[1]}} />` : null;
            return (
              <li key={img.src} className="ad-media-card" data-src={img.src} data-usage={inUse(img) ? 'used' : 'unused'}>
                <div className="ad-media-thumb">
                  {missing[img.src] ? (
                    <span className="ad-hint">Not on this deployment yet</span>
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={img.src}
                      alt=""
                      loading="lazy"
                      // An image already in the cache can finish before React attaches
                      // onLoad, so read its size on mount as well.
                      ref={(i) => {
                        if (i && i.complete && i.naturalWidth && !sizes[img.src]) {
                          setSizes((s) => ({ ...s, [img.src]: [i.naturalWidth, i.naturalHeight] }));
                        }
                      }}
                      onLoad={(e) => { const i = e.currentTarget; setSizes((s) => ({ ...s, [img.src]: [i.naturalWidth, i.naturalHeight] })); }}
                      onError={() => setMissing((m) => ({ ...m, [img.src]: true }))}
                    />
                  )}
                </div>
                <div className="ad-media-meta">
                  <b title={img.file}>{img.file}</b>
                  <span className="ad-hint">{img.folder}{size ? ` · ${size[0]}×${size[1]}` : ''}{img.bytes ? ` · ${kb(img.bytes)}` : ''}</span>
                  <span className="ad-media-usage">
                    {img.featured.length > 0 && (
                      <span className="ad-use ad-use--ok" title={names(img.featured)}>✓ Featured image</span>
                    )}
                    {img.used.length > 0 && (
                      <span className="ad-use ad-use--ok" title={names(img.used)}>✓ Used in article</span>
                    )}
                    {!inUse(img) && <span className="ad-use ad-use--warn">⚠ Unused</span>}
                  </span>
                  {inUse(img) && (
                    <span className="ad-hint ad-media-where">
                      In {[...new Set([...img.featured, ...img.used])].map((s, n) => (
                        <span key={s}>{n > 0 && ', '}<a href={`/admin/blog/${s}/edit`}>{titles[s] ?? s}</a></span>
                      ))}
                    </span>
                  )}
                  <span className="ad-media-actions">
                    <button type="button" className="ad-mini" onClick={() => copy(img.src, `p${img.src}`)}>{copied === `p${img.src}` ? 'Copied' : 'Copy path'}</button>
                    {figure && <button type="button" className="ad-mini" onClick={() => copy(figure, `f${img.src}`)}>{copied === `f${img.src}` ? 'Copied' : 'Copy <Figure>'}</button>}
                  </span>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
