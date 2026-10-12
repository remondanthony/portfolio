import SeoNav from '@/components/admin/seo/SeoNav';
import { requireSession } from '@/lib/admin/session';
import { loadLibrary, projectContent } from '@/lib/cms/seo-data';
import { getCurrentProject } from '@/lib/cms/projects';
import { getStore } from '@/lib/cms/store';
import ProjectNotice from '@/components/admin/ProjectNotice';
import { editHref, findCannibalisation } from '@/lib/seo/content';
import { normalizeKeyword } from '@/lib/seo/keywords';

/** Every page and article with its keyword brief, and what is missing. */
export default async function SeoPagesList() {
  await requireSession();
  const project = await getCurrentProject();
  const store = getStore(project);
  if (!project.features.pageSeo) return <ProjectNotice project={project} what="Page and article SEO" />;
  if (!store) return <p className="ad-note ad-note--warn">Not connected to GitHub, so SEO data cannot be read on this deployment.</p>;
  const [lib, { pages, items }] = await Promise.all([loadLibrary(store), projectContent(project, store)]);
  const clashing = new Set(findCannibalisation(items).flatMap((c) => c.items.map((i) => `${i.kind}:${i.id}`)));
  const cluster = (id?: string) => lib.data.clusters.find((c) => c.id === id)?.name;
  const inLibrary = new Set(lib.data.keywords.map((k) => normalizeKeyword(k.keyword)));

  return (
    <>
      <div className="ad-head">
        <div>
          <span className="eyebrow" data-testid="project-eyebrow">SEO · {project.name}</span>
          <h1 className="ad-h1">Pages &amp; articles</h1>
          <p className="ad-sub">Code-built pages are edited here; articles in the article editor. Neither needs keyword data to stay published.</p>
        </div>
      </div>
      <SeoNav current="/admin/seo/pages" project={project} />
      {pages.error && <p className="ad-note ad-note--error">{pages.error}</p>}
      <table className="ad-table ad-seo-table">
        <thead>
          <tr>
            <th scope="col">Page</th>
            <th scope="col">Primary keyword</th>
            <th scope="col">Secondary · related</th>
            <th scope="col">Intent · location</th>
            <th scope="col">Cluster</th>
            <th scope="col"><span className="ad-sr">Edit</span></th>
          </tr>
        </thead>
        <tbody>
          {items.map((i) => {
            const pk = i.seo.primaryKeyword?.trim();
            return (
              <tr key={`${i.kind}:${i.id}`} data-item={`${i.kind}:${i.id}`}>
                <td data-label="Page">
                  <a className="ad-title-link" href={editHref(i)}>{i.name}</a>
                  <span className="ad-hint ad-block"><code>{i.path}</code> · {i.kind === 'page' ? 'Page' : 'Article'} · {i.status}</span>
                </td>
                <td data-label="Primary keyword">
                  {pk ? (
                    <>
                      <b>{pk}</b>
                      {!inLibrary.has(normalizeKeyword(pk)) && <span className="ad-hint ad-block">Not in the keyword library</span>}
                      {clashing.has(`${i.kind}:${i.id}`) && <span className="ad-warn-text ad-block">Potential keyword cannibalization</span>}
                    </>
                  ) : <span className="ad-pill ad-pill--draft">Missing SEO data</span>}
                </td>
                <td data-label="Secondary · related">{(i.seo.secondaryKeywords?.length ?? 0)} · {(i.seo.relatedKeywords?.length ?? 0)}</td>
                <td data-label="Intent · location">{[i.seo.searchIntent, i.seo.targetLocation].filter(Boolean).join(' · ') || '—'}</td>
                <td data-label="Cluster">{cluster(i.seo.cluster) ?? '—'}</td>
                <td className="ad-actions"><a href={editHref(i)}>Edit SEO</a></td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </>
  );
}
