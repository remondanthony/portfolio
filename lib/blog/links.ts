/**
 * Every internal destination an article can point to, in one place.
 *
 * All of these exist today: the homepage sections by their anchors, and the
 * Born21 case study. An article names them by key (`services: ['process']`)
 * rather than by URL, so if a section ever moves to its own page, it changes
 * here once and every article follows.
 *
 * Add a destination only when its route exists.
 */

export const SERVICES = {
  whatWeDo: {
    href: '/#services',
    title: 'What we do',
    text: 'Website development, SEO, automation, and AI automation, planned as one connected system.',
  },
  services: {
    // The standards section. #services is now the "What we do" section above it.
    href: '/#standards',
    title: 'What every project includes',
    text: 'Fast, responsive, findable from day one, and still supported after launch.',
  },
  process: {
    href: '/#process',
    title: 'How a project runs',
    text: 'Discover, strategy, design, then build and launch.',
  },
  work: {
    href: '/#work',
    title: 'Selected work',
    text: 'Websites designed, built and launched by Vioniche.',
  },
  // The service pages. Text matches each page's own summary.
  webDevelopment: {
    href: '/services/web-development',
    title: 'Web development services',
    text: 'Fast, maintainable websites built to be found and to convert.',
  },
  seo: {
    href: '/services/seo',
    title: 'SEO services',
    text: 'Technical SEO, site structure and content that search engines can read.',
  },
  automation: {
    href: '/services/automation',
    title: 'Business automation',
    text: 'Repetitive work turned into reliable, monitored workflows.',
  },
  aiAutomation: {
    href: '/services/ai-automation',
    title: 'AI Automation',
    text: 'Practical AI workflows, automation and human-in-the-loop systems.',
  },
} as const;
export type ServiceKey = keyof typeof SERVICES;

export const CASE_STUDIES = {
  born21: {
    href: '/case-studies/born21',
    title: 'Born21',
    text: 'Website development, technical SEO, content infrastructure and deployment automation for a YouTube growth agency.',
  },
} as const;
export type CaseStudyKey = keyof typeof CASE_STUDIES;

export const CONTACT_HREF = '/#contact';
