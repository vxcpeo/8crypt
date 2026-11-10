# Wireframe — Gemmora console reskin (round 2)

Selected automatically by `choose-style.mjs`:

- **Style:** Abyss Liquidity (`aave-abyss`, dark-technical) — source DNA https://aave.com (live, 1534 ms)
- **Skeleton:** Terminal Console (`terminal-console`, linear) — original was `split-stage` (spatial)
- **Accent:** red family `#ff3b30` / text `#ff8a80` (original accent `#1e7be8`, 145 ΔE away)
- **Ground:** near-black `#05070A` with `#0C141C` panels (original `#f5faff` ice)

## New shell

Name: **Console**. One component file, `components/Console.tsx`.

```
body
└─ .gx-console                     grid rows: status / command / work / hints
   ├─ header.gx-status            30px sticky status bar: wordmark · command nav · tail
   │  ├─ a.gx-sig                  brand + wordmark (existing Brand component)
   │  ├─ nav.gx-commands           route names as numbered commands
   │  └─ div.gx-status-tail        X link + page action (Launch app / Sign in)
   ├─ section.gx-commandline      full-bleed command header: eyebrow, h1, lede, actions, meta
   ├─ div.gx-work                 dense console body: 3 panes separated by hairlines
   │  ├─ nav/div.gx-pane--idx     left: index / filters / section commands
   │  ├─ main.gx-pane--data       centre: the data (tables, rows, ledgers)
   │  └─ aside.gx-pane--spec      right: spec panel (token, plate, detail)
   └─ footer.gx-hints             bottom hint strip: footer columns + legal, or status strip
```

Rules:

- No sticky side column, no 38/62 split, no marketing hero block: the h1 sits in a
  full-width command line and every page body is a console body.
- Navigation lives in the top status bar; the left pane is a section/filter index, not a
  narrative column. On mobile the three panes stack and the status bar scrolls horizontally.
- Data is set with tabular numerals and mono micro-labels; panels are 1px hairlines on
  near-black, radius 8–14px, no soft cards on ice.
- Class prefix `gx-` for every class; token prefix `--gx-`. Zero `tx-` classes remain.

## Route mapping

| Route | Status bar | Command line (h1) | Left pane | Centre pane | Right pane | Hint strip |
|---|---|---|---|---|---|---|
| `/` | marketing commands 01–05, Launch app | "Built on Collector Crypt · Solana" + h1 | feature ledger (4 rows) | 4-stat ledger, slab rail, 4-step table, FAQ console, closing CTA | plate, fee flow, token spec, security ledger | footer columns + legal |
| `/app` | product commands 01–03, Sign in | h1 "Swap cards." + lede + sign-in | view tabs as console menu | search command row, card data table, empty states | — (2-pane) | status strip |
| `/offers` | product commands, Sign in | h1 "Open offers." + lede | live-source label + ticks | three numbered offer bands | — (2-pane) | status strip |
| `/docs` | marketing commands | Docs / Gemmora documentation + h1 | on-this-page command index | article: tables, steps, instruction rows, risk list, FAQ | — (2-pane) | footer columns + legal |
| `/card/[mint]` | product commands, Sign in | card name + value + 3 actions | — | slab panel, facts ledger, offer ledger | — (1-pane) | status strip |
| `not-found` | marketing commands | h1 | — | copy + actions | — | footer |

## Landmarks (gate: LCS similarity ≤ 0.68)

Baseline sequences: `/` aside·nav·main·footer, `/app` aside·nav·main,
`/offers` aside·nav·main, `/docs` aside·nav·nav·main·footer.

New sequences add `header`, a second `nav` (footer columns) and, on `/docs`, a TOC `nav`:
`header·nav·main·footer·nav` → LCS 3 of max 5 = 0.60. Every route keeps one `h1`
and one `main`.

## Components

| File | Fate |
|---|---|
| `components/Tidal.tsx` | **deleted** (old shell: SplitLayout / IndexNav / BrandBar / SiteFooter) |
| `components/Console.tsx` | **new** shell: `Console`, `StatusBar`, `CommandNav`, `CommandLine`, `Pane`, `ConsoleFooter`, `XIconLink`, `XFollowChip` |
| `components/Brand.tsx` | kept as content component, new markup/classes (wordmark split preserved) |
| `app/globals.css` | **replaced** by the console stylesheet (tokens + component grammar) |
| `components/AppBrowser.tsx` | template rewritten, logic untouched |
| `components/OffersBoard.tsx`, `OfferRow.tsx`, `CardOffers.tsx`, `OfferModal.tsx`, `auth.tsx` | markup/classes rewritten, handlers untouched |
| `app/page.tsx`, `app/docs/page.tsx`, `app/app/page.tsx`, `app/offers/page.tsx`, `app/card/[mint]/page.tsx`, `app/not-found.tsx`, `app/layout.tsx` | template rewritten, copy moved verbatim |

## Token file and breakpoints

`app/globals.css` `:root` carries `--gx-void`, `--gx-ground`, `--gx-panel`, `--gx-panel-2`,
`--gx-ink`, `--gx-muted`, `--gx-accent`, `--gx-accent-text`, `--gx-line`, plus display/body/mono
families from STYLE.md. Breakpoints: `1080px` (right pane folds below the data pane),
`860px` (left pane becomes a horizontal command strip), `640px` (single column, status bar
scrolls horizontally, no document overflow).

## Content lock

Every visible token, label, alt text, placeholder, href, route and handler is moved, never
retyped. No new visible copy is introduced; decorative numerals (`01`, `02`, …) and glyphs
(`→`, `⇄`, `·`) are the only additions.
