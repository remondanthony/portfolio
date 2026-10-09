import { CONTACT_HREF } from './links';

/**
 * The call to action that appears over a blog article once it has been half
 * read.
 *
 * Copy lives in named templates, so a family of CTAs can grow — one for SEO
 * articles, one for websites, one for automation — without touching the
 * component or any article. Every article gets `general` unless it says
 * otherwise; an article may also override individual fields:
 *
 *   cta: { title: '…', buttonHref: '/case-studies/born21' }
 *
 * To add a template, add an entry here and it becomes valid in articles.
 */

export type CtaContent = {
  eyebrow: string;
  title: string;
  description: string;
  buttonText: string;
  buttonHref: string;
  supportingText: string;
  /** A site image path, e.g. /mac.png. Shown with next/image. */
  image: string;
  imageAlt: string;
};

export const CTA_TEMPLATES = {
  general: {
    eyebrow: 'VIONICHE',
    title: 'Ready to grow your business online?',
    description: 'Let’s build a website, SEO strategy, or automation system that helps your business grow.',
    buttonText: 'Start a project',
    buttonHref: CONTACT_HREF,
    supportingText: 'No obligation · Let’s talk about your goals',
    // The studio's own laptop-and-phone mockup of the Vioniche site.
    image: '/mac.png',
    imageAlt: 'The Vioniche website shown on a laptop and a phone.',
  },
} satisfies Record<string, CtaContent>;

export type CtaTemplate = keyof typeof CTA_TEMPLATES;

/** What an article may set. Everything is optional; nothing is required to get the default. */
export type CtaOverride = Partial<Pick<CtaContent, 'title' | 'description' | 'buttonText' | 'buttonHref' | 'image' | 'imageAlt'>> & {
  template?: CtaTemplate;
};

export function resolveCta(override?: CtaOverride): CtaContent {
  const base = CTA_TEMPLATES[override?.template ?? 'general'] ?? CTA_TEMPLATES.general;
  const pick = (v: unknown) => (typeof v === 'string' && v.trim() ? v.trim() : undefined);
  return {
    ...base,
    title: pick(override?.title) ?? base.title,
    description: pick(override?.description) ?? base.description,
    buttonText: pick(override?.buttonText) ?? base.buttonText,
    buttonHref: pick(override?.buttonHref) ?? base.buttonHref,
    // A new image without its own alt text keeps nothing from the old one.
    image: pick(override?.image) ?? base.image,
    imageAlt: pick(override?.image) ? pick(override?.imageAlt) ?? '' : base.imageAlt,
  };
}

const LOCAL_IMAGE = /^\/[a-z0-9/_.-]+\.(jpe?g|png|webp|avif)$/i;

/** Rules for an article's `cta`, in the blog model's wording. */
export function ctaProblems(cta: unknown): string[] {
  if (cta === undefined) return [];
  if (!cta || typeof cta !== 'object' || Array.isArray(cta)) return ['cta must be an object'];
  const c = cta as Record<string, unknown>;
  const out: string[] = [];
  const keys = ['template', 'title', 'description', 'buttonText', 'buttonHref', 'image', 'imageAlt'];
  for (const k of Object.keys(c)) if (!keys.includes(k)) out.push(`cta.${k} is not a CTA field (use: ${keys.join(', ')})`);
  for (const k of keys) if (c[k] !== undefined && typeof c[k] !== 'string') out.push(`cta.${k} must be text`);
  if (typeof c.template === 'string' && !(c.template in CTA_TEMPLATES)) {
    out.push(`cta.template must be one of: ${Object.keys(CTA_TEMPLATES).join(', ')}`);
  }
  if (typeof c.buttonHref === 'string' && c.buttonHref && !/^(\/(?!\/)|https:\/\/)/.test(c.buttonHref)) {
    out.push('cta.buttonHref must be a site path (/…) or an https:// address');
  }
  if (typeof c.image === 'string' && c.image) {
    if (!LOCAL_IMAGE.test(c.image) || c.image.includes('..')) out.push('cta.image must be a site image path like /blog/slug/cta.jpg');
    if (!(typeof c.imageAlt === 'string' && c.imageAlt.trim())) out.push('cta.image needs cta.imageAlt');
  }
  return out;
}
