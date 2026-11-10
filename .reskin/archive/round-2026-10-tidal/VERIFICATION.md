# Reskin verification — PASS

Generated: 2026-10-21T19:26:52.484Z

- Project: **gradix-website**
- URL: http://127.0.0.1:3000/
- Original skeleton: `topnav-marketing` (marketing)
- New skeleton: `split-stage` (spatial)
- Accent: #e5293f -> #1e7be8 (112.84 ΔE; min 30)
- Source contract: intact (`82f8ea197f7b`)

| Route | Result | DOM similarity | Landmark similarity | Axe serious | Screenshot |
|---|---|---:|---:|---:|---|
| `/` | PASS | 0.261 | 0.6 | 0 | [desktop](current/home-desktop.png) |
| `/app` | PASS | 0.388 | 0.333 | 0 | [desktop](current/app-desktop.png) |
| `/offers` | PASS | 0.255 | 0.667 | 0 | [desktop](current/offers-desktop.png) |
| `/docs` | PASS | 0.087 | 0.375 | 0 | [desktop](current/docs-desktop.png) |
| `/card/[mint]` | PASS | — | — | — | — |

## Blocking issues

- None.

## Warnings

- /: numeric token count changed: 93 -> 98 (dynamic values may differ)
- /app: numeric token count changed: 170 -> 221 (dynamic values may differ)
- /app: aria attribute added: aria-label=Search cards
- /offers: numeric token count changed: 0 -> 6 (dynamic values may differ)
- /docs: numeric token count changed: 44 -> 49 (dynamic values may differ)

## Thresholds

- DOM fingerprint similarity <= 0.5
- Landmark sequence similarity <= 0.68
- CSS class overlap <= 0.1
- Accent distance >= 30 ΔE
- Contrast failures <= 0
- Axe serious/critical <= 0

All content is compared as a multiset of visible words plus rendered attribute values. Reordering is allowed, rewriting/removing/adding visible copy is not. Dynamic numeric values are reported as warnings, never silently accepted.
