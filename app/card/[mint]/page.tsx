import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { CardOffers } from '@/components/CardOffers';
import { SignInButton } from '@/components/auth';
import {
  CommandLine,
  Console,
  StatusBar,
  StatusFoot,
  Work,
} from '@/components/Console';
import { CARD_BY_MINT, CARDS } from '@/lib/cards';
import { readOffers } from '@/lib/offers';
import { shortAddress } from '@/lib/format';

export const dynamic = 'force-dynamic';

type Props = { params: Promise<{ mint: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { mint } = await params;
  const card = CARD_BY_MINT.get(mint);
  if (!card) return { title: 'Card not found' };
  return {
    title: card.name,
    description: `${card.grade} · $${card.insuredValue.toLocaleString('en-US')} insured value. Offer a Collector Crypt card for it on Gemmora.`,
  };
}

export default async function CardPage({ params }: Props) {
  const { mint } = await params;
  const card = CARD_BY_MINT.get(mint);
  if (!card) notFound();

  const offers = (await readOffers()).filter(
    (offer) => offer.status === 'open' && offer.wantedMint === mint
  );
  const holder = card.mint === CARDS[0].mint ? '1BWu…NDix' : shortAddress(card.owner);

  return (
    <Console>
      <StatusBar
        variant="product"
        active="/app"
        label="Home"
        action={<SignInButton className="gx-btn gx-btn--primary gx-btn--xs" />}
      />
      <CommandLine
        label={
          <>
            <span className="gx-dot" aria-hidden="true" />
            Collector Crypt card
          </>
        }
        title={card.name}
        aside={
          <div className="gx-value">
            <b>${card.insuredValue.toLocaleString('en-US')}</b>
            <span>insured value, Collector Crypt&apos;s estimate</span>
          </div>
        }
        actions={
          <>
            <Link className="gx-btn gx-btn--primary" href={`/app?want=${card.mint}`}>
              Offer a card for it <span aria-hidden="true">→</span>
            </Link>
            <a
              className="gx-btn gx-btn--ghost"
              href={`https://collectorcrypt.com/assets/solana/${card.mint}`}
              target="_blank"
              rel="noreferrer"
            >
              Collector Crypt ↗
            </a>
            <a
              className="gx-btn gx-btn--ghost"
              href={`https://solscan.io/token/${card.mint}`}
              target="_blank"
              rel="noreferrer"
            >
              Solscan ↗
            </a>
          </>
        }
      />

      <Work layout="one">
        <main className="gx-pane gx-pane--data" id="content">
          <section className="gx-band">
            <div className="gx-cardhero">
              <div className="gx-cardslab">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={card.image} alt={card.name} />
              </div>
              <div className="gx-cardfacts">
                <dl className="gx-facts">
                  <div>
                    <dt>Grade</dt>
                    <dd title={card.grade}>{card.grade}</dd>
                  </div>
                  <div>
                    <dt>Set</dt>
                    <dd title={card.set ?? undefined}>{card.set ?? '—'}</dd>
                  </div>
                  <div>
                    <dt>Year</dt>
                    <dd title={card.year}>{card.year}</dd>
                  </div>
                  <div>
                    <dt>Category</dt>
                    <dd title={card.category}>{card.category}</dd>
                  </div>
                </dl>
                <div className="gx-holder">
                  <span className="gx-dot" />
                  Held by <b className="gx-mono">{holder}</b>
                  <span>· ready to swap</span>
                </div>
              </div>
            </div>
          </section>

          <section className="gx-band">
            <div className="gx-bandhead">
              <span className="gx-bandnum" aria-hidden="true" />
              <h2 className="gx-h2">
                Offers <em>for this card.</em>
              </h2>
            </div>
            <CardOffers mint={card.mint} initialOffers={offers} />
          </section>
        </main>
      </Work>

      <StatusFoot />
    </Console>
  );
}
