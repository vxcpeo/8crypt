import Link from 'next/link';
import { CARDS } from '@/lib/cards';
import { X_HANDLE, X_URL } from '@/lib/links';
import { Arrow, Brand } from '@/components/Brand';
import {
  CommandLine,
  Console,
  ConsoleFooter,
  IndexPane,
  SpecPane,
  StatusBar,
  Work,
  XIconLink,
  XPostChip,
} from '@/components/Console';
import {
  ArrowShieldIcon,
  BoltIcon,
  CheckIcon,
  CodeIcon,
  FlameIcon,
  KeyIcon,
  LockIcon,
  ReturnIcon,
  SearchIcon,
  ShieldIcon,
  StackIcon,
  SwapIcon,
  UsdcIcon,
} from '@/components/Icons';

export const metadata = {
  title: 'Gemmora — swap graded Pokémon cards, no selling first',
  description:
    'Gemmora lets Collector Crypt holders swap tokenized graded Pokémon cards directly on Solana: card for card, with optional USDC to balance, settled in one atomic transaction.',
};

const steps = [
  {
    title: 'Find the card you want',
    body: 'Search every verified Collector Crypt card by name, set or grade. Your own cards load from your wallet.',
    icon: <SearchIcon />,
  },
  {
    title: 'Lock your offer',
    body: 'Put one of your cards in escrow. Add USDC if yours is worth less, or ask for USDC if it is worth more.',
    icon: <LockIcon />,
  },
  {
    title: 'They accept, it settles',
    body: 'Both cards and the USDC change hands in one transaction. All or nothing, nobody in the middle.',
    icon: <BoltIcon />,
  },
  {
    title: 'Or cancel for free',
    body: 'Until it is accepted, pull your card and USDC back any time. After an expiry, anyone can return them to you.',
    icon: <ReturnIcon />,
  },
];

const security = [
  {
    title: 'Program on Solana',
    icon: <CodeIcon />,
    body: (
      <>
        Written in Pinocchio. <code>5wvj…JCW6</code> ·{' '}
        <a
          href="https://solscan.io/account/5wvjqDcFDVri7RUcxn1TQA7MPRjWJ7gMvY2DabbyJCW6"
          target="_blank"
          rel="noreferrer"
        >
          Solscan ↗
        </a>
      </>
    ),
  },
  {
    title: 'One escrow per offer',
    icon: <LockIcon />,
    body: <>Each offer is its own program address. Cards and USDC never sit in a team wallet.</>,
  },
  {
    title: 'Verified cards only',
    icon: <CheckIcon />,
    body: (
      <>
        Anything outside the Collector Crypt collection (<code>CCry…N2Yf</code>) is rejected.
      </>
    ),
  },
  {
    title: 'Three exits only',
    icon: <ArrowShieldIcon />,
    body: (
      <>
        An escrowed asset can only go back to the bidder, to the owner who delivers the card, or
        the fixed fee to the treasury.
      </>
    ),
  },
  {
    title: '20 tests, real programs',
    icon: <BoltIcon />,
    body: (
      <>
        Run against mainnet Token Metadata, Collector Crypt&apos;s rule set and real cards,
        including 13 attacks that must fail.
      </>
    ),
  },
  {
    title: 'Your keys, your signature',
    icon: <KeyIcon />,
    body: (
      <>
        The app builds and simulates each transaction; only your wallet signs. Not audited yet:
        start small.
      </>
    ),
  },
];

const faqs = [
  {
    q: 'Where does the money for the $GEMMORA buyback come from?',
    a: 'Only from swap fees: 1 USDC per side on each completed swap. There are no emissions and no outside top-ups. If nobody swaps, nothing is bought. Cancelled and expired offers pay nothing.',
  },
  {
    q: 'Who can change the rules after launch?',
    a: 'An admin key sets the fee, the treasury account and the $GEMMORA waiver, and can pause new offers. The program caps the fee at 10 USDC per side, and an open offer keeps the fee it was made with. The admin key cannot move escrowed cards or USDC, and a pause never blocks cancel or accept.',
  },
  {
    q: 'Do I need to claim anything?',
    a: 'No. On accept, both cards and the USDC land in the two wallets in the same transaction. On cancel or expiry, the card, the USDC and the held fee go straight back to the bidder.',
  },
  {
    q: 'What can go wrong?',
    a: 'The program is not audited: a bug could lock or lose escrowed cards or USDC. Card values shown are Collector Crypt’s insured value, an estimate, not a price anyone will pay. An accepted swap is final. Collector Crypt is a third party and could change its collection or transfer rules, which could block new offers. $GEMMORA can lose all its value.',
  },
  {
    q: 'Is there a presale, team allocation or airdrop?',
    a: 'No presale, no team allocation, no airdrop. $GEMMORA launches on Pump.fun with the standard 1,000,000,000 supply. The dev buy at launch will be disclosed with its transaction.',
  },
  {
    q: 'Is it audited?',
    a: 'No. The program has 20 tests (13 of them attacks that must be refused) run in LiteSVM against the real mainnet Token Metadata and Token Auth Rules programs, Collector Crypt’s rule set and two real Collector Crypt cards. That is testing, not an audit. Start with cards you can afford to have stuck.',
  },
  {
    q: 'Can I swap a card listed on a marketplace?',
    a: 'Not while it is listed. A listing locks the card, so the escrow cannot take it. Delist it first, then make or accept the offer.',
  },
  {
    q: 'What about the Collector Crypt royalty?',
    a: 'The 2% royalty applies to sales. A swap here is two transfers in one transaction, with no sale, so no royalty is charged. Collector Crypt’s transfer rule set still runs on every card move.',
  },
  {
    q: 'How do I skip the 1 USDC fee?',
    a: 'Hold at least 1,000,000 $GEMMORA in the wallet that signs. The bidder is checked when the offer is made, the owner when they accept. The waiver turns on once $GEMMORA exists; until then every side pays 1 USDC.',
  },
];

const showcase = CARDS.slice(0, 14);

export default function HomePage() {
  return (
    <Console>
      <StatusBar
        active="/"
        action={
          <Link className="gx-btn gx-btn--primary gx-btn--xs" href="/app">
            Launch app
          </Link>
        }
      />
      <CommandLine
        label={
          <>
            <span className="gx-dot" aria-hidden="true" />
            Built on Collector Crypt · Solana
          </>
        }
        title={
          <>
            Trade collectibles
            <br />
            directly <em>onchain.</em>
          </>
        }
        lede={
          <>
            Swap your graded Pokémon cards card-for-card, add USDC to balance the values, and
            settle both sides in a single transaction. No selling first.
          </>
        }
        actions={
          <>
            <Link className="gx-btn gx-btn--primary" href="/app">
              Start a swap <Arrow />
            </Link>
            <a className="gx-btn gx-btn--ghost" href="#how">
              How it works
            </a>
          </>
        }
        meta={
          <>
            <XPostChip />
            <span className="gx-meta-note">1 USDC per side · only when a swap completes</span>
          </>
        }
      />

      <Work layout="three">
        <IndexPane>
          <ul className="gx-features">
            <li className="gx-feature">
              <span className="gx-feature-icon">
                <SwapIcon />
              </span>
              <span className="gx-feature-copy">
                <b>Swap</b>
                <span>cards</span>
              </span>
            </li>
            <li className="gx-feature">
              <span className="gx-feature-icon">
                <StackIcon />
              </span>
              <span className="gx-feature-copy">
                <b>Public</b>
                <span>offers</span>
              </span>
            </li>
            <li className="gx-feature">
              <span className="gx-feature-icon">
                <UsdcIcon />
              </span>
              <span className="gx-feature-copy">
                <b>Add</b>
                <span>USDC</span>
              </span>
            </li>
            <li className="gx-feature">
              <span className="gx-feature-icon">
                <ShieldIcon />
              </span>
              <span className="gx-feature-copy">
                <b>Secure</b>
                <span>onchain</span>
              </span>
            </li>
          </ul>
        </IndexPane>

        <main className="gx-pane gx-pane--data" id="content">
          <div className="gx-stats">
            <div className="gx-stat">
              <b>0</b>
              <span>Open offers</span>
              <small>cards in escrow now</small>
            </div>
            <div className="gx-stat">
              <b>0</b>
              <span>Swaps settled</span>
              <small>on Solana</small>
            </div>
            <div className="gx-stat">
              <b>$0</b>
              <span>Card value swapped</span>
              <small>Collector Crypt insured value</small>
            </div>
            <div className="gx-stat">
              <b>0 USDC</b>
              <span>To $GEMMORA buyback</span>
              <small>100% of swap fees</small>
            </div>
          </div>

          <section aria-labelledby="showcase-title" className="gx-band">
            <div className="gx-bandhead">
              <p className="gx-kicker">Real slabs, vaulted by Collector Crypt</p>
              <span className="gx-bandnum" aria-hidden="true" />
              <span className="gx-rule" aria-hidden="true" />
              <h2 className="gx-h2" id="showcase-title">
                Any card in the vault <em>can be your next one.</em>
              </h2>
            </div>
            <div className="gx-rail">
              <div className="gx-rail-track">
                {[...showcase, ...showcase].map((card, index) => (
                  <Link
                    key={`${card.mint}-${index}`}
                    href={`/card/${card.mint}`}
                    className="gx-rail-card"
                    tabIndex={index < showcase.length ? 0 : -1}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={card.image} alt={card.name} loading="lazy" />
                    <span className="gx-rail-meta">
                      <b>{card.grade}</b>
                      <i>${card.insuredValue.toLocaleString('en-US')}</i>
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          </section>

          <section aria-labelledby="how-title" className="gx-band" id="how">
            <div className="gx-bandhead">
              <p className="gx-kicker">How it works</p>
              <span className="gx-bandnum" aria-hidden="true" />
              <span className="gx-rule" aria-hidden="true" />
              <h2 className="gx-h2" id="how-title">
                Four steps. <em>Both cards move together.</em>
              </h2>
            </div>
            <table className="gx-table gx-steps">
              <tbody>
                {steps.map((step, index) => (
                  <tr key={step.title}>
                    <td className="gx-stepnum">0{index + 1}</td>
                    <td className="gx-stepicon">{step.icon}</td>
                    <th scope="row">{step.title}</th>
                    <td>{step.body}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          <section aria-labelledby="faq-title" className="gx-band" id="risks">
            <div className="gx-bandhead">
              <p className="gx-kicker">Before you swap</p>
              <span className="gx-bandnum" aria-hidden="true" />
              <span className="gx-rule" aria-hidden="true" />
              <h2 className="gx-h2" id="faq-title">
                Questions, <em>answered straight.</em>
              </h2>
            </div>
            <p className="gx-copy">
              What can go wrong, who controls what, and where every fee goes.
            </p>
            <div className="gx-faq">
              {faqs.map((faq, index) => (
                <details key={faq.q} className="gx-faq-item" open={index === 0}>
                  <summary>
                    {faq.q}
                    <span aria-hidden="true">+</span>
                  </summary>
                  <div>{faq.a}</div>
                </details>
              ))}
            </div>
          </section>

          <section className="gx-final" aria-labelledby="final-title">
            <div aria-hidden="true" className="gx-final-art">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img className="gx-final-card gx-final-card--l" src={CARDS[2].image} alt="" />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img className="gx-final-card gx-final-card--r" src={CARDS[3].image} alt="" />
            </div>
            <div className="gx-final-inner">
              <p className="gx-kicker">
                Collector Crypt made cards tradable. Gemmora makes them swappable.
              </p>
              <h2 className="gx-title" id="final-title">
                The card you want is in <em>someone else&apos;s wallet.</em>
              </h2>
              <p className="gx-copy">
                Offer yours for it. If they say no, cancel and keep your card. Asking costs
                nothing.
              </p>
              <div className="gx-actions">
                <Link className="gx-btn gx-btn--primary" href="/app">
                  Launch app <Arrow />
                </Link>
                <Link className="gx-btn gx-btn--ghost" href="/offers">
                  See open offers
                </Link>
              </div>
            </div>
          </section>
        </main>

        <SpecPane>
          <section className="gx-plate" aria-label="Two Collector Crypt cards being swapped">
            <div className="gx-plate-cards">
              <div className="gx-plate-slab">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={CARDS[0].image} alt={CARDS[0].name} loading="eager" />
              </div>
              <div className="gx-plate-slab">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={CARDS[1].image} alt={CARDS[1].name} loading="eager" />
              </div>
            </div>
            <div className="gx-plate-caption">
              <span>PSA GEM-MT 10 · $1,500</span>
              <span className="gx-plate-swap" aria-hidden="true">
                ⇄
              </span>
              <span>PSA NM 7 · $1,475</span>
            </div>
          </section>

          <section className="gx-railsec" id="fees" aria-labelledby="fees-title">
            <p className="gx-kicker">Where the fees go</p>
            <h2 className="gx-h2 gx-h2--rail" id="fees-title">
              Every swap fee <em>buys $GEMMORA.</em>
            </h2>
            <p className="gx-copy">
              A completed swap costs 1 USDC per side. All of it goes to the treasury, and once a
              day the treasury buys $GEMMORA on the market and burns it. Cancelled and expired
              offers pay nothing.
            </p>
            <div className="gx-flow gx-flow--rail">
              <div className="gx-flownode">
                <SwapIcon />
                <b>Swap settles</b>
                <small>1 USDC × 2 sides</small>
              </div>
              <div className="gx-flownode">
                <UsdcIcon />
                <b>Treasury</b>
                <small>100% of fees</small>
              </div>
              <div className="gx-flownode gx-flownode--hot">
                <FlameIcon />
                <b>Buyback + burn</b>
                <small>$GEMMORA, daily</small>
              </div>
            </div>
          </section>

          <div className="gx-spec" id="token">
            <div className="gx-spechead">
              <Brand size={26} />
              <XIconLink />
            </div>
            <h3 className="gx-spec-title">
              Hold 1,000,000 $GEMMORA.
              <br />
              <em>Swap for free.</em>
            </h3>
            <dl className="gx-specrows">
              <div>
                <dt>Launch</dt>
                <dd>Pump.fun, fair launch</dd>
              </div>
              <div>
                <dt>Supply</dt>
                <dd>1,000,000,000</dd>
              </div>
              <div>
                <dt>Presale / team</dt>
                <dd>None · dev buy disclosed</dd>
              </div>
              <div>
                <dt>Buy pressure</dt>
                <dd>100% of swap fees</dd>
              </div>
              <div>
                <dt>Fee cap</dt>
                <dd>10 USDC, fixed per offer</dd>
              </div>
            </dl>
            <p className="gx-note">
              $GEMMORA is not needed to swap; holding 1,000,000 waives the 1 USDC fee. Launch
              updates land on X — follow{' '}
              <a href={X_URL} target="_blank" rel="noreferrer">
                {X_HANDLE}
              </a>
              .
            </p>
          </div>

          <section className="gx-railsec" id="security" aria-labelledby="sec-title">
            <p className="gx-kicker">Security</p>
            <h2 className="gx-h2 gx-h2--rail" id="sec-title">
              Receipts, <em>not promises.</em>
            </h2>
            <ul className="gx-seclist">
              {security.map((item) => (
                <li key={item.title}>
                  <span className="gx-secicon">{item.icon}</span>
                  <div>
                    <b>{item.title}</b>
                    <p>{item.body}</p>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        </SpecPane>
      </Work>

      <ConsoleFooter />
    </Console>
  );
}
