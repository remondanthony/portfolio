import { SOURCES, type Keyword } from '@/lib/seo/keywords';

const NA = <span className="ad-na">Not available</span>;
const num = (v: number | undefined, f: (x: number) => string = (x) => x.toLocaleString('en')) => (v === undefined ? NA : f(v));

/**
 * Research side by side. Google Trends interest sits in its own column with
 * its place, range and comparison set, because a 0–100 relative score and a
 * monthly search volume measure different things and must never be read as
 * the same number.
 */
export default function ComparePanel({ keywords }: { keywords: Keyword[] }) {
  const rows = keywords.filter((k) => k.trends || k.planner || k.volume !== undefined || k.difficulty !== undefined || k.volumeRange);
  return (
    <section className="ad-panel" data-testid="compare">
      <h2>Compare research</h2>
      <p className="ad-hint">
        Google Trends is relative interest (0–100 within one Trends report). Keyword Planner gives average monthly searches and Google Ads
        competition (not SEO difficulty). Entered and imported figures carry their own source.
        They answer different questions, so they are shown side by side, not combined.
      </p>
      {rows.length === 0 ? <p className="ad-hint">Save research to compare it here.</p> : (
        <div className="ad-table-wrap">
          <table className="ad-table ad-research-table">
            <thead>
              <tr>
                <th scope="col">Keyword</th>
                <th scope="col">Google Trends interest</th>
                <th scope="col">Keyword Planner avg. monthly searches</th><th scope="col">Keyword Planner competition</th>
                <th scope="col">Entered / imported volume</th><th scope="col">KD</th><th scope="col">CPC</th>
                <th scope="col">Source of those figures</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((k) => (
                <tr key={k.id} data-keyword={k.keyword}>
                  <td><b>{k.keyword}</b>{(k.country || k.location) && <span className="ad-hint ad-block">{[k.location, k.country].filter(Boolean).join(' · ')}</span>}</td>
                  <td>
                    {k.trends ? (
                      <>
                        {k.trends.average}/100 avg · peak {k.trends.peak}
                        <span className="ad-hint ad-block">{k.trends.geo || 'Worldwide'} · {k.trends.range} · relative to {k.trends.comparedWith.join(', ')}</span>
                      </>
                    ) : NA}
                  </td>
                  <td>
                    {k.planner?.volume !== undefined ? k.planner.volume.toLocaleString('en') : k.planner?.volumeRange ?? NA}
                    {k.planner && <span className="ad-hint ad-block">{k.planner.location ?? 'Location not recorded'} · {k.planner.importedAt.slice(0, 10)}</span>}
                  </td>
                  <td>{k.planner?.competition ? `${k.planner.competition}${k.planner.competitionIndex !== undefined ? ` · ${k.planner.competitionIndex}` : ''}` : k.planner?.competitionIndex !== undefined ? `index ${k.planner.competitionIndex}` : NA}</td>
                  <td>{k.volume !== undefined ? k.volume.toLocaleString('en') : k.volumeRange ?? NA}</td>
                  <td>{num(k.difficulty)}</td>
                  <td>{num(k.cpc, (x) => x.toFixed(2))}</td>
                  <td>{k.volume !== undefined || k.difficulty !== undefined || k.cpc !== undefined || k.volumeRange ? SOURCES[k.source] : NA}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
