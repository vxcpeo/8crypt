# Tabuline — website

Next.js 15 frontend for the Tabuline card-for-card swap protocol, with wallet-native
on-chain authentication (Sign-In With Solana) instead of email or hosted auth.

Brand: **tabuline.top** · X: **@tabuline_top**

## Brand and social links

The X link is part of the shell, so every route carries it:

| Where | Source |
| --- | --- |
| Brand-bar icon button (all routes) | `components/Tidal.tsx` → `XIconLink` |
| Footer "@tabuline_top on X" chip + `x.com/tabuline_top` link | `components/Tidal.tsx` → `XFollowChip`, `SiteFooter` |
| `<meta name="twitter:site">` / `creator` | `app/layout.tsx` |
| Canonical/OG base URL | `app/layout.tsx` → `metadataBase` |

`lib/links.ts` is the single source of truth for the URL and handle; change it
there and the shell, metadata and footer follow. `app/layout.tsx` repeats the
handle in the `twitter` metadata block because Next.js metadata is static — keep
the two in step.

## Run

```bash
npm install
cp .env.example .env.local   # set a real AUTH_SECRET
npm run dev                  # http://localhost:3000
```

Production:

```bash
npm run build
npm start
```

## Routes

| Route | Description |
| --- | --- |
| `/` | Marketing site: hero, live vault showcase, how it works, fees, security, FAQ |
| `/app` | Swap desk: browse the Collector Crypt catalog, compose an offer, My cards / Received / Sent |
| `/offers` | Public offer book and completed swaps |
| `/card/[mint]` | Per-card page with insured value, provenance links and offers |
| `/docs` | Protocol documentation |

## On-chain authentication

1. The wallet connects through Phantom, Solflare or Backpack (injected providers, no hosted
   wallet service).
2. `POST /api/auth/nonce` creates a SIWS message containing the wallet, domain, URI, nonce,
   issue time and expiry. The nonce and the exact message are HMAC-signed into a short-lived
   `nonceToken`.
3. The wallet signs the message with its Ed25519 key. No transaction is sent and no gas is
   spent.
4. `POST /api/auth/verify` reconstructs the challenge, verifies the signature against the
   Solana public key with `tweetnacl`, rejects replayed nonces, and sets an HttpOnly,
   HMAC-signed session cookie.
5. `GET /api/auth/session` restores the session. All write APIs (`POST /api/offers`, accept,
   cancel) require the session and ignore any address supplied by the client.

The companion `tabuline_auth` Anchor program mirrors the same wallet identity on-chain: a
wallet can register a profile, record login attestations and keep its handle, all keyed by
the same Solana key that signs swaps.

Set `AUTH_SECRET` in production. The development fallback is intentionally public and must
not be used for a real deployment.

## Data / preview mode

The UI keeps the original content, routes, forms and data flows, and is fully
interactive. It is presented through the new **Tidal Sui / Split Stage** design
system: an ice-and-cobalt palette, a sticky narrative ledger and a scrolling data
stage. The card catalog is the public Collector Crypt catalog captured at build
time and served from `public/cards/`. Because a preview wallet normally does not hold Collector Crypt NFTs,
each connected wallet receives a deterministic six-card preview vault; the offer book is
stored in `.data/offers.json`. Swap and auth flows are exercised end-to-end in the preview.

To go on-chain, deploy `contracts/programs/tabuline_swap` and point the app at a program
client (the IDL is generated at `contracts/target/idl/tabuline_swap.json`). The program
interface and escrow semantics are documented in `../contracts/README.md`.

## Environment

```bash
AUTH_SECRET=replace-with-32-bytes-of-entropy
NEXT_PUBLIC_SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
NEXT_PUBLIC_SWAP_PROGRAM_ID=4ozHy8Ndv5x467n18PxWPuxb3tkKAEfFYDvuU6874Sz8
NEXT_PUBLIC_AUTH_PROGRAM_ID=FarAwYVgdTgnm3iqo5s8WVNvrG8x3XvatazAYaKrmsR5
```

The last three are informational for the preview build and can be wired into the program
client without changing the UI.

## Verification

```bash
npm run typecheck
npm run build
```

`app/` contains the routes, `components/` the interactive swap and auth surfaces, `lib/`
the SIWS/session/offer logic, and `app/globals.css` the new design tokens and component
styles. `public/css/{base,site}.css` are the original stylesheets; they are kept on disk
for reference but are no longer linked from `layout.tsx`.

The reskin verification harness and evidence live in `.reskin/`:

```bash
node .reskin/tools/verify-next.mjs check --project . --out .reskin --url http://127.0.0.1:3000
```

See `.reskin/REPORT.md` for the art direction, gate table, screenshots and the
content-contract hash.
