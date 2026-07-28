import Image from 'next/image';
import { CONCEPTS, type Format } from './industries/concepts';

/**
 * Industries, as an exhibition of supplied hero mockups.
 *
 * Each exhibit is one final PNG: a website design already composed into the
 * environment of the business it belongs to. The artwork is the source of
 * truth and everything here is built around it.
 *
 * That has a consequence worth stating, because it removed a lot of code: the
 * floating website is INSIDE the artwork. This section used to draw its own
 * floating canvas over a photograph, and keeping it would have put a second
 * website on top of a picture that already has one. The canvas, the pool of
 * shade beneath it, the mount board behind the plate and the colour grade over
 * it are all gone for the same reason — the brief asks for no extra
 * background, no added gradients, and no second artwork.
 *
 * Every asset is 1536x1024, so every plate is 3:2 and nothing is ever cropped.
 * Variety comes from scale and placement instead of from shape.
 *
 * next/image does the optimising: the PNGs are 1.7-2MB each and must never
 * reach a visitor at that weight. It serves resized AVIF/WebP from a srcset,
 * keeps them sharp on retina, and lazy-loads them — all from the untouched
 * source files, which stay exactly as supplied.
 */

/** What the plate actually measures, so the browser picks the right source. */
const SIZES: Record<Format, string> = {
  full: '(min-width: 1100px) 1152px, 100vw',
  wide: '(min-width: 1100px) 760px, (min-width: 640px) 50vw, 92vw',
  pair: '(min-width: 1100px) 562px, (min-width: 640px) 50vw, 92vw',
};

export default function Industries() {
  return (
    <section id="industries" className="industries">
      <div className="wrap">
        <header className="ind-head">
          <div className="ind-head-l">
            <span className="ind-eyebrow reveal">02 — Concept work</span>
            <h2 className="ind-title reveal">
              Picture <em>your</em> business here.
            </h2>
          </div>
          <p className="ind-lead reveal">
            None of these are clients. Eight concepts, each shaped by what one
            trade actually needs — yours would be drawn from your own business.
          </p>
        </header>

        <div className="ind-rail" aria-hidden="true" />

        <div className="ind-spread">
          {CONCEPTS.map((c, n) => (
            <figure
              className="exh reveal"
              key={c.key}
              data-ind={c.key}
              data-format={c.format}
              style={{ ['--i' as string]: n }}
            >
              <div className="exh-stage">
                <div className="exh-plate">
                  <Image
                    className="exh-photo"
                    src={c.photo}
                    alt={c.alt}
                    fill
                    sizes={SIZES[c.format]}
                    quality={82}
                  />
                </div>
              </div>

              <figcaption className="exh-caption">
                <span className="exh-index">{String(n + 1).padStart(2, '0')}</span>
                <span className="exh-kicker">Concept — {c.industry}</span>
                <h3>{c.benefit}</h3>
                <p className="exh-story">{c.story}</p>
              </figcaption>
            </figure>
          ))}
        </div>

        <aside className="ind-cta reveal">
          <div>
            <h3>Don&rsquo;t see your industry?</h3>
            <p>We like solving a problem we haven&rsquo;t solved before. Tell us about yours.</p>
          </div>
          <a className="btn btn-accent" href="#contact">
            Discuss your project <span className="dot">&rarr;</span>
          </a>
        </aside>
      </div>
    </section>
  );
}
