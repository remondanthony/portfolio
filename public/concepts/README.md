# Concept photography

Eight images, one per industry concept in the Industries section. Drop them
here with these exact names and they appear automatically — `concepts.ts`
already declares the `photo` field and `IndustryPreview` already renders it.

| File | Concept | Wants |
|---|---|---|
| `fitness.jpg`    | Ironhaus    | Athlete mid-lift, dark gym, hard side light |
| `restaurant.jpg` | Sedge       | Plated dish, warm low light, shallow depth |
| `healthcare.jpg` | Brightwell  | Clinician with a patient, bright and calm |
| `boutique.jpg`   | Halden      | Editorial fashion, neutral set, full length |
| `beauty.jpg`     | Aurelle     | Skincare bottle or portrait, beige, soft light |
| `realestate.jpg` | Ashcombe    | Architectural exterior at dusk, warm windows |
| `education.jpg`  | Beanstalk   | Student working, natural light, unposed |
| `law.jpg`        | Marchmont   | Office interior or detail, charcoal, restrained |

Roughly 800x600 is plenty — each renders at about 90x70 CSS pixels inside the
browser frame, so anything larger is wasted bytes. Save as JPEG around q78.

Until a file exists, that slot falls back to a layered light-and-grain
treatment. Nothing breaks; it just looks less photographic.

## Licensing

Whatever goes here ships on a commercial site, so it needs a licence that
covers that. Unsplash's licence does and requires no attribution. Placeholder
services (LoremFlickr, Picsum) do not — they serve unstable URLs and
CC-licensed images with varying attribution terms.
