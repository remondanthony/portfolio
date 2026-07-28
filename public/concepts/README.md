# Swapping a concept mockup

Eight supplied hero mockups, one per exhibit in the Industries section. Each is
the final artwork — the layout is built around these, not the other way round.

## To replace one

Drop your file in here using the **exact existing filename** and nothing else
changes. No code edit, no rebuild step, no config.

| File             | Exhibit     |
| ---------------- | ----------- |
| `fitness.png`    | Fitness     |
| `healthcare.png` | Healthcare  |
| `resturant.png`  | Restaurant  |
| `boutique.png`   | Boutique    |
| `beauty.png`     | Beauty      |
| `realestate.png` | Real Estate |
| `education.png`  | Education   |
| `law.png`        | Law         |

`resturant.png` is spelled as supplied and referenced exactly, so re-exporting
over it keeps working. If you rename it, update `photo:` for the restaurant
entry in
[`components/industries/concepts.ts`](../../components/industries/concepts.ts).

Whatever you change, update `alt:` in the same object. It describes the artwork
for screen readers and for anyone whose images fail to load, and it is wrong
the moment the picture changes.

## Shape

Every current asset is **1536×1024 (3:2)**, and every plate is 3:2 to match, so
nothing is cropped anywhere — measured at 0.00% crop across ten widths from 360
to 1728.

That only holds while the set stays 3:2. A replacement at a different ratio
*will* be cropped, centred, because the plates use `object-fit: cover`. If you
need a different shape, change the plate with it rather than letting it cut the
artwork.

## Size

**Wider than 1536px would help.** The largest exhibit renders 1152px wide, so a
retina display wants 2304px, and the optimiser will not upscale past the
source. Around 2400px on the long edge would make that one exhibit fully sharp;
the other seven already have pixels to spare.

File weight is not a concern — see below.

## Do not pre-grade

Nothing is layered over the artwork in CSS: no gradient, no vignette, no tint,
no mount board behind it. What you export is exactly what shows, so a file that
arrives pre-darkened simply looks darker.

## Delivery is handled

The PNGs are 1.7–2MB each and never reach a visitor at that weight.
`next/image` serves resized AVIF (WebP fallback) from a srcset — roughly
50–80KB per exhibit — and lazy-loads all eight below the fold. The source files
are never modified, so keep them at full quality.

Do not hand-optimise, convert to JPEG, or resize these down. That work happens
at request time, and shrinking the source only lowers the ceiling.

## Provenance

Record where each image came from in `CREDITS.md`. Artwork in a repo with no
trail is a problem for whoever inherits the site.
