# Reskin art direction — Abyss Liquidity

> Selected automatically. Do not ask the user to confirm or choose another direction.

- **Style DNA:** `aave-abyss` (dark-technical)
- **Skeleton:** `terminal-console` (linear)
- **Seed:** `f34492a9bd107dfd0fb9ec1f8d2e1bb7b4709eb9bc9120af083a326b581c9519`
- **Source DNA:** [https://aave.com](https://aave.com)
- **Live sampled:** yes — https://aave.com (1534 ms)
- **Original:** split-stage / light / accent #1e7be8

## Why this direction

The selector sampled 8/10 blockchain references, scored every direction for perceptual distance from the original accent (#1e7be8) and background (#f5faff), added a deterministic seed jitter, and chose Abyss Liquidity because it is 145 ΔE away from the original accent and pairs with Terminal Console, a linear skeleton rather than the original split-stage.

## Live reference sampling

| Style | URL | Result | Accent sampled | Ground sampled |
|---|---|---|---|---|
| solana-spectrum | https://solana.com | failed: HTTP 429 | — | — |
| ethereum-paper | https://ethereum.org | ok (865 ms) | #0c5681 | #ffffff |
| base-cobalt | https://www.base.org | ok (1277 ms) | #0000ff | #dde3e9 |
| polygon-agora | https://polygon.technology | ok (1179 ms) | #670de5 | #000000 |
| arbitrum-signal | https://arbitrum.io | failed: HTTP 403 | — | — |
| aave-abyss | https://aave.com | ok (1534 ms) | #ff0000 | #000000 |
| uniswap-bubblegum | https://uniswap.org | ok (2187 ms) | — | #ffffff |
| optimism-poster | https://www.optimism.io | ok (3039 ms) | #ff0421 | #fafaf9 |
| cosmos-orbit | https://cosmos.network | ok (1833 ms) | #40b3ff | #000000 |
| sui-tidal | https://sui.io | ok (2467 ms) | #298dff | #ffffff |

Live sampling is evidence, not a copy target. Never download or reuse a reference site's logo, imagery, copy, or code. Use only the abstract tokens below.

## Candidate ranking

| Candidate | Score | Accent ΔE from original | Layout | Live |
|---|---:|---:|---|---|
| Abyss Liquidity | 0.9104 | 145.4 | terminal-console | yes |
| Poster Optimism | 0.8828 | 136.1 | ticker-stage | yes |
| Cobalt Blueprint | 0.7536 | 81.9 | command-rail | yes |
| Agora Violet | 0.7391 | 57.8 | documentary | yes |
| Paper Protocol | 0.6875 | 41.1 | documentary | yes |
| Bubblegum Exchange | 0.6647 | 87.2 | bento-canvas | yes |
| Cosmos Orbit | 0.6313 | 31.9 | documentary | yes |
| Signal Navy | 0.6205 | 41.6 | terminal-console | no |
| Spectrum Terminal | 0.5599 | 33.5 | ticker-stage | no |
| Tidal Sui | 0.2455 | 5.5 | bento-canvas | yes |

## Skeleton brief

**Terminal Console** — thin status bar at the very top; monospace micro-labels and tabular data everywhere; dense two-pane console with a resizable-feeling gutter; no marketing hero; the data is the hero; bottom command hint strip.

Navigation: Top status bar with route names as commands; keyboard shortcuts shown; a command palette is the primary way to move.

Structure:
1. 24-32px status bar
1. command/title line
1. dense 3-pane console: filters, data, detail
1. bottom hint strip

Content mapping: Preserve every table row and label. Turn filters into console chips, metrics into sparkline headers, forms into inline command rows. Detail panel shows the selected row's existing fields.

Recipe: `.statusbar{position:sticky;top:0;display:flex;justify-content:space-between;padding:6px 12px;border-bottom:1px solid var(--line);font:11px/1.4 var(--font-mono)}.console{display:grid;grid-template-columns:200px minmax(0,1fr) 280px;min-height:calc(100vh - 64px)}.pane+.pane{border-left:1px solid var(--line)}.console table{font-variant-numeric:tabular-nums}`

Risks: dense does not mean tiny: body text must stay >=14px and contrast >=4.5; three panes collapse badly on mobile; use a single column + drawer

## Design tokens

```css
:root {
  --bg: #000000;
  --surface: #111A24;
  --surface-alt: #182533;
  --ink: #F4F7FA;
  --muted: #8FA3B5;
  --accent: #ff0000;
  --accent-safe: #ff0000;
  --accent-2: #ff00ff;
  --line: #1E2A36;
  --success: #5CE1A0;
  --danger: #FF7A7A;
  --warning: #F2C94C;

  --font-display: "Trebuchet MS", "Segoe UI", sans-serif;
  --font-body: "Segoe UI", "Helvetica Neue", sans-serif;
  --font-mono: "Cascadia Mono", ui-monospace, monospace;
  --display-weight: 650;
  --display-tracking: -0.035em;
  --label-tracking: 0.1em;

  --radius-sm: 10px;
  --radius-md: 16px;
  --radius-lg: 24px;
  --border: 1px solid rgba(143, 163, 181, 0.18);
  --shadow: 0 26px 70px rgba(0, 0, 0, 0.5);

  --motion-duration: 240ms;
  --motion-ease: cubic-bezier(.22,1,.36,1);
  --space-1: clamp(4px, .35vw, 6px);
  --space-2: clamp(8px, .7vw, 12px);
  --space-3: clamp(14px, 1.2vw, 20px);
  --space-4: clamp(22px, 2vw, 32px);
  --space-5: clamp(36px, 3.4vw, 56px);
  --space-6: clamp(56px, 5vw, 88px);
  --page-pad: clamp(18px, 4vw, 64px);
  --max-width: 1440px;
}
```

## Component grammar

- Surface: 1px solid rgba(143, 163, 181, 0.18); radius 16px; shadow 0 26px 70px rgba(0, 0, 0, 0.5).
- Type: display **"Trebuchet MS", "Segoe UI", sans-serif** at weight 650, tracking -0.035em; body **"Segoe UI", "Helvetica Neue", sans-serif**; numerals and micro-labels **"Cascadia Mono", ui-monospace, monospace**.
- Texture: liquid glass, teal-magenta glow, fine grid, data sparklines.
- Motion: fluid, 240ms, cubic-bezier(.22,1,.36,1). Always wrap non-essential motion in `@media (prefers-reduced-motion: no-preference)`.
- Density: comfortable. Keep body text >= 14px and body contrast >= 4.5:1.
- Use `--accent-safe` for text and icons on `--bg`; use `--accent` for fills and large shapes.

## Originality guard

The replacement must satisfy all of these:

1. The source inventory archetype is `split-stage`; the new skeleton is `terminal-console`. Do not fall back to the old shell during implementation.
2. Do not reuse any original class name, CSS selector, design token name, or original accent family.
3. Rewrite templates, not only CSS. Every route must visibly use the new skeleton.
4. Keep every token in `.reskin/content-contract.json`; move it, never rewrite it.
5. Run `node scripts/verify.mjs check` and do not stop until content, structure, accessibility and responsive checks pass.

## Commit statement

Use this sentence in the final report: "The UI was rebuilt around Abyss Liquidity / Terminal Console; the original split-stage shell and palette were removed while the content contract stayed byte-for-byte intact."
