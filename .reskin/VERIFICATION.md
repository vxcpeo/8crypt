# Reskin verification — PASS

Generated: 2026-11-09T18:13:12.764Z

- Project: **gemmora-website**
- URL: http://127.0.0.1:4317/
- Original skeleton: `split-stage` (spatial)
- New skeleton: `terminal-console` (linear)
- Accent: #1e7be8 -> #ff3b30 (128.41 ΔE; min 30)
- Source contract: intact (`092563533e7e`)

| Route | Result | DOM similarity | Landmark similarity | Axe serious | Screenshot |
|---|---|---:|---:|---:|---|
| `/` | PASS | 0.397 | 0.6 | 0 | [desktop](current/home-desktop.png) |
| `/app` | PASS | 0.242 | 0.5 | 0 | [desktop](current/app-desktop.png) |
| `/offers` | PASS | 0.206 | 0.5 | 0 | [desktop](current/offers-desktop.png) |
| `/docs` | PASS | 0.393 | 0.6 | 0 | [desktop](current/docs-desktop.png) |
| `/card/[mint]` | PASS | — | — | — | — |

## Blocking issues

- None.

## Warnings

- /: aria attribute added: aria-label=Footer
- /app: aria attribute added: aria-label=Status
- /offers: numeric token count changed: 6 -> 3 (dynamic values may differ)
- /offers: aria attribute added: aria-label=Status
- /docs: aria attribute changed/removed: aria-label=On this page
- /docs: aria attribute added: aria-label=Footer

## Thresholds

- DOM fingerprint similarity <= 0.5
- Landmark sequence similarity <= 0.68
- CSS class overlap <= 0.1
- Accent distance >= 30 ΔE
- Contrast failures <= 0
- Axe serious/critical <= 0

All content is compared as a multiset of visible words plus rendered attribute values. Reordering is allowed, rewriting/removing/adding visible copy is not. Dynamic numeric values are reported as warnings, never silently accepted.
