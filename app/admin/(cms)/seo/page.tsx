import SeoNav from '@/components/admin/seo/SeoNav';
import { requireSession } from '@/lib/admin/session';
import { loadLibrary, projectContent } from '@/lib/cms/seo-data';
import { getCurrentProject } from '@/lib/cms/projects';
import { getStore } from '@/lib/cms/store';
import { editHref, findCannibalisation, keywordUsage, type SeoItem } from '@/lib/seo/content';
import { normalizeKeyword } from '@/lib/seo/keywords';

/**
 * The SEO overview: counts, cannibalisation, and the gaps worth fixing next.
 * Everything is computed from the repository's own files on each visit —
 * nothing is stored separately, so it cannot go stale.
 */
export default async function SeoOverview() {
  await requireSession();
  const project = await getCurrentProject();
  const store = getStore(project);
  if (!store) {
    return <p className="ad-note ad-note--warn">{project.github ? `Not connected to GitHub, so ${project.name}'s SEO data cannot be read on this deployment.` : `${project.name}'s GitHub repository is not configured: ${project.githubProblem}`}</p>;
  }
  const [lib, { items, pages }] = await Promise.all([loadLibrary(store), projectContent(project, store)]);
  const usage = keywordUsage(items);
  const cannibal = findCannibalisation(items);
  const withPrimary = items.filter((i) => i.seo.primaryKeyword?.trim());
  const missingPrimary = items.filter((i) => !i.seo.primaryKeyword?.trim());
  const multi = [...usage.entries()].filter(([, u]) => new Set(u.map((x) => `${x.item.kind}:${x.item.id}`)).size > 1);
  const unused = lib.data.keywords.filter((k) => k.status !== 'archived' && !usage.has(normalizeKeyword(k.keyword)));

  const stats: [string, number][] = [
    ['Total keywords', lib.data.keywords.length],
    ['Primary keywords', lib.data.keywords.filter((k) => k.type === 'primary').length],
    ['Secondary keywords', lib.data.keywords.filter((k) => k.type === 'secondary').length],
    ['Topic clusters', lib.data.clusters.length],
    ...(project.features.pageSeo ? [
      ['Pages with primary keywords', withPrimary.length],
      ['Pages missing primary keywords', missingPrimary.length],
      ['Potential cannibalization issues', cannibal.length],
    ] as [string, number][] : []),
  ];

  return (
    <>
      <div className="ad-head">
        <div>
          <span className="eyebrow" data-testid="project-eyebrow">SEO · {project.name}</span>
          <h1 className="ad-h1">SEO overview</h1>
          <p className="ad-sub">Keyword Planner → keyword library → a primary keyword per page → title, H1 and content → publish → Search Console.</p>
        </div>
        <a className="btn btn-dark" href="/admin/seo/keywords">Keywords <span className="dot">→</span></a>
      </div>
      <SeoNav current="/admin/seo" project={project} />
      {(lib.error || pages.error) && <p className="ad-note ad-note--error">{lib.error ?? pages.error}</p>}

      <div className="ad-stats ad-stats--seo">
        {stats.map(([label, n]) => <div key={label} className="ad-stat"><span>{label}</span><b>{n}</b></div>)}
      </div>

      {!project.features.pageSeo ? (
        <p className="ad-note" data-testid="project-scope-note">
          {project.name}: keyword library, clusters and research only, stored in {store.describe}. Page SEO, articles and Search Console are not set up for {project.name} in this step.
          {!lib.version && ' No keyword data has been saved for this project yet.'}
        </p>
      ) : (<>
      <div className="ad-section-head"><h2>Potential keyword cannibalization</h2></div>
      {cannibal.length === 0 ? (
        <p className="ad-note">No two pages or articles share a primary keyword.</p>
      ) : (
        <table className="ad-table ad-seo-table" data-testid="cannibalization">
          <thead><tr><th scope="col">Keyword</th><th scope="col">Page 1</th><th scope="col">Page 2</th><th scope="col">Status</th></tr></thead>
          <tbody>
            {cannibal.map((c) => (
              <tr key={c.keyword}>
                <td data-label="Keyword"><b>{c.keyword}</b></td>
                <td data-label="Page 1"><ItemLink item={c.items[0]} /></td>
                <td data-label="Page 2">
                  <ItemLink item={c.items[1]} />
                  {c.items.length > 2 && <span className="ad-hint"> and {c.items.length - 2} more: {c.items.slice(2).map((i) => i.name).join(', ')}</span>}
                </td>
                <td data-label="Status">
                  <span className={`ad-pill ${c.live > 1 ? 'ad-pill--invalid' : 'ad-pill--draft'}`}>
                    {c.live > 1 ? 'Potential keyword cannibalization' : 'Only one is live'}
                  </span>
                  <span className="ad-hint ad-block">{c.items.map((i) => `${i.name}: ${i.status}`).join(' · ')}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <div className="ad-section-head"><h2>SEO opportunities</h2></div>
      <div className="ad-opps">
        <Opportunity title="Pages without a primary keyword" empty="Every page and article has one." items={missingPrimary.map((i) => ({ key: i.id, node: <ItemLink item={i} /> }))} />
        <Opportunity title="Pages without meta descriptions" empty="None." items={items.filter((i) => !i.hasDescription).map((i) => ({ key: i.id, node: <ItemLink item={i} /> }))} />
        <Opportunity title="Pages with missing SEO titles" empty="None." items={items.filter((i) => !i.hasTitle).map((i) => ({ key: i.id, node: <ItemLink item={i} /> }))} />
        <Opportunity
          title="Keywords assigned to multiple pages"
          empty="No keyword is used on more than one page."
          items={multi.map(([k, u]) => ({
            key: k,
            node: <><b>{u[0].item.seo.primaryKeyword && normalizeKeyword(u[0].item.seo.primaryKeyword) === k ? u[0].item.seo.primaryKeyword : k}</b> <span className="ad-hint">— {u.map((x) => `${x.item.name} (${x.role})`).join(', ')}</span></>,
          }))}
        />
        <Opportunity
          title="Keywords with no associated content"
          empty="Every keyword in the library is used somewhere."
          items={unused.map((k) => ({ key: k.id, node: <><b>{k.keyword}</b>{k.location && <span className="ad-hint"> · {k.location}</span>} <a className="ad-link" href={`/admin/seo/keywords?assign=${k.id}`}>Assign</a></> }))}
        />
      </div>
      </>)}
    </>
  );
}

function ItemLink({ item }: { item: SeoItem }) {
  return (
    <span>
      <a className="ad-title-link" href={editHref(item)}>{item.name}</a> <code>{item.path}</code>
      <span className="ad-hint"> · {item.kind === 'page' ? 'Page' : 'Article'} · {item.status}</span>
    </span>
  );
}

function Opportunity({ title, empty, items }: { title: string; empty: string; items: { key: string; node: React.ReactNode }[] }) {
  return (
    <section className="ad-panel">
      <h2>{title} <span className="ad-count-pill">{items.length}</span></h2>
      {items.length === 0 ? <p className="ad-hint">{empty}</p> : <ul className="ad-opp-list">{items.slice(0, 25).map((i) => <li key={i.key}>{i.node}</li>)}</ul>}
      {items.length > 25 && <p className="ad-hint">And {items.length - 25} more.</p>}
    </section>
  );
}
