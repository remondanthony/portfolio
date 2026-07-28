import { CONCEPTS } from './industries/concepts';

/**
 * Industries, as an exhibition rather than a grid of previews.
 *
 * Each exhibit is a photograph of a business with a fragment of that
 * business's website floating off it. The photograph is the subject; the
 * website is the smaller object resting on it. That ratio is the whole idea —
 * the visitor is meant to recognise the business first and want the site
 * second.
 *
 * There is no JavaScript in this section any more. The browser chrome, the
 * travelling cursor, the shimmer and the self-scrolling page are all gone:
 * they were what made eight concepts read as eight animations. What replaces
 * them is static, which is why it can be a server component and why the whole
 * section costs nothing to run.
 *
 * The floating canvas is deliberately a CROP, never a small complete site.
 * Its content row is positioned to be cut by the bottom edge and to run past
 * the right edge, so it reads as a piece of something larger. A tidy,
 * fully-contained panel holding a wordmark, a headline and a row would just
 * be a tiny website — the exact thing this rebuild exists to remove.
 */
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
                {/* The float mount: a faintly lit board inset behind the plate,
                    so the photograph stands proud of it on three sides. A real
                    print-framing device rather than a negative margin. */}
                <span className="exh-mount" aria-hidden="true" />

                <div className="exh-plate">
                  <img
                    className="exh-photo"
                    src={c.photo}
                    alt={c.alt}
                    loading="lazy"
                    decoding="async"
                  />
                  <span className="exh-grade" aria-hidden="true" />
                </div>

                {/* A local pool of shade under the floating sheet, sized to its
                    own footprint. Holds the sheet against the photograph
                    without darkening the whole lower third of the image. */}
                <span className="exh-seat" aria-hidden="true" />

                <div className="exh-canvas" aria-hidden="true">
                  <span className="exh-c-mark">{c.brand}</span>
                  <p className="exh-c-line">{c.headline}</p>
                  <span className="exh-c-row">
                    <i>{c.row.label}</i>
                    <b>{c.row.meta}</b>
                  </span>
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
