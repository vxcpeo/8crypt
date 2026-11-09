import type { Metadata } from 'next';
import Link from 'next/link';
import { BrandBar, IndexNav, SiteFooter, SplitLayout } from '@/components/Tidal';

export const metadata: Metadata = {
  title: 'Docs',
  description:
    'How Tabuline swaps graded Collector Crypt cards on Solana: offers, escrow, fees, program instructions and risks.',
};

export default function DocsPage() {
  return (
    <SplitLayout
      variant="marketing"
      footer={<SiteFooter />}
      narrative={
        <>
          <BrandBar>
            <Link className="tx-btn tx-btn--solid tx-btn--sm" href="/app">
              Launch app
            </Link>
          </BrandBar>
          <IndexNav active="/docs" />
          <div className="tx-thesis tx-thesis--doc">
            <p className="tx-eyebrow">Docs</p>
            <p className="tx-eyebrow">Tabuline documentation</p>
            <h1 className="tx-display tx-display--doc">
              Swap graded cards on Solana, card for card.
            </h1>
            <nav className="tx-doc-toc" aria-label="On this page">
              <a href="#overview">Overview</a>
              <a href="#how">How it works</a>
              <a href="#fees">Fees</a>
              <a href="#program">Program</a>
              <a href="#risks">Risks</a>
              <a href="#faq">FAQ</a>
            </nav>
          </div>
        </>
      }
    >
      <article className="tx-doc-article">
      

      <section id="overview">
        <h2>Overview</h2>
        <p>
          Tabuline lets Collector Crypt holders swap their tokenized graded Pokémon cards
          directly, without selling first. Each card is a Metaplex programmable NFT on Solana
          backed by a graded card in Collector Crypt&apos;s vault.
        </p>
        <p>
          A bidder locks one card, plus optional USDC, into an on-chain offer for one specific
          card. The owner of that card accepts in one transaction and both sides change hands at
          once, or ignores it, or sends a counteroffer. The bidder can cancel any time for free.
        </p>
        <p>
          A completed swap costs 1 USDC per side. All swap fees buy back and burn $TABULINE once a
          day. Wallets holding at least 1,000,000 $TABULINE pay no fee.
        </p>
      </section>

      <section id="how">
        <h2>How it works</h2>
        <ol className="tx-doc-steps">
          <li>
            <b>Make an offer.</b> Pick the card you want, choose one of your cards to give, and
            set the USDC: added by you, asked from the owner, or none. Optionally set an expiry.
            You sign one transaction; your card, your USDC and your 1 USDC fee go into escrow
            accounts owned by the offer.
          </li>
          <li>
            <b>The owner answers.</b> They see the offer with both insured values side by side.
            They can accept, ignore it, or counter with a new offer the other way.
          </li>
          <li>
            <b>Accept settles everything.</b> The owner signs one transaction. Both cards and the
            USDC move in the same instruction, or nothing moves.
          </li>
          <li>
            <b>Cancel or expiry.</b> Until it is accepted, the bidder can cancel for free. After
            an expiry, anyone can send the escrow back to the bidder.
          </li>
        </ol>

        <h3>Worked example</h3>
        <p className="tx-doc-note">Example names and values.</p>
        <div className="tx-table-wrap">
          <table className="tx-table">
            <thead>
              <tr>
                <th>Step</th>
                <th>Maya (bidder)</th>
                <th>Leo (owner)</th>
                <th>Treasury</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Start</td>
                <td>Blastoise Holo PSA 8 ($380 est.), 100 USDC</td>
                <td>Charizard ex PSA 9 ($420 est.), 0 USDC</td>
                <td>0</td>
              </tr>
              <tr>
                <td>make_offer (+40 USDC)</td>
                <td>Card, 40 USDC and 1 USDC fee in escrow. Wallet: 59 USDC</td>
                <td>No change</td>
                <td>0</td>
              </tr>
              <tr>
                <td>accept</td>
                <td>Receives Charizard ex. Wallet: 59 USDC</td>
                <td>Receives Blastoise + 40 USDC, minus 1 USDC fee = 39 USDC</td>
                <td>+2 USDC</td>
              </tr>
              <tr>
                <td>If Maya cancels instead</td>
                <td>Gets back Blastoise and 41 USDC. Wallet: 100 USDC</td>
                <td>No change</td>
                <td>0</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p>
          Each side also pays the Solana network fee for the transaction it signs. The rent for
          the offer accounts is a deposit paid by the bidder and returned when the offer closes.
        </p>
      </section>

      <section id="fees">
        <h2>Fees</h2>
        <p>
          1 USDC per side, only on a completed swap. Nothing on cancel or expiry. The fee in
          force is written into each offer when it is made, so a later change never reprices an
          open offer. The program caps it at 10 USDC per side.
        </p>
        <div className="tx-table-wrap">
          <table className="tx-table">
            <thead>
              <tr>
                <th>Who pays</th>
                <th>When</th>
                <th>Amount</th>
                <th>Where it goes</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Bidder (maker)</td>
                <td>
                  Held in the offer when it is made; charged only if the swap completes,
                  returned on cancel or expiry
                </td>
                <td className="tx-num">1 USDC</td>
                <td>Treasury USDC account (set at deploy)</td>
              </tr>
              <tr>
                <td>Card owner (taker)</td>
                <td>
                  On accept, taken first from the USDC the bidder added, the rest from the
                  owner&apos;s wallet
                </td>
                <td className="tx-num">1 USDC</td>
                <td>Treasury USDC account (set at deploy)</td>
              </tr>
              <tr>
                <td>Any side holding ≥ 1,000,000 $TABULINE</td>
                <td>Bidder checked at make, owner checked at accept</td>
                <td className="tx-num">0 USDC</td>
                <td>—</td>
              </tr>
              <tr>
                <td>Treasury</td>
                <td>Once a day</td>
                <td className="tx-num">100% of swap fees</td>
                <td>Market buy of $TABULINE, then burned (buyback wallet set at deploy)</td>
              </tr>
              <tr>
                <td>$TABULINE traders on Pump.fun</td>
                <td>On every $TABULINE trade, at Pump.fun&apos;s creator-fee rate</td>
                <td className="tx-num">Pump.fun rate</td>
                <td>Project wallet, for development (set at deploy)</td>
              </tr>
              <tr>
                <td>Everyone</td>
                <td>Each transaction</td>
                <td className="tx-num">Solana network fee</td>
                <td>
                  Validators. Account rent is a deposit, returned to the bidder when the offer
                  closes
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <p>
          The 2% Collector Crypt royalty does not apply: a swap is two transfers, not a sale.
          Collector Crypt&apos;s transfer rule set still runs on every card move.
        </p>
      </section>

      <section id="program">
        <h2>Program</h2>
        <dl className="tx-doc-facts">
          <div>
            <dt>Program ID</dt>
            <dd>
              <code>5wvjqDcFDVri7RUcxn1TQA7MPRjWJ7gMvY2DabbyJCW6</code>{' '}
              <a
                href="https://solscan.io/account/5wvjqDcFDVri7RUcxn1TQA7MPRjWJ7gMvY2DabbyJCW6"
                target="_blank"
                rel="noreferrer"
              >
                Solscan ↗
              </a>
            </dd>
          </div>
          <div>
            <dt>Framework</dt>
            <dd>Pinocchio (no Anchor)</dd>
          </div>
          <div>
            <dt>Collection check</dt>
            <dd>
              Every escrowed card must carry the verified collection{' '}
              <code>CCryptWBYktukHDQ2vHGtVcmtjXxYzvw8XNVY64YN2Yf</code> in its Token Metadata.
            </dd>
          </div>
          <div>
            <dt>Card transfers</dt>
            <dd>
              Token Metadata TransferV1, so Collector Crypt&apos;s rule set{' '}
              <code>eBJLFYPxJmMGKuFwpDWkzxZeUrad92kZRC5BJLpzyT9</code> is applied.
            </dd>
          </div>
          <div>
            <dt>Escrow</dt>
            <dd>
              One PDA per offer, seeds <code>[&quot;offer&quot;, maker, id]</code>. It owns the
              card&apos;s token account and the USDC vault.
            </dd>
          </div>
          <div>
            <dt>Audit</dt>
            <dd>
              None. 20 tests in LiteSVM against cloned mainnet Token Metadata, Token Auth Rules,
              Collector Crypt&apos;s rule set and two real Collector Crypt cards.
            </dd>
          </div>
        </dl>

        <h3>Instructions</h3>
        <ul className="tx-doc-instr">
          <li>
            <p>
              <code>make_offer</code> <span>Bidder</span>
            </p>
            <p>
              Moves one card (Token Metadata TransferV1) and the bidder&apos;s USDC plus held fee
              into escrow accounts owned by a new offer PDA. Stores the wanted card, the USDC
              each way, the current fee and an optional expiry. Rejected if the card is not in
              the verified Collector Crypt collection, if new offers are paused, or if both
              cards are the same.
            </p>
          </li>
          <li>
            <p>
              <code>cancel</code> <span>Bidder, or anyone after expiry</span>
            </p>
            <p>
              Returns the card, the USDC and the held fee to the bidder, then closes the escrow
              and offer accounts (rent back to the bidder). No fee.
            </p>
          </li>
          <li>
            <p>
              <code>accept</code> <span>Owner of the wanted card</span>
            </p>
            <p>
              In one instruction: escrowed card and USDC to the owner, wanted card (and any USDC
              asked for) to the bidder, the two fees to the treasury, accounts closed. Rejected
              if the offer expired, if the signer does not hold the wanted card, or if the cards
              passed are not the ones written in the offer.
            </p>
          </li>
          <li>
            <p>
              <code>configure</code> <span>Admin key only</span>
            </p>
            <p>
              Sets the fee (capped at 10 USDC per side), the treasury, the collection, the
              $TABULINE waiver and the pause flag. Does not change open offers. Pause blocks new
              offers only.
            </p>
          </li>
        </ul>

        <h3>What is escrowed</h3>
        <p>
          Per offer: the bidder&apos;s card (amount 1, in a token account owned by the offer
          PDA), the USDC the bidder added, and the bidder&apos;s fee unless waived. The wanted
          card never leaves the owner&apos;s wallet until they accept. No instruction can send
          an escrowed asset anywhere except the bidder, the owner who delivers the wanted card
          in the same instruction, or the treasury for the fixed fee.
        </p>
      </section>

      <section id="risks">
        <h2>Risks</h2>
        <ul className="tx-doc-risks">
          <li>The program is not audited. A bug could lock or lose escrowed cards or USDC.</li>
          <li>An accepted swap is final. Check both cards before you sign.</li>
          <li>
            Card values shown are Collector Crypt&apos;s insured value, an estimate. They are not
            a price anyone has agreed to pay.
          </li>
          <li>
            The admin key can change the fee for new offers (never above 10 USDC per side), the
            treasury and the waiver, and can pause new offers. It cannot move escrowed assets.
          </li>
          <li>
            Collector Crypt is a third party. A change to its collection, metadata or transfer
            rule set could block new offers or transfers.
          </li>
          <li>
            $TABULINE is a token on a bonding curve and can lose all its value. Holding it only
            removes your swap fee.
          </li>
          <li>
            Tabuline is not affiliated with Collector Crypt or The Pokémon Company. Nothing
            here is financial advice.
          </li>
        </ul>
      </section>

      <section id="faq">
        <h2>FAQ</h2>
        <dl className="tx-doc-faq">
          <div>
            <dt>Where does the money for the $TABULINE buyback come from?</dt>
            <dd>
              Only from swap fees: 1 USDC per side on each completed swap. There are no
              emissions and no outside top-ups. If nobody swaps, nothing is bought. Cancelled
              and expired offers pay nothing.
            </dd>
          </div>
          <div>
            <dt>Who can change the rules after launch?</dt>
            <dd>
              An admin key sets the fee, the treasury account and the $TABULINE waiver, and can
              pause new offers. The program caps the fee at 10 USDC per side, and an open offer
              keeps the fee it was made with. The admin key cannot move escrowed cards or USDC,
              and a pause never blocks cancel or accept.
            </dd>
          </div>
          <div>
            <dt>Do I need to claim anything?</dt>
            <dd>
              No. On accept, both cards and the USDC land in the two wallets in the same
              transaction. On cancel or expiry, the card, the USDC and the held fee go straight
              back to the bidder.
            </dd>
          </div>
          <div>
            <dt>What can go wrong?</dt>
            <dd>
              The program is not audited: a bug could lock or lose escrowed cards or USDC. Card
              values shown are Collector Crypt&apos;s insured value, an estimate, not a price
              anyone will pay. An accepted swap is final. Collector Crypt is a third party and
              could change its collection or transfer rules, which could block new offers.
              $TABULINE can lose all its value.
            </dd>
          </div>
          <div>
            <dt>Is there a presale, team allocation or airdrop?</dt>
            <dd>
              No presale, no team allocation, no airdrop. $TABULINE launches on Pump.fun with the
              standard 1,000,000,000 supply. The dev buy at launch will be disclosed with its
              transaction.
            </dd>
          </div>
          <div>
            <dt>Is it audited?</dt>
            <dd>
              No. The program has 20 tests (13 of them attacks that must be refused) run in
              LiteSVM against the real mainnet Token Metadata and Token Auth Rules programs,
              Collector Crypt&apos;s rule set and two real Collector Crypt cards. That is
              testing, not an audit. Start with cards you can afford to have stuck.
            </dd>
          </div>
          <div>
            <dt>Can I swap a card listed on a marketplace?</dt>
            <dd>
              Not while it is listed. A listing locks the card, so the escrow cannot take it.
              Delist it first, then make or accept the offer.
            </dd>
          </div>
          <div>
            <dt>What about the Collector Crypt royalty?</dt>
            <dd>
              The 2% royalty applies to sales. A swap here is two transfers in one transaction,
              with no sale, so no royalty is charged. Collector Crypt&apos;s transfer rule set
              still runs on every card move.
            </dd>
          </div>
          <div>
            <dt>How do I skip the 1 USDC fee?</dt>
            <dd>
              Hold at least 1,000,000 $TABULINE in the wallet that signs. The bidder is checked
              when the offer is made, the owner when they accept. The waiver turns on once
              $TABULINE exists; until then every side pays 1 USDC.
            </dd>
          </div>
        </dl>
      </section>
        </article>
    </SplitLayout>
  );
}
