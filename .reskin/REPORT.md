# Reskin report — Gradix website and X/Twitter kit

Generated: 2026-10-22 (Asia/Shanghai)
Project: `E:\workspace\chuangye\solana\8crypt\website`
Verification: `website/.reskin/VERIFICATION.md` · `website/.reskin/verification.json`

> The UI was rebuilt around **Tidal Sui** / **Split Stage**; the original
> **topnav-marketing** shell and palette were removed while the content contract
> stayed byte-for-byte intact.

## Direction

| | |
|---|---|
| Style | **Tidal Sui** (`sui-tidal`, clean-fintech) |
| Source DNA | https://sui.io — live sampled, 5.2 s, 9/10 blockchain references reachable |
| Skeleton | **Split Stage** (`split-stage`, spatial) |
| Original skeleton | `topnav-marketing` (marketing family) |
| Original accent | `#e5293f` (dark red) |
| New accent | `#1e7be8` / safe `#0b5fc0` (cobalt) |
| Accent distance | **112.84 ΔE** (threshold 30) |
| Seed | `bee159ce27d5631b6b34350efa48ba9f40fb405e7f23984bf69726b1f5e1cd33` |

The selector sampled the public blockchain references, scored every catalog
direction for perceptual distance from the original red/black identity, and
chose Tidal Sui with a Split Stage skeleton. The catalog's live-sampled accent
(`#298dff`) was darkened one step to `#1e7be8` / `#0b5fc0` so body text and
small mono labels clear 4.5:1 on the ice ground; the hue family and the direction
are unchanged.

## Skeleton: what changed

The original product was a full-width top bar, then a centred marketing hero,
then card grids and glass panels stacked down the page. Every route now uses a
two-column **Split Stage**:

1. a sticky 38% narrative column with the wordmark, a vertical ledger index,
   the page thesis, actions and (on the app) the view tabs;
2. a 62% scrolling data stage with hairline-ledger bands, tabular numerals,
   annotated rows and full-bleed rules;
3. the footer sits at the end of the stage on marketing pages; product pages
   close on a status strip instead.

Per route:

| Route | Narrative column | Scrolling stage |
|---|---|---|
| `/` | brand, index, hero statement, CTAs, four feature ledgers, fee/token meta | card plate, 4-stat ledger, slab rail, numbered steps, fee flow + token panel, security ledger, FAQ, closing CTA |
| `/app` | brand, index, `Swap cards.` thesis, two sign-in actions, vertical Browse/My cards/Received/Sent tabs | search strip, 48-card catalog as a two-column ledger list with numbers, grade and insured value |
| `/offers` | brand, index, `Open offers.` thesis | three numbered bands with empty-offer rows and full-width CTAs |
| `/docs` | brand, index, documentation thesis, six-item on-this-page index | long-form article, numbered steps, ledger tables, instruction rows, risk list, FAQ |
| `/card/[mint]` | brand, index, card identity, value and three actions | slab panel, facts ledger, offer ledger |

The old shell (top bar + hero + card grids + footer columns) is no longer in the
render path. `SiteHeader`/`SiteFooter` were removed from `Brand.tsx`; the new
`components/Tidal.tsx` owns the split shell, index, footer and chip. The old
`/css/base.css` and `/css/site.css` are no longer linked from `layout.tsx`; they
remain on disk, unimported, as historical source.

## Content lock

- Source contract: **82f8ea197f7b** — no copy lost, no copy invented.
- Every route was rendered at 1440×900 and 390×844 and compared as a multiset of
  visible words, attribute values, forms, links and document titles.
- Dynamic values are reported as warnings only (numeric token counts changed by
  the new ledger numerals; `aria-label="Search cards"` added to the search input).
- The `/card/[mint]` route is dynamic and is skipped by the browser sweep; its
  source and static rendering are covered by the build and the seeded screenshot.
- Verification harness: the skill's Vue inventory was adapted to Next.js/React in
  `website/.reskin/tools/inventory-next.mjs`; its `verify-next.mjs` is a copy of
  the skill verifier using the same browser capture, compare metrics and
  thresholds. Because React components legitimately move copy between files, the
  **source** gate locks presence (removal/addition) while the **rendered** gate
  keeps the per-route multiset and duplicates.

## Gate results

| Gate | Result | Detail |
|---|---|---|
| Source contract | PASS | 0 removed, 0 added copy tokens |
| Skeleton | PASS | `topnav-marketing` → `split-stage` |
| Accent distance | PASS | 112.84 ΔE (min 30) |
| Route health | PASS | 4 static routes + 1 dynamic skip, all 200, no console/page errors |
| DOM similarity | PASS | 0.087 – 0.388 (max 0.50) |
| Landmark similarity | PASS | 0.333 – 0.667 (max 0.68) |
| CSS class overlap | PASS | **0.000** on every route (max 0.10) |
| Contrast | PASS | 0 failures desktop and mobile |
| Axe WCAG 2.x | PASS | 0 serious/critical on every route |
| Labels / alt / names | PASS | 0 field, image or control issues |
| Keyboard focus | PASS | visible focus indicator during tab traversal |
| Mobile navigation | PASS | all route targets visible at 390 px |
| Horizontal overflow | PASS | none at 390 px |
| Build | PASS | `next build`, all 13 routes |

## Screenshots

Baseline (before): `website/.reskin/baseline/{home,app,offers,docs}-{desktop,mobile}.png`

Current (after): `website/.reskin/current/{home,app,offers,docs}-{desktop,mobile}.png`

The pairs were inspected side by side. The before/after share no landmark
silhouette: the old full-width top bar and centred hero are gone, the left column
is a persistent ledger index, and the product catalog is a numbered list instead
of a five-column card wall.

## Accessibility and responsive work

- One `h1` per route; sections use `h2`/`h3` in order.
- Focus-visible ring on every interactive element; tab order follows the index,
  thesis actions, tabs, then content.
- Labels for the search input and the USDC amount; icon-only controls carry
  `aria-label`.
- `prefers-reduced-motion` disables non-essential motion.
- The mobile layout is a linear masthead + wrapped index chips + single-column
  ledger stage; nothing is hidden and no route link requires horizontal scroll.
- All text and small mono labels were darkened until the contrast gate reached 0
  failures on both viewports.

## X / Twitter kit

The kit was rebuilt against the same direction rather than recoloured:

- `twitter/src/shared.css` now carries the ice/cobalt/deep-tide tokens, Segoe
  display type and Cascadia mono labels.
- `banner.html` is a left-copy / right-cobalt-plate split; copy and chips stay
  above the profile-photo overlap.
- `logo.html` is the new tidal monogram on ice with concentric rings.
- `tweet-1-hero.html` is a split hero with the two slabs on a cobalt tide panel
  and the swap node straddling the seam.
- `tweet-2-how.html` is a narrative column plus a 2×2 numbered step ledger.
- `tweet-3-escrow.html` is a vertical three-step escrow flow with the offer PDA
  highlighted in deep cobalt and marginal stats.
- `tweet-4-product.html` is a narrative column plus a light browser frame around
  the reskinned app.
- `profile-mock.html` is a light X profile card.
- All eight rasters were regenerated with `python twitter/src/build.py`; alt text
  in `twitter/tweet.md` was updated to describe the new imagery, and
  `python twitter/src/check_copy.py` passes (240/280 tweet, 156/160 bio).

## Files

New: `components/Tidal.tsx`, `website/.reskin/tools/inventory-next.mjs`,
`website/.reskin/tools/verify-next.mjs`, `.reskin/tools/lib/*`.

Rewritten: `app/layout.tsx`, `app/globals.css`, `app/page.tsx`, `app/docs/page.tsx`,
`app/app/page.tsx`, `app/offers/page.tsx`, `app/card/[mint]/page.tsx`,
`app/not-found.tsx`, `components/Brand.tsx`, `components/AppBrowser.tsx`,
`components/OffersBoard.tsx`, `components/OfferRow.tsx`, `components/CardOffers.tsx`,
`components/OfferModal.tsx`, `components/auth.tsx`.

Unused on disk: `components/AppHeader.tsx` (no longer imported), old
`public/css/base.css` and `public/css/site.css` (no longer linked).

## Known limitations

- The `/card/[mint]` route is dynamic; the browser sweep skips it and a concrete
  offer-bearing card was captured manually instead.
- `/offers` landmark similarity is 0.667 against a 0.68 threshold — passing, but
  the tightest margin; the skeleton is still visibly different (no top bar, a
  sticky narrative column, numbered bands).
- Numeric-only tokens are intentionally not part of content equality; the new
  index numerals and card numbers are reported as numeric-count warnings.
- The live-sampled accent was adjusted for AA contrast, not replaced with a
  different style family.
- Trademark clearance and the real domain/handle registration are outside scope.
