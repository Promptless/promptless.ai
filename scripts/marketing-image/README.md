# Marketing image generator

Generates Linear-style marketing composites: a headline + Promptless logo on a
dark gradient, with a product screenshot floated on the right. Output is sized
to an exact pixel target and compressed under a size cap — handy for app
listings (Microsoft Teams, Slack, etc.) that demand precise dimensions.

## How it works

No browser. The pipeline is intentionally light:

1. The script builds an **SVG** string (gradient background, the screenshot as
   a rounded `<image>`, headline/eyebrow `<text>`, and the logo).
2. **[`@resvg/resvg-js`](https://github.com/yisibl/resvg-js)** rasterizes it,
   using the vendored static Inter TTFs in `fonts/` (passed as font buffers, so
   no system-font install is required).
3. **`sharp`** downscales the 2× render to the exact target size and compresses:
   max-effort PNG → palette-quantized PNG → high-quality JPEG, stopping at the
   first result under `--max-kb`.

### Why static TTFs?

resvg renders SVG `<text>` from real font files. It does **not** read `woff2`
(the only Inter we ship in `public/fonts/`) and it ignores the variable-font
`wght` axis — so a variable TTF renders every weight as Regular. We therefore
vendor static **Inter Regular / SemiBold / Bold** (latin subset, ~66 KB each,
[Google Fonts](https://fonts.google.com/specimen/Inter), OFL — see `fonts/OFL.txt`).

## Usage

```bash
npm run marketing:image -- \
  --headline "Turn conversations|into docs updates" \
  --screenshot public/assets/integrations-page.png \
  --out public/assets/marketing/teams-listing.png \
  --eyebrow "Promptless for Microsoft Teams"
```

Use `|` or `\n` in `--headline` for line breaks. Defaults are already 1366×768
and a 1024 KB cap, so a minimal run only needs `--headline`, `--screenshot`,
`--out`.

### Options

| Flag           | Default                          | Notes                                      |
| -------------- | -------------------------------- | ------------------------------------------ |
| `--headline`   | _(required)_                     | `\|` or `\n` for line breaks               |
| `--screenshot` | _(required)_                     | Product screenshot to embed                |
| `--out`        | _(required)_                     | Output path (`.jpg` if it must fall back)  |
| `--eyebrow`    | _(none)_                         | Small accent label above the headline      |
| `--logo`       | `public/assets/logo_darkbg.svg`  | Any svg/png                                |
| `--width`      | `1366`                           | Exact output width                         |
| `--height`     | `768`                            | Exact output height                        |
| `--max-kb`     | `1024`                           | Size cap; triggers compression fallbacks   |
| `--scale`      | `2`                              | Supersample factor for crispness           |
| `--bg-from`    | `#0b0d12`                        | Gradient start                             |
| `--bg-to`      | `#1b1e27`                        | Gradient end                               |
| `--fg`         | `#ffffff`                        | Headline color                             |
| `--accent`     | `#8ea2ff`                        | Eyebrow color                              |

Paths are resolved relative to the repo root. Committed output lives in
`public/assets/marketing/` and is showcased on the hidden
`/docs/marketing-images` page.
