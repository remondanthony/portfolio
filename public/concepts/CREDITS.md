# Concept artwork

Eight supplied hero mockups, one per exhibit in the Industries section. Each is
a website design composed into the environment of the business it belongs to,
at 1536×1024 PNG.

These replaced eight Adobe Stock photographs that were licensed and then
removed. The stock licences remain on the Vioniche Adobe account and cost
nothing; no action is needed, but the files are gone from the repo.

| File             | Exhibit     | Brand in the artwork |
| ---------------- | ----------- | -------------------- |
| `fitness.png`    | Fitness     | Stronger             |
| `healthcare.png` | Healthcare  | MedCare              |
| `resturant.png`  | Restaurant  | Tavolo               |
| `boutique.png`   | Boutique    | Luxe                 |
| `beauty.png`     | Beauty      | Aurelle              |
| `realestate.png` | Real Estate | Habitat Realty       |
| `education.png`  | Education   | Learnix              |
| `law.png`        | Law         | Lexora               |

`resturant.png` is spelled as supplied. The code references it exactly, so
re-exporting over that filename keeps working. Renaming it means updating
`photo:` for the restaurant entry in `components/industries/concepts.ts`.

## Provenance is not recorded

Where these came from is not written down anywhere, and it should be. Whoever
inherits this site cannot tell from the files whether they were commissioned,
generated, or licensed — and that question gets asked eventually, usually at
the worst moment. Add a line per image saying how it was made.

## Three things to look at

**Invented statistics are baked into the fitness artwork.** It reads *500+
Active Members*, *20+ Expert Coaches*, *98% Satisfaction Rate*. The law
artwork claims *Proven Results — a track record of success*. Those are exactly
the kind of numbers the rest of this site deliberately refuses to print. They
are legible at the size the section renders. The section header says "None of
these are clients", which frames the whole wall as concept work and carries
most of the weight — but a visitor who reads the numbers before the header
will read them as claims. Worth an edit to the artwork if these are easy to
regenerate.

**Third-party trademarks appear in the boutique artwork.** The books at lower
right are lettered CHANEL, Dior and LOEWE. It is small and incidental set
dressing, but it is a real brand appearing in Vioniche's own marketing for a
business that has no relationship with it.

**Retina is capped by the source.** The real-estate exhibit renders 1152px
wide at desktop, so a 2× display wants 2304px. The source is 1536px, and the
optimiser will not upscale past it — that exhibit shows at roughly 1.33×
rather than 2×. It reads fine; it is simply not as crisp as the smaller
exhibits, which have pixels to spare. A wider export of that one file would
fix it.

## Delivery

The PNGs are 1.7–2MB each and never reach a visitor at that weight.
`next/image` serves resized AVIF (WebP fallback) from a srcset — around 50–80KB
per exhibit — and lazy-loads all eight. The source files are never modified.

Do not pre-grade, darken or vignette a replacement file. Nothing is layered
over the artwork in CSS any more, so what you export is exactly what shows.
