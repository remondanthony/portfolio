import type { Metadata } from 'next';
import Flow from '@/components/case-studies/Flow';
import ServiceShell from '@/components/services/ServiceShell';
import ServiceHero from '@/components/services/ServiceHero';
import ServiceFaq from '@/components/services/ServiceFaq';
import ServiceLinks from '@/components/services/ServiceLinks';
import { serviceJsonLd, serviceMetadata } from '@/lib/services';

/**
 * AI automation — AI inside real workflows, with people where it matters.
 *
 * There is no shipped AI client project to point to yet, so this page does
 * not pretend otherwise: the workflows are presented as examples of what is
 * designed, not as case studies, and nothing claims an accuracy figure, a
 * time saving or a cost. The model provider is not named because it is chosen
 * per project.
 */
const TITLE = 'AI Automation Services — Practical AI Workflows | Vioniche';
const DESCRIPTION =
  'AI automation services for real workflows: document processing, data extraction, support assistance and lead qualification, with human review built in.';

export const metadata: Metadata = serviceMetadata('ai-automation', TITLE, DESCRIPTION);

const HELPS = [
  'Reading emails, PDFs and free-text forms',
  'Extracting fields into structured records',
  'Classifying and routing requests',
  'Summarising long documents and threads',
  'Drafting first versions for a person to edit',
  'Answering questions from your own documents',
];

const NEEDS_PERSON = [
  'Decisions with legal, financial or safety consequences',
  'Anything sent to a customer, until it has earned trust',
  'Facts it cannot check against a source',
  'Steps a simple rule would handle — plain automation is cheaper and predictable',
];

const LEVELS = [
  ['AI assistance', 'A person does the work; AI drafts, summarises or suggests. Nothing happens unless someone chooses to use it.', 'Lowest risk'],
  ['AI inside automation', 'A defined workflow runs on its own, with AI handling one step — reading a document, classifying a request — within rules and checks. Anything outside them goes to a person.', 'The usual fit'],
  ['Autonomous agents', 'AI plans and carries out several steps itself, using tools. Useful for bounded tasks that can be undone; rarely the place to start.', 'Use deliberately'],
];

const EXAMPLES = [
  {
    name: 'Document processing',
    text: 'Invoices, applications or forms read and turned into structured records, with anything unclear set aside for review.',
    points: ['Field extraction', 'Checks against your rules', 'Exceptions flagged', 'Records written to your tools'],
  },
  {
    name: 'Customer-support assistance',
    text: 'Incoming questions sorted by topic, with a reply drafted from your own help content for an agent to check and send.',
    points: ['Categorisation', 'Suggested replies', 'Sources shown to the agent', 'A person sends'],
  },
  {
    name: 'Lead qualification',
    text: 'Each enquiry summarised and compared with criteria you define, so the best fits get a quick, informed reply.',
    points: ['Enquiry summaries', 'Fit against your criteria', 'Routing', 'Follow-up drafts'],
  },
  {
    name: 'Content & research workflows',
    text: 'Research gathered, briefs and outlines prepared, and first drafts written for an editor — never published unread.',
    points: ['Research summaries', 'Briefs and outlines', 'SEO checks', 'Editor approval'],
  },
  {
    name: 'Internal knowledge',
    text: 'Staff ask questions in plain language and get answers drawn from your own documents, with links to where each answer came from.',
    points: ['Answers from your documents', 'Sources cited', 'Access matched to each person', 'Kept up to date'],
  },
  {
    name: 'Reporting',
    text: 'Figures collected automatically, with a plain-language summary of what changed and what looks unusual.',
    points: ['Data from your tools', 'Written summaries', 'Unusual changes highlighted', 'Delivered on schedule'],
  },
];

const ARCHITECTURE = [
  { name: 'Trigger', note: 'An email, a form, a new file' },
  { name: 'Prepare', note: 'Clean the input, remove what the model does not need' },
  { name: 'AI step', note: 'Extract, classify, summarise or draft' },
  { name: 'Validate', note: 'Check the output against rules and formats' },
  { name: 'Review', note: 'A person, when confidence is low or stakes are high' },
  { name: 'Act', note: 'Update a record, send, file' },
  { name: 'Log', note: 'Input, output and decision recorded' },
];

const SAFEGUARDS = [
  'Output checked against rules before it is used',
  'Uncertain results sent to a person',
  'Customer-facing output approved by a person at first',
  'Every run logged with its input and output',
  'Sensitive data kept out of prompts where possible',
  'Access limited to what each workflow needs',
  'Usage and cost monitored',
  'A manual path if the AI service is unavailable',
];

const PROCESS = [
  { name: 'Find the bottleneck', note: 'Where reading and typing take the time' },
  { name: 'Check the data', note: 'What exists, its quality, what is sensitive' },
  { name: 'Prototype', note: 'On your real examples' },
  { name: 'Measure', note: 'Compare with what people decided' },
  { name: 'Build it in', note: 'Inside the workflow, with review' },
  { name: 'Monitor & refine', note: 'Reviews, logs, adjustments' },
];

const FAQS = [
  {
    q: 'Which AI models do you use?',
    a: 'It depends on the task, the data involved and your requirements — usually hosted models from established providers. Workflows are built so the model can be changed later without rebuilding everything around it.',
  },
  {
    q: 'Is our data safe?',
    a: 'Data handling is decided before anything is built: what is sent to a model, what is stored, and under which provider terms. Fields a model does not need can be removed or masked before it sees them, and access is limited to what each workflow needs.',
  },
  {
    q: 'How accurate is it?',
    a: 'It varies by task, which is why accuracy is measured on your own examples before anything goes live, and why uncertain results go to a person instead of being acted on.',
  },
  {
    q: 'Will AI replace our team?',
    a: 'That is not the aim. The work it takes over is the repetitive reading, sorting and typing; decisions, judgement and customer relationships stay with people — who then have more time for them.',
  },
  {
    q: 'Do we need automation in place first?',
    a: <>Often, yes. If a process is not defined, adding AI makes it less predictable, not more. Many projects start with plain <a href="/services/automation">business automation</a> and add an AI step only where rules run out.</>,
  },
  {
    q: 'What does it cost to run?',
    a: 'AI providers charge by usage. An estimate based on your real volumes comes out of the prototype, before you commit to building the full workflow.',
  },
];

const JSON_LD = serviceJsonLd('ai-automation', {
  name: 'AI Automation',
  serviceType: 'AI workflow automation',
  description: DESCRIPTION,
});

export default function AiAutomationPage() {
  return (
    <ServiceShell jsonLd={JSON_LD} contact={{ eyebrow: '10', title: <>Explore <b>an AI workflow.</b></>, type: 'AI automation' }}>
      <ServiceHero
        current="ai-automation"
        keyword="AI automation services"
        title={<>AI that fits the way <b>your business works.</b></>}
        lead="Language models are good at reading, sorting, summarising and drafting — and unreliable when left alone with decisions that matter. Vioniche builds AI into specific steps of your workflows, with checks, and with people approving the output where it counts."
        cta="Explore an AI Workflow"
        secondary={{ href: '/services/automation', label: 'Start with automation' }}
      />

      <hr className="divider" />

      <section aria-labelledby="ai-helps">
        <div className="wrap">
          <div className="sv-head reveal">
            <div>
              <span className="eyebrow"><span className="n">01</span> Where AI helps</span>
              <h2 id="ai-helps" className="title" style={{ marginTop: '18px' }}>Useful in places. <b>Not everywhere.</b></h2>
            </div>
            <p className="lead">The best uses are narrow and specific: a step where someone currently reads, sorts or retypes text all day.</p>
          </div>
          <div className="cs-deploy sv-body">
            <div className="cs-panel reveal">
              <h3>Where AI does well</h3>
              <ul className="cs-checks">{HELPS.map((h) => <li key={h}>{h}</li>)}</ul>
            </div>
            <div className="cs-panel cs-panel--quiet reveal">
              <h3>Where it needs a person</h3>
              <ul className="cs-checks" style={{ gridTemplateColumns: '1fr' }}>{NEEDS_PERSON.map((h) => <li key={h}>{h}</li>)}</ul>
            </div>
          </div>
        </div>
      </section>

      <section className="cs-dark" aria-labelledby="ai-levels">
        <div className="wrap">
          <div className="cs-head reveal">
            <div>
              <span className="eyebrow"><span className="n">02</span> Assistance, automation, autonomy</span>
              <h2 id="ai-levels" className="cs-dark-title">Three ways to use AI. <em>Pick deliberately.</em></h2>
            </div>
            <p className="cs-dark-lead">
              Not every workflow should run on its own. Most businesses get the most from the middle option;
              full autonomy is a choice made for a specific task, not a default.
            </p>
          </div>
          <ul className="cs-objectives sv-cols-3">
            {LEVELS.map(([name, text, tag], i) => (
              <li key={name} className="reveal" style={{ transitionDelay: `${i * 70}ms` }}>
                <span className="cs-obj-n">{String(i + 1).padStart(2, '0')}</span>
                <h3>{name}</h3>
                <p>{text}</p>
                <span className="sv-tag">{tag}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="cs-soft" aria-labelledby="ai-examples">
        <div className="wrap">
          <div className="svc-head wwd-head reveal">
            <div>
              <span className="eyebrow"><span className="n">03</span> Workflow examples</span>
              <h2 id="ai-examples" className="title" style={{ marginTop: '18px' }}>What an AI step <b>can take over.</b></h2>
            </div>
            <p className="lead" style={{ margin: 0 }}>
              Examples of the workflows Vioniche designs. Each one starts from how your team works now, not from a
              model looking for a use.
            </p>
          </div>
          <ol className="wwd-list">
            {EXAMPLES.map((e, i) => (
              <li key={e.name} className="wwd-item">
                <div className="wwd-name">
                  <span className="wwd-no" aria-hidden="true">{String(i + 1).padStart(2, '0')}</span>
                  <h3>{e.name}</h3>
                </div>
                <div className="wwd-detail">
                  <p className="wwd-text">{e.text}</p>
                  <ul className="wwd-points">{e.points.map((p) => <li key={p}>{p}</li>)}</ul>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section aria-labelledby="ai-arch">
        <div className="wrap">
          <div className="sv-head reveal">
            <div>
              <span className="eyebrow"><span className="n">04</span> AI + automation</span>
              <h2 id="ai-arch" className="title" style={{ marginTop: '18px' }}>The model is one step, <b>not the system.</b></h2>
            </div>
            <p className="lead">
              Around every AI step sits ordinary, predictable automation: inputs prepared, outputs checked, and a
              record of what happened. This is the shape most workflows take.
            </p>
          </div>
          <div className="sv-body">
            <Flow steps={ARCHITECTURE} label="Example architecture of an AI workflow, from trigger to log" cols={7} />
          </div>
        </div>
      </section>

      <section className="cs-soft" aria-labelledby="ai-safe">
        <div className="wrap">
          <div className="sv-head reveal">
            <div>
              <span className="eyebrow"><span className="n">05</span> Human review &amp; safeguards</span>
              <h2 id="ai-safe" className="title" style={{ marginTop: '18px' }}>People in the loop, <b>by design.</b></h2>
            </div>
            <p className="lead">AI makes mistakes that look confident. The workflow is built to catch them before they matter.</p>
          </div>
          <div className="cs-deploy sv-body">
            <div className="cs-panel reveal">
              <h3>Safeguards</h3>
              <ul className="cs-checks">{SAFEGUARDS.map((s) => <li key={s}>{s}</li>)}</ul>
            </div>
            <div className="cs-panel cs-panel--quiet reveal">
              <h3>Measured before it is trusted</h3>
              <p>
                A new AI step first runs alongside the existing process, so its output can be compared with what
                people actually decided. It takes over only where it has shown it is reliable.
              </p>
              <p>
                The review step can stay for as long as you want it. Removing it is your decision, made on evidence
                from the logs — never a default.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section aria-labelledby="ai-process">
        <div className="wrap">
          <div className="sv-head reveal">
            <div>
              <span className="eyebrow"><span className="n">06</span> Implementation</span>
              <h2 id="ai-process" className="title" style={{ marginTop: '18px' }}>Proven on your data <b>before it is built.</b></h2>
            </div>
            <p className="lead">A small prototype on real examples shows whether AI is the right tool for the step, what it will cost to run, and how often it needs a person.</p>
          </div>
          <div className="sv-body">
            <Flow steps={PROCESS} label="How an AI workflow is implemented, from finding the bottleneck to monitoring" />
          </div>
          <div className="wwd-cta reveal" style={{ marginTop: '56px' }}>
            <p>Have a step where someone reads and retypes text all day?</p>
            <a className="proj-link wwd-cta-link" href="#contact">Explore an AI Workflow <span className="dot" aria-hidden="true">→</span></a>
          </div>
        </div>
      </section>

      <ServiceFaq no="07" title={<>Questions <b>about AI.</b></>} faqs={FAQS} />

      <ServiceLinks
        no="08"
        soft
        eyebrow="Connected services"
        title={<>Built on <b>solid foundations.</b></>}
        cards={[
          { href: '/services/automation', kicker: 'Start here', title: 'Automation', text: 'Most AI workflows sit inside ordinary automation. If the process is not defined yet, this is the first step.', go: 'Explore business automation' },
          { href: '/services/web-development', kicker: 'Where data comes in', title: 'Web Development', text: 'The forms, portals and admin areas that feed a workflow — and show its results — built into your site.', go: 'Explore web development' },
        ]}
      />
    </ServiceShell>
  );
}
