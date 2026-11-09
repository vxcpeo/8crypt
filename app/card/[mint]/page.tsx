import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { CardOffers } from '@/components/CardOffers';
import { SignInButton } from '@/components/auth';
import { BrandBar, IndexNav, SplitLayout } from '@/components/Tidal';
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
    description: `${card.grade} · $${card.insuredValue.toLocaleString('en-US')} insured value. Offer a Collector Crypt card for it on Tabuline.`,
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
    <SplitLayout
      variant="product"
      narrative={
        <>
          <BrandBar label="Home">
            <SignInButton className="tx-btn tx-btn--solid tx-btn--sm" />
          </BrandBar>
          <IndexNav variant="product" active="/app" />
          <div className="tx-thesis">
            <p className="tx-eyebrow">Collector Crypt card</p>
            <h1 className="tx-display tx-display--doc">{card.name}</h1>
            <div className="tx-value">
              <b>${card.insuredValue.toLocaleString('en-US')}</b>
              <span>insured value, Collector Crypt&apos;s estimate</span>
            </div>
            <div className="tx-actions">
              <Link className="tx-btn tx-btn--solid" href={`/app?want=${card.mint}`}>
                Offer a card for it <span aria-hidden="true">→</span>
              </Link>
              <a
                className="tx-btn tx-btn--ghost"
                href={`https://collectorcrypt.com/assets/solana/${card.mint}`}
                target="_blank"
                rel="noreferrer"
              >
                Collector Crypt ↗
              </a>
              <a
                className="tx-btn tx-btn--ghost"
                href={`https://solscan.io/token/${card.mint}`}
                target="_blank"
                rel="noreferrer"
              >
                Solscan ↗
              </a>
            </div>
          </div>
        </>
      }
    >
      <section className="tx-band tx-band--first">
        <div className="tx-cardhero">
          <div className="tx-cardslab">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={card.image} alt={card.name} />
          </div>
          <div className="tx-cardfacts">
            <dl className="tx-facts">
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
            <div className="tx-holder">
              <span className="tx-dot" />
              Held by <b className="tx-mono">{holder}</b>
              <span>· ready to swap</span>
            </div>
          </div>
        </div>
      </section>

      <section className="tx-band">
        <div className="tx-band-head">
          <h2 className="tx-h2">
            Offers <em>for this card.</em>
          </h2>
        </div>
        <CardOffers mint={card.mint} initialOffers={offers} />
      </section>
    </SplitLayout>
  );
}
