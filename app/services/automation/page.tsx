import type { Metadata } from 'next';
import Flow from '@/components/case-studies/Flow';
import ServiceShell from '@/components/services/ServiceShell';
import ServiceHero from '@/components/services/ServiceHero';
import ServiceFaq from '@/components/services/ServiceFaq';
import ServiceLinks from '@/components/services/ServiceLinks';
import { serviceJsonLd, serviceMetadata } from '@/lib/services';

/**
 * Business automation — workflow automation, deliberately not "AI".
 *
 * Two of the three workflow examples are systems Vioniche runs today:
 * Born21's deployment pipeline (from its case study) and this site's own
 * publishing flow and contact form. The third is labelled as an example.
 * Only platforms Vioniche has actually integrated are named.
 */
const TITLE = 'Business Automation Services — Workflows & APIs | Vioniche';
const DESCRIPTION =
  'Business automation services that turn repetitive work into reliable workflows: lead handling, form processing, reporting, data sync and API integrations.';

export const metadata: Metadata = serviceMetadata('automation', TITLE, DESCRIPTION);

const CANDIDATES = [
  ['Repetitive', 'It happens every day or every week, in much the same way each time.'],
  ['Rule-based', 'The steps can be written down: when this arrives, check that, then send it there.'],
  ['Error-prone by hand', 'Copying, retyping and remembering — the places small mistakes come from.'],
  ['Time-sensitive', 'A delay costs something: an enquiry waiting for a reply, a report needed first thing on Monday.'],
];

const OPPORTUNITIES = [
  {
    name: 'Leads & enquiries',
    text: 'Every enquiry captured, routed to the right person and acknowledged — without someone watching an inbox.',
    points: ['Form submissions delivered', 'Notifications to the right person', 'Automatic acknowledgements', 'Entries in a CRM or sheet'],
  },
  {
    name: 'Forms & data processing',
    text: 'Submissions checked, cleaned and sent to where they belong, instead of being copied over by hand.',
    points: ['Validation', 'Spam filtering', 'Records written to your tools', 'Attachments handled'],
  },
  {
    name: 'Reporting',
    text: 'The weekly numbers gathered from each tool and delivered in one place, on schedule.',
    points: ['Scheduled reports', 'Data from several sources', 'Summaries by email', 'Exceptions highlighted'],
  },
  {
    name: 'Content & publishing',
    text: 'From an approved draft to a live page without manual steps in between.',
    points: ['CMS publishing', 'Automated builds and deploys', 'Sitemap updates', 'Scheduled rebuilds'],
  },
  {
    name: 'Data synchronisation',
    text: 'The same customer, order or record kept consistent across the tools that need it.',
    points: ['API integrations', 'Webhooks', 'Scheduled sync jobs', 'Conflict checks'],
  },
  {
    name: 'Administrative tasks',
    text: 'The small recurring chores that add up to hours each week.',
    points: ['Reminders and follow-ups', 'Status updates', 'File organisation', 'Routine notifications'],
  },
];

const BORN21 = [
  { name: 'Git / GitHub', note: 'A change is pushed' },
  { name: 'GitHub Actions', note: 'The workflow starts' },
  { name: 'Checks & build', note: 'Type checks, build, verification' },
  { name: 'Hostinger', note: 'Files synced, with a deletion limit' },
  { name: 'born21.com', note: 'Live, and verified' },
];

const PUBLISHING = [
  { name: 'Write', note: 'Drafted in the site’s own CMS' },
  { name: 'Check', note: 'Validation and SEO checks' },
  { name: 'Commit', note: 'One GitHub commit, through a GitHub App' },
  { name: 'Build', note: 'Vercel builds the change' },
  { name: 'Live', note: 'In the blog and the sitemap' },
];

const ENQUIRY = [
  { name: 'Form submitted', note: 'On the website' },
  { name: 'Validated', note: 'Required fields, spam check' },
  { name: 'Routed', note: 'To the right inbox or CRM' },
  { name: 'Acknowledged', note: 'Automatic reply to the sender' },
  { name: 'Followed up', note: 'Reminder if nobody has replied' },
];

const INTEGRATIONS = [
  ['APIs & webhooks', 'Connections to any tool with a documented API, triggered by events or on a schedule.', ['REST', 'Webhooks']],
  ['GitHub', 'Actions workflows, GitHub Apps and repository automation for content and deployment.', ['Actions', 'GitHub Apps']],
  ['Content platforms', 'Ghost through its Content API, and Git-based content published from a custom editor.', ['Ghost', 'MDX']],
  ['Email delivery', 'Transactional email through a delivery provider, with a fallback when it fails.', ['Resend', 'Fallbacks']],
  ['Hosting & deployment', 'Builds and deploys to Vercel, or to existing servers from a self-hosted runner.', ['Vercel', 'Hostinger']],
  ['Scheduled jobs', 'Work that runs on a timetable — nightly rebuilds, weekly reports, regular syncs.', ['Schedules', 'Cron']],
] as const;

const APPROACH = [
  { name: 'Map the process', note: 'As it actually runs today' },
  { name: 'Choose what to automate', note: 'Most repetition, least judgement' },
  { name: 'Build', note: 'With logging and error handling' },
  { name: 'Test on real data', note: 'Including the awkward cases' },
  { name: 'Launch & monitor', note: 'Alerts when a step fails' },
  { name: 'Document & hand over', note: 'You know how it works' },
];

const RELIABILITY = [
  'Inputs checked before anything acts on them',
  'Every run logged',
  'A person alerted when a step fails',
  'Retries only where repeating is safe',
  'Limits on anything that deletes or overwrites',
  'Credentials stored as secrets, never in code',
  'Permissions kept to what each workflow needs',
  'One run at a time where order matters',
];

const FAQS = [
  {
    q: 'What is the difference between automation and AI automation?',
    a: <>Automation follows rules you can write down: when a form arrives, check it, send it here, reply there. AI automation adds a step that has to read or interpret something — an email, a document — where fixed rules are not enough. Most workflows need only the first; <a href="/services/ai-automation">AI automation</a> covers when the second is worth it.</>,
  },
  {
    q: 'Do we have to replace the tools we already use?',
    a: 'Usually not. Workflows connect to your existing tools through their APIs. If a tool cannot be connected reliably, you will hear that before anything is built, along with the alternatives.',
  },
  {
    q: 'What happens when something breaks?',
    a: 'Workflows are built to fail visibly: each run is logged, and a person is alerted when a step fails, so a problem is noticed the same day rather than discovered weeks later in missing data.',
  },
  {
    q: 'Should we use an off-the-shelf integration tool instead?',
    a: 'Sometimes that is the right answer, and you will be told so. Custom workflows make sense when volume, cost, data handling or the need for control outgrow what a general-purpose connector does well.',
  },
  {
    q: 'How do we start?',
    a: 'Write down the tasks your team repeats every week and roughly how long each takes. That list, and a short conversation about how the work actually flows, is enough to see what is worth automating first.',
  },
];

const JSON_LD = serviceJsonLd('automation', {
  name: 'Business Automation',
  serviceType: 'Business process automation',
  description: DESCRIPTION,
});

export default function AutomationPage() {
  return (
    <ServiceShell jsonLd={JSON_LD} contact={{ eyebrow: '10', title: <>Find what <b>you can automate.</b></>, type: 'Business automation' }}>
      <ServiceHero
        current="automation"
        keyword="Business automation services"
        title={<>Turn repetitive work into <b>reliable systems.</b></>}
        lead="Copying data between tools, chasing form submissions, rebuilding the same report every week — work like this is predictable, which means it can usually be automated. Vioniche builds workflows that run on their own, say when something fails, and stay easy to change."
        cta="Find What You Can Automate"
        secondary={{ href: '#examples', label: 'See real workflows' }}
      />

      <hr className="divider" />

      <section aria-labelledby="au-what">
        <div className="wrap">
          <div className="sv-head reveal">
            <div>
              <span className="eyebrow"><span className="n">01</span> What to automate</span>
              <h2 id="au-what" className="title" style={{ marginTop: '18px' }}>Not everything. <b>The right things.</b></h2>
            </div>
            <p className="lead">
              A task is a good candidate when it is all four of these. Work that needs fresh judgement every
              time, or that happens twice a year, is usually better left as it is.
            </p>
          </div>
          <ul className="cs-areas">
            {CANDIDATES.map(([name, text], i) => (
              <li key={name} className="reveal" style={{ transitionDelay: `${i * 70}ms` }}>
                <span className="cs-obj-n">{String(i + 1).padStart(2, '0')}</span>
                <h3>{name}</h3>
                <p>{text}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="cs-soft" aria-labelledby="au-opps">
        <div className="wrap">
          <div className="svc-head wwd-head reveal">
            <div>
              <span className="eyebrow"><span className="n">02</span> Opportunities</span>
              <h2 id="au-opps" className="title" style={{ marginTop: '18px' }}>Where the hours <b>usually go.</b></h2>
            </div>
            <p className="lead" style={{ margin: 0 }}>
              Six areas where most businesses repeat the same steps by hand — and where a workflow can take them over.
            </p>
          </div>
          <ol className="wwd-list">
            {OPPORTUNITIES.map((o, i) => (
              <li key={o.name} className="wwd-item">
                <div className="wwd-name">
                  <span className="wwd-no" aria-hidden="true">{String(i + 1).padStart(2, '0')}</span>
                  <h3>{o.name}</h3>
                </div>
                <div className="wwd-detail">
                  <p className="wwd-text">{o.text}</p>
                  <ul className="wwd-points">{o.points.map((p) => <li key={p}>{p}</li>)}</ul>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section id="examples" className="cs-dark" aria-labelledby="au-examples">
        <div className="wrap">
          <div className="cs-head reveal">
            <div>
              <span className="eyebrow"><span className="n">03</span> Workflow examples</span>
              <h2 id="au-examples" className="cs-dark-title">Workflows <em>running today.</em></h2>
            </div>
            <p className="cs-dark-lead">
              The first two are systems Vioniche built and runs now. The third is the shape of a typical enquiry
              workflow, shown as an example.
            </p>
          </div>

          <div className="sv-body">
            <h3 className="sv-flow-title reveal">Born21 · from a code change to the live site</h3>
            <Flow steps={BORN21} label="Born21's deployment pipeline, from GitHub to born21.com" tone="dark" />
            <p className="sv-flow-note reveal">
              Runs on every push, on demand and once a day; nothing reaches the live site until every check has
              passed. <a href="/case-studies/born21">Read the Born21 case study</a>.
            </p>
          </div>

          <div className="sv-body">
            <h3 className="sv-flow-title reveal">This website · publishing an article</h3>
            <Flow steps={PUBLISHING} label="Publishing an article on vioniche.com, from the CMS to the live blog" tone="dark" />
            <p className="sv-flow-note reveal">
              The whole change lands in one commit or not at all, and the published article appears in the blog
              and the sitemap with the next build. No one edits files by hand.
            </p>
          </div>

          <div className="sv-body">
            <h3 className="sv-flow-title reveal">Example · handling a new enquiry</h3>
            <Flow steps={ENQUIRY} label="An example enquiry workflow, from form submission to follow-up" tone="dark" />
            <p className="sv-flow-note reveal">
              Illustrative. The shape changes with the business — which tools hold your customers, who replies,
              how quickly.
            </p>
          </div>
        </div>
      </section>

      <section aria-labelledby="au-int">
        <div className="wrap">
          <div className="sv-head reveal">
            <div>
              <span className="eyebrow"><span className="n">04</span> Integrations</span>
              <h2 id="au-int" className="title" style={{ marginTop: '18px' }}>Connected to <b>the tools you use.</b></h2>
            </div>
            <p className="lead">Named where Vioniche has built them already; anything else with a documented API can be connected the same way.</p>
          </div>
          <div className="svc-grid">
            {INTEGRATIONS.map(([name, text, tags], i) => (
              <div key={name} className="card reveal">
                <div className="no">{String(i + 1).padStart(2, '0')}</div>
                <h3 style={{ marginTop: '14px' }}>{name}</h3>
                <p>{text}</p>
                <div className="tags">{tags.map((t) => <b key={t}>{t}</b>)}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="cs-soft" aria-labelledby="au-approach">
        <div className="wrap">
          <div className="sv-head reveal">
            <div>
              <span className="eyebrow"><span className="n">05</span> Approach</span>
              <h2 id="au-approach" className="title" style={{ marginTop: '18px' }}>Mapped first, <b>then built.</b></h2>
            </div>
            <p className="lead">Automating a process nobody has written down only makes its problems faster. The work starts with how things really happen today.</p>
          </div>
          <div className="sv-body">
            <Flow steps={APPROACH} label="How Vioniche approaches an automation project" />
          </div>
          <div className="wwd-cta reveal" style={{ marginTop: '56px' }}>
            <p>Have a task your team repeats every week?</p>
            <a className="proj-link wwd-cta-link" href="#contact">Find What You Can Automate <span className="dot" aria-hidden="true">→</span></a>
          </div>
        </div>
      </section>

      <section aria-labelledby="au-rel">
        <div className="wrap">
          <div className="sv-head reveal">
            <div>
              <span className="eyebrow"><span className="n">06</span> Reliability &amp; monitoring</span>
              <h2 id="au-rel" className="title" style={{ marginTop: '18px' }}>Built to <b>fail safely.</b></h2>
            </div>
            <p className="lead">An automation that breaks silently is worse than none. These are part of every workflow, not extras.</p>
          </div>
          <div className="cs-deploy sv-body">
            <div className="cs-panel reveal">
              <h3>Safeguards in every workflow</h3>
              <ul className="cs-checks">{RELIABILITY.map((r) => <li key={r}>{r}</li>)}</ul>
            </div>
            <div className="cs-panel cs-panel--quiet reveal">
              <h3>A fallback, not a black hole</h3>
              <p>
                The contact form on this page is a small example. It delivers through an email provider; if that
                provider is unavailable, your own email app opens with the message already filled in, so an enquiry
                is never lost behind a thank-you note.
              </p>
              <p>
                Born21’s deployment works the same way at a larger scale: limits on what a sync may delete, checks
                after every deploy, and only one deployment at a time.
              </p>
            </div>
          </div>
        </div>
      </section>

      <ServiceFaq no="07" title={<>Questions <b>about automation.</b></>} faqs={FAQS} />

      <ServiceLinks
        no="08"
        soft
        eyebrow="Connected services"
        title={<>Where automation <b>goes next.</b></>}
        cards={[
          { href: '/services/ai-automation', kicker: 'When rules are not enough', title: 'AI Automation', text: 'For the steps that need reading or interpreting — documents, emails, requests — with people reviewing what matters.', go: 'Explore AI automation' },
          { href: '/services/web-development', kicker: 'Where workflows start', title: 'Web Development', text: 'Forms, CMS publishing and integrations designed into the website from the start rather than bolted on.', go: 'Explore web development' },
        ]}
      />
    </ServiceShell>
  );
}
