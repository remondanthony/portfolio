import Flow from '../Flow';

/**
 * The whole system on one line.
 *
 * Ghost sits first because content is where the work starts, but it is not
 * pushed into Git: the build reads published posts from Ghost's Content API.
 * The lead says so, so the diagram is not read as something it is not.
 */
const SYSTEM = [
  { name: 'Ghost CMS', note: 'Articles are written and published' },
  { name: 'Git / GitHub', note: 'The site’s source code' },
  { name: 'GitHub Actions', note: 'Checks and builds each release' },
  { name: 'Self-hosted Runner', note: 'Runs the deployment' },
  { name: 'Hostinger', note: 'Production hosting' },
  { name: 'Born21.com', note: 'The live website' },
  { name: 'Google Search Console', note: 'How Google sees the result' },
];

export default function Born21System() {
  return (
    <section className="cs-dark cs-system" aria-labelledby="cs-system">
      <div className="wrap">
        <div className="cs-head reveal">
          <div>
            <span className="eyebrow"><span className="n">04</span> The system</span>
            <h2 id="cs-system" className="cs-dark-title">From a draft to <em>search.</em></h2>
          </div>
          <p className="cs-dark-lead">
            One workflow connects content, source control, deployment and search monitoring. Each build
            reads the latest published articles from Ghost, combines them with the code on GitHub, and
            ships the result to production — where Search Console watches how Google picks it up.
          </p>
        </div>

        <Flow steps={SYSTEM} label="The Born21 system, from content to search monitoring" tone="dark" />
      </div>
    </section>
  );
}
