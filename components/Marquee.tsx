/**
 * The tools strip between Work and Process.
 *
 * Only what Vioniche actually works with, as evidenced in this codebase or
 * its stated process: Next.js, React, TypeScript and Node.js are the stack;
 * GSAP drives the hero; Figma is the design stage of Process; GitHub hosts
 * the code and the CMS publishes through it; Vercel deploys it. Shopify and
 * Webflow were removed — nothing here builds on them, and the standards
 * section promises "no themes, no page builders".
 *
 * Decorative, so hidden from assistive technology. It loops by sliding the
 * track by exactly half its width, so the two halves are identical, and each
 * half repeats the list enough times to be wider than a large screen — one
 * copy alone leaves a blank stretch at the end of each pass on desktop.
 * Copies after the first are marked so reduced motion can show the list once.
 */

const TOOLS = ['Next.js', 'React', 'TypeScript', 'Node.js', 'GSAP', 'Figma', 'GitHub', 'Vercel'];
const SETS_PER_HALF = 3;

export default function Marquee() {
  const half = Array.from({ length: SETS_PER_HALF }, () => TOOLS).flat();
  return (
    <div className="marquee" aria-hidden="true">
      <div className="mq-track">
        {[...half, ...half].map((tool, i) => (
          <span key={i} className={i < TOOLS.length ? undefined : 'mq-dup'}>{tool}</span>
        ))}
      </div>
    </div>
  );
}
