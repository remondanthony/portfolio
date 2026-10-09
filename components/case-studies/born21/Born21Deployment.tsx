import Flow from '../Flow';

/**
 * Straight from .github/workflows/deploy.yml in the Born21 repository.
 *
 * SSH is in the story, not on the line. The first approach deployed over SSH
 * from GitHub's hosted runners; the commit history records the network, SSH
 * and runner diagnostics that followed, and the move to a self-hosted runner.
 * Drawing SSH as a live stage would describe a pipeline that no longer runs.
 */
const PIPELINE = [
  { name: 'Git / GitHub', note: 'A change is pushed' },
  { name: 'GitHub Actions', note: 'The workflow starts' },
  { name: 'Self-hosted Runner', note: 'Checks, builds and syncs' },
  { name: 'Hostinger', note: 'Production files updated' },
  { name: 'Born21.com', note: 'Live, and verified' },
];

const CHECKS = [
  'Confirms the Ghost connection is configured',
  'Installs exact, locked dependencies',
  'Type-checks and lints the code',
  'Builds the static site',
  'Verifies the homepage and Insights were generated',
  'Confirms the production directory exists',
  'Syncs to Hostinger, with a limit on deletions',
  'Verifies the deployed files are in place',
];

export default function Born21Deployment() {
  return (
    <section aria-labelledby="cs-deploy">
      <div className="wrap">
        <div className="svc-head reveal">
          <div>
            <span className="eyebrow"><span className="n">07</span> Deployment automation</span>
            <h2 id="cs-deploy" className="title" style={{ marginTop: '18px' }}>From code <b>to production.</b></h2>
          </div>
          <p className="lead" style={{ margin: 0, maxWidth: '460px' }}>
            Every release follows the same path, and nothing reaches the live site until it has passed every check on the way.
          </p>
        </div>

        <div className="cs-gap">
          <Flow steps={PIPELINE} label="The deployment pipeline, from GitHub to born21.com" />
        </div>

        <div className="cs-deploy cs-gap">
          <div className="cs-panel reveal">
            <h3>Checked before it ships</h3>
            <ol className="cs-checks">
              {CHECKS.map((c) => <li key={c}>{c}</li>)}
            </ol>
            <p className="cs-panel-foot">
              Runs on every push to the main branch, on demand, and once a day. Only one deployment
              runs at a time.
            </p>
          </div>

          <div className="cs-panel cs-panel--quiet reveal">
            <h3>Getting it working</h3>
            <p>
              The deployment needed real engineering, not a template. Connecting to Hostinger took
              network, SSH and runner diagnostics before the workflow moved to a self-hosted runner,
              with its labels configured to match.
            </p>
            <p>
              Permissions are kept narrow: the workflow has read-only access to the repository, and the
              Ghost credentials are stored as secrets in GitHub&rsquo;s production environment, never in
              the code.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
