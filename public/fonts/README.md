# Neue Montreal

Pangram Pangram Foundry. Self-hosted `.woff2`, converted from the licensed
`.otf` files in `~/Library/Fonts` with fontTools.

| File | Weight range | Style | Size |
|---|---|---|---|
| `NeueMontreal-Regular.woff2`     | 100–450 | normal | 23 KB |
| `NeueMontreal-Medium.woff2`      | 451–900 | normal | 24 KB |
| `NeueMontreal-LightItalic.woff2` | 100–350 | italic | 26 KB |
| `NeueMontreal-Italic.woff2`      | 351–450 | italic | 26 KB |
| `NeueMontreal-MediumItalic.woff2`| 451–900 | italic | 29 KB |

## Why weight ranges

Only **Regular (400)** and **Medium (500)** upright faces are licensed here,
but the design asks for 300, 600, 700 and 800. Declaring exact weights would
make the browser synthesise the missing ones, and a faked bold at 108px is
visibly smeared. Ranges make it fall to the nearest *real* face instead.

**Consequence:** headings render at Medium where the design specifies 800, so
they are lighter than intended. Licensing **NeueMontreal-Bold** and dropping
it in — then changing the Medium face's range to `451 650` and adding Bold at
`651 900` — is the only way to get the intended weight.

## Regenerating

```sh
python3 -m venv /tmp/fontenv && /tmp/fontenv/bin/pip install fonttools brotli
/tmp/fontenv/bin/python - <<'PY'
from fontTools.ttLib import TTFont
import glob, os
for f in glob.glob(os.path.expanduser('~/Library/Fonts/NeueMontreal-*.otf')):
    font = TTFont(f); font.flavor = 'woff2'
    font.save('public/fonts/' + os.path.basename(f).replace('.otf', '.woff2'))
PY
```

## Licence

Commercial typeface. These files are committed on the basis of a webfont
licence — do not copy them into another project without one.
