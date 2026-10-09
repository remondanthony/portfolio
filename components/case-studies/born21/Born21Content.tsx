import Flow from '../Flow';
import Shot from '../Shot';

const ENGINE = [
  { name: 'Research' },
  { name: 'Search Intent' },
  { name: 'Content Structure' },
  { name: 'SEO Optimization' },
  { name: 'Ghost CMS' },
  { name: 'Publish' },
  { name: 'Indexing' },
  { name: 'Monitoring' },
];

/**
 * What Ghost does, in the terms the Born21 code actually implements: only
 * published, public posts are read; each becomes a static page with its own
 * metadata and sitemap entry; and a build that cannot reach Ghost fails
 * rather than shipping a site with its articles missing.
 *
 * "Live with the next build" is deliberately not "instantly". Webhook-
 * triggered publishing is designed but not switched on; today a new post goes
 * live with the next push, manual run or daily scheduled build.
 */
const FACTS = [
  ['Written in Ghost', 'Articles are drafted, edited and published in Ghost — a dedicated publishing tool, not the website’s code.'],
  ['Built into the site', 'Each build reads only published, public posts through Ghost’s Content API and turns them into static pages, each with its own title, description and canonical URL.'],
  ['Live with the next build', 'New articles go live with the next deployment, and the daily scheduled build picks up anything published since the last one.'],
];

export default function Born21Content() {
  return (
    <section aria-labelledby="cs-content">
      <div className="wrap">
        <div className="svc-head reveal">
          <div>
            <span className="eyebrow"><span className="n">05</span> Content engine</span>
            <h2 id="cs-content" className="title" style={{ marginTop: '18px' }}>Publishing <b>without friction.</b></h2>
          </div>
          <p className="lead" style={{ margin: 0, maxWidth: '480px' }}>
            The workflow joins content planning, SEO structure and Ghost publishing to ongoing search monitoring.
          </p>
        </div>

        <div className="cs-gap">
          <Flow steps={ENGINE} label="The content workflow, from research to monitoring" cols={4} />
        </div>

        <div className="cs-split cs-gap">
          <Shot
            src="/case-studies/born21/insights.jpg"
            alt="The Born21 Insights page, headed “Insights”, featuring the article “Why Most Brands Fail on YouTube: 7 Mistakes Holding Back Growth”, dated October 7, 2026."
            width={2000}
            height={1250}
            sizes="(min-width: 1280px) 700px, (min-width: 900px) 58vw, 92vw"
            chrome="born21.com/insights"
            label="Born21 Insights"
            caption="The live Insights section. Every article on it is written in Ghost and published as a static page."
          />
          <dl className="cs-facts reveal">
            {FACTS.map(([k, v]) => (
              <div key={k}>
                <dt>{k}</dt>
                <dd>{v}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  );
}
