# Swapping a concept photograph

Eight photographs, one per exhibit in the Industries section. They are the
subject of that section — roughly seventy per cent of what a visitor looks at —
so they are worth being fussy about.

## To replace one

Drop your file in here using the **exact existing filename** and nothing else
changes. No code edit, no rebuild step, no config.

| File             | Exhibit     | Plate shape it is cropped into    |
| ---------------- | ----------- | --------------------------------- |
| `fitness.jpg`    | Fitness     | 3:2 landscape                     |
| `healthcare.jpg` | Healthcare  | 4:5 portrait                      |
| `restaurant.jpg` | Restaurant  | 4:5 portrait                      |
| `boutique.jpg`   | Boutique    | 4:5 portrait                      |
| `beauty.jpg`     | Beauty      | 4:5 portrait                      |
| `realestate.jpg` | Real Estate | 21:9 full-bleed — the widest crop |
| `education.jpg`  | Education   | 3:2 landscape                     |
| `law.jpg`        | Law         | 3:2 landscape                     |

If you change a filename, update `photo:` for that entry in
[`components/industries/concepts.ts`](../../components/industries/concepts.ts)
— and update `alt:` in the same object, which describes the picture for screen
readers and is wrong the moment the picture changes.

## What the crop will do to your image

Every plate uses `object-fit: cover`, centred. The image is scaled until it
fills the plate and whatever sticks out is cut off the edges, evenly. So:

- A **landscape** photo in a 4:5 portrait plate loses its left and right sides.
- A **portrait** photo in a 3:2 plate loses its top and bottom.
- The **real estate** plate is 21:9 and will cut a normal photo to a letterbox
  band through the middle.

Keep the subject near the centre and leave room around it. The shapes above are
the desktop crops; below 640px every plate becomes 5:4, so a composition that
only works at one extreme ratio will not survive both.

Also leave the bottom corner quiet. A floating canvas sits over one of the two
bottom corners on every exhibit, so anything important down there is covered.

## Size

About **1600px on the long edge** is the sweet spot. The largest plate on
screen is roughly 760px wide and the full-bleed one matches the viewport, so
1600px covers both at retina density without wasting bytes. JPEG quality
around 68 is indistinguishable here and keeps each file near 150–330KB.

Anything much larger is wasted — these load lazily, but they still load.

## Grading

Do **not** darken, tint or vignette your file. All of that is applied in CSS
(`.exh-grade`, plus a `--gr-tint` per industry in `app/globals.css`), so the
look can be retuned without re-exporting anything. A pre-graded image gets
graded twice and goes muddy.

## Provenance

Whatever you put here, record where it came from in `CREDITS.md`. An image in a
repo with no licence trail is a problem for whoever inherits the site.
