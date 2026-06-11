# Marketing image generator

Generates Linear-style marketing composites: a headline + Promptless logo on a
dark gradient, with a product screenshot floated on the right. Output is sized
to an exact pixel target and compressed under a size cap — handy for app
listings (Microsoft Teams, Slack, etc.) that demand precise dimensions.

## How it works

No browser. The layout is real flexbox:

1. **[Satori](https://github.com/vercel/satori)** lays out a flexbox tree and
   emits an SVG (text rendered as vector paths). The headline lives in a
   fixed-width column and **wraps automatically** — no manual text measurement.
2. **[`@resvg/resvg-js`](https://github.com/yisibl/resvg-js)** rasterizes the SVG.
3. **`sharp`** downscales the 2× render to the exact size and compresses:
   max-effort PNG → palette-quantized PNG → high-quality JPEG, stopping at the
   first result under `--max-kb`.

### Why static TTFs?

Satori renders text from real font files and reads **ttf / otf / woff** — not
the `woff2` we ship in `public/fonts/`. So we vendor static **Inter Regular /
SemiBold / Bold** (latin subset, ~66 KB each,
[Google Fonts](https://fonts.google.com/specimen/Inter), OFL — see `fonts/OFL.txt`).

## Usage

```bash
npm run marketing:image -- \
  --headline "Turn conversations|into docs updates" \
  --screenshot public/assets/integrations-page.png \
  --out public/assets/marketing/teams-listing.png \
  --eyebrow "Promptless for Microsoft Teams"
```

`|` (or `\n`) forces a hard line break; otherwise the headline wraps to fit its
column. Defaults are 1366×768 with a 1024 KB cap, so a minimal run only needs
`--headline`, `--screenshot`, `--out`.

### Options

| Flag           | Default                          | Notes                                      |
| -------------- | -------------------------------- | ------------------------------------------ |
| `--headline`   | _(required)_                     | `\|` or `\n` for hard breaks; wraps to fit |
| `--screenshot` | _(required)_                     | Product screenshot to embed                |
| `--out`        | _(required)_                     | Output path (`.jpg` if it must fall back)  |
| `--eyebrow`    | _(none)_                         | Small accent label above the headline      |
| `--logo`       | `public/assets/logo_darkbg.svg`  | Any svg/png                                |
| `--width`      | `1366`                           | Exact output width                         |
| `--height`     | `768`                            | Exact output height                        |
| `--max-kb`     | `1024`                           | Size cap; triggers compression fallbacks   |
| `--scale`      | `2`                              | Supersample factor for crispness           |
| `--bg-top`     | `#15171d`                        | Gradient color at the top (almost black)   |
| `--bg-bottom`  | `#000000`                        | Gradient color at the bottom (pure black)  |
| `--fg`         | `#ffffff`                        | Headline color                             |
| `--accent`     | `#8ea2ff`                        | Eyebrow color                              |

Paths are resolved relative to the repo root. Committed output lives in
`public/assets/marketing/` and is showcased on the hidden
`/docs/marketing-images` page.
