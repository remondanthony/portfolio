'use client';

import { useState } from 'react';
import { uploadImage, type UploadResult } from '@/lib/cms/actions';

type Img = { src: string; folder: string; file: string };

/**
 * The image grid and the upload form. Previews load from the live site, so an
 * image committed through GitHub shows once Vercel has deployed it; until
 * then the card says so rather than showing a broken image.
 */
export default function MediaLibrary({ images: initial, folders, storeKind }: {
  images: Img[];
  folders: { slug: string; title: string }[];
  storeKind: 'github' | 'local' | null;
}) {
  const [images, setImages] = useState(initial);
  const [sizes, setSizes] = useState<Record<string, [number, number]>>({});
  const [missing, setMissing] = useState<Record<string, boolean>>({});
  const [filter, setFilter] = useState('');
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
      const r = await uploadImage(new FormData(form));
      setResult(r);
      if (r.ok) {
        const [, , folder, file] = r.src.split('/');
        setImages((list) => [...list, { src: r.src, folder, file }].sort((a, b) => a.src.localeCompare(b.src)));
        setSizes((s) => ({ ...s, [r.src]: [r.width, r.height] }));
        form.reset();
      }
    } catch (e) {
      setResult({ ok: false, message: `Could not reach the server: ${(e as Error).message}` });
    } finally {
      setBusy(false);
    }
  };

  const shown = images.filter((i) => !filter || i.folder === filter);

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
      </div>

      {shown.length === 0 ? (
        <div className="ad-empty"><p>No images yet.</p></div>
      ) : (
        <ul className="ad-media">
          {shown.map((img) => {
            const size = sizes[img.src];
            const figure = size ? `<Figure src="${img.src}" alt="Describe the image" width={${size[0]}} height={${size[1]}} />` : null;
            return (
              <li key={img.src} className="ad-media-card">
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
                  <span className="ad-hint">{img.folder}{size ? ` · ${size[0]}×${size[1]}` : ''}</span>
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
