# Reskin report — Gemmora website and X/Twitter kit (round 2)

Generated: 2026-11-10 (Asia/Shanghai)
Project: `E:\workspace\chuangye\solana\8crypt\website`
Verification: `website/.reskin/VERIFICATION.md` · `website/.reskin/verification.json`
Series lint: `twitter/gemmora-x-series.md` (writex lint, 0 errors / 0 warnings)

> The UI was rebuilt around **Abyss Liquidity** / **Terminal Console**; the original
> **split-stage** shell and palette were removed while the content contract stayed
> byte-for-byte intact.

## Direction

| | |
|---|---|
| Style | **Abyss Liquidity** (`aave-abyss`, dark-technical) |
| Source DNA | https://aave.com — live sampled, 1534 ms, 8/10 blockchain references reachable |
| Skeleton | **Terminal Console** (`terminal-console`, linear) |
| Original skeleton | `split-stage` (spatial) — the previous Tidal Sui round |
| Original accent | `#1e7be8` (cobalt) on `#f5faff` ice |
| New accent | `#ff3b30` / text `#ff8a80` on `#06090d` |
| Accent distance | **128.41 ΔE** (threshold 30) |
| Seed | `f34492a9bd107dfd0fb9ec1f8d2e1bb7b4709eb9bc9120af083a326b581c9519` |

The selector sampled the public blockchain references, scored every catalog
direction for perceptual distance from the ice/cobalt identity, and chose Abyss
Liquidity paired with a Terminal Console skeleton. The catalog's sampled accent
(`#ff0000`) was shifted one step to `#ff3b30` so it stays inside the red family
while small mono text on near-black clears 4.5:1; the tint `#ff8a80` is used
wherever red sits on a panel.

The previous round's evidence (Tidal Sui / Split Stage baseline, screenshots,
verification) was archived to `website/.reskin/archive/round-2026-10-tidal/`
before this round's baseline was captured. The baseline for this round is the
Tidal UI; the original content contract is unchanged across both rounds.

## Skeleton: what changed

The Tidal round was a two-column stage: a sticky 38% narrative column with the
wordmark, index, page thesis and actions, and a 62% scrolling data stage, all
on ice with cobalt accents.

The console round has no side column and no hero block. Every route is:

1. a 38px sticky **status bar** — wordmark, numbered route commands, X link and
   the page action (Launch app / Sign in);
2. a full-bleed **command line** carrying the eyebrow, the `h1`, the lede, the
   actions and the meta row;
3. a **console body** of hairline-separated panes (index / data / spec) where
   the data is the hero: stats ledgers, slab rails, data tables, spec panels;
4. a bottom strip — the footer columns on marketing routes, a slim status strip
   on product routes.

Per route:

| Route | Composition |
|---|---|
| `/` | command line · feature ledger left · stat strip, slab rail, 4-step table, FAQ and closing CTA centre · plate, fee flow, token spec and security ledger right |
| `/app` | command line · view tabs left · search command row + 48-row card ledger centre · status strip |
| `/offers` | command line · live-source label left · three numbered offer bands centre · status strip |
| `/docs` | command line · on-this-page index left · full-width article with tables, steps and FAQs |
| `/card/[mint]` | command line with value readout · slab + facts ledger + offer ledger |
| `not-found` | command line · copy + actions · footer |

`components/Tidal.tsx` (SplitLayout, IndexBar, BrandBar, SiteFooter) was deleted
and replaced by `components/Console.tsx`. The old `tx-*` stylesheet was replaced
by the `gx-*` console stylesheet; no `tx-` class or token remains in the render
path. `components/AppHeader.tsx` (already unused) was deleted as well.

## Content lock

- Source contract hash: **`092563533e7e`**
- Source audit: 0 removed tokens, 0 added tokens, 0 additive warnings.
- Rendered parity: every route at 1440×900 and 390×844 has the identical
  multiset of visible words, attributes and form fields as the baseline.
- All copy was moved, never retyped; the only new visible marks are decorative
  numerals (`01`, `02`, …), hairline rules and glyphs (`→`, `⇄`, `·`), none of
  which are content tokens.

Because the home page's title and lede are passed as JSX fragments rather than
string props, the Next.js source extractor sees them as text nodes exactly as
before — that was the one source-contract failure in the first check run, fixed
before the final pass.

## Gate results

| Gate | Result | Detail |
|---|---|---|
| Source contract | PASS | 0 removed, 0 added |
| Skeleton | PASS | `split-stage` (spatial) → `terminal-console` (linear) |
| Accent distance | PASS | 128.41 ΔE (min 30) |
| Route health | PASS | 4 static routes + 1 dynamic skip, all 200, no console/page errors |
| DOM similarity | PASS | 0.206 – 0.397 (max 0.50) |
| Landmark similarity | PASS | 0.500 – 0.600 (max 0.68) |
| CSS class overlap | PASS | **0.000** on every route (max 0.10) |
| Contrast | PASS | 0 failures at 1440 and 390 |
| Axe WCAG 2.x | PASS | 0 serious/critical on every route |
| Labels / alt / names | PASS | 0 field, image or control issues |
| Keyboard focus | PASS | visible focus indicator during tab traversal |
| Mobile navigation | PASS | all route targets visible at 390 px |
| Horizontal overflow | PASS | none at 390 px |
| Build | PASS | `next build`, all routes |

Remaining warnings are all `aria-*` moves (footer/status landmark labels, the
removed docs "On this page" label) plus a numeric-token count change on
`/offers`, where the old literal `01/02/03` kickers became CSS counters.

## Screenshots

Baseline (Tidal, before): `website/.reskin/baseline/{home,app,offers,docs}-{desktop,mobile}.png`
Current (console, after): `website/.reskin/current/{home,app,offers,docs}-{desktop,mobile}.png`

The pairs were inspected side by side. The before/after share no landmark
silhouette: the ice ground, cobalt accent, sticky left narrative column, centred
hero and soft card grids are gone; the new pages open on a black status bar and
a full-width running head, and every route reads as a pane-based terminal.

## Accessibility and responsive work

- One `h1` per route; sections use `h2`/`h3` in order; tables use `th scope="row"`.
- Focus-visible ring on every control; the mobile command bar is keyboard
  reachable and scrolls horizontally with a fade mask.
- Labels for the search input and the USDC amount; icon-only controls carry
  `aria-label`; decorative numerals and glyphs are `aria-hidden`.
- `prefers-reduced-motion` disables non-essential motion.
- 390px is a single column: command line, stacked panes, two-column stat grid,
  horizontal rail and command bar, no document overflow.
- Body text ≥ 12px (13–15px for prose), all text pairs clear 4.5:1.

## X / Twitter kit

The kit was rebuilt against the same direction rather than recoloured, and a
new 10-post series was written with the writex skill (`@halyte_rh` voice).

- `twitter/gemmora-x-series.md` — 10 posts, D0→D12, 4 image posts + 6 text-only,
  media briefs and alt text for every visual. `writex` lint: **0 errors,
  0 warnings**; copy lengths 21–260.
- `twitter/bio.txt` — new 144-character bio, three alternates, field notes.
- `twitter/tweet.md` — the pinned post (series `01`), image order and alt text.
- `twitter/logo.png` / `logo-400.png` — console monogram: white `G` on
  near-black with a red caret; the same render now supplies the site's
  `public/mark.png`, `icon.png` and `apple-icon.png`, so the timeline avatar and
  the site header cannot drift apart.
- `twitter/banner.png` — left claim / right escrowed-offer window, copy kept in
  the upper-left safe area above X's profile-photo overlap.
- `twitter/images/tweet-1-gap.png` — two sales vs one swap.
- `twitter/images/tweet-2-desk.png` — a real 1600×900 capture of the reskinned
  swap desk.
- `twitter/images/tweet-3-steps.png` — find, lock, accept, cancel.
- `twitter/images/tweet-4-states.png` — four offer states, three exits.
- All assets regenerated with `python twitter/src/build.py`; the four old tweet
  pages and PNGs were deleted. `python twitter/src/check_copy.py` passes
  (182/280 pinned post, 144/160 bio).

## Files

New: `components/Console.tsx`, `website/.reskin/tools/summary.mjs`,
`website/.reskin/WIREFRAME.md`, `twitter/gemmora-x-series.md`,
`twitter/src/{tweet-1-gap,tweet-2-desk,tweet-3-steps,tweet-4-states}.html`.

Rewritten: `app/globals.css`, `app/layout.tsx`, `app/page.tsx`,
`app/docs/page.tsx`, `app/card/[mint]/page.tsx`, `app/not-found.tsx`,
`components/Brand.tsx`, `components/AppBrowser.tsx`, `components/OffersBoard.tsx`,
`components/OfferRow.tsx`, `components/CardOffers.tsx`, `components/OfferModal.tsx`,
`components/auth.tsx`, `twitter/src/shared.css`, `twitter/src/build.py`,
`twitter/src/logo.html`, `twitter/src/banner.html`, `twitter/src/profile-mock.html`,
`twitter/bio.txt`, `twitter/tweet.md`, `twitter/README.md`, root `README.md`.

Deleted: `components/Tidal.tsx`, `components/AppHeader.tsx`, the old `tx-*`
global stylesheet contents, `twitter/src/tweet-{1-hero,2-how,3-escrow,4-product}.html`,
`twitter/images/tweet-{1-hero,2-how,3-escrow,4-product}.png`.

## Known limitations

- The `/card/[mint]` route is dynamic; the browser sweep skips it (as before) and
  its source contract is still covered by the build and the source audit.
- The desktop right-hand spec pane is a document-flow rail, not a sticky
  inspector, so on `/` the rail ends slightly before the centre column and the
  closing band runs full width beneath it.
- Numeric-only decorations (CSS counters, command numbers `01–05`) are
  presentation, not content; the `01/02/03` literals on `/offers` were replaced
  by counters, which is the single numeric-token warning in the report.
- The site mark bitmap changed as part of the X avatar rebuild; every `src`,
  `alt` and metadata string is unchanged.
- The handle and domain are not registered and `$GEMMORA` has no mint; the kit
  says so in `09` and marks the address as `[TBD]` rather than inventing one.
- Trademark clearance and the real domain/handle registration are outside scope.
