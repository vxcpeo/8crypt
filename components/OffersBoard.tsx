'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import type { Offer } from '@/lib/types';
import { SignInButton, useAuth } from './auth';
import { BrandBar, IndexNav, SplitLayout } from './Tidal';
import { OfferRow } from './OfferRow';

function EmptyBox({
  title,
  body,
  cta,
  href,
}: {
  title: string;
  body: string;
  cta?: string;
  href?: string;
}) {
  return (
    <div className="tx-empty">
      <span className="tx-empty-art" aria-hidden="true" />
      <div>
        <h3>{title}</h3>
        <p>{body}</p>
        {cta && href ? (
          <Link className="tx-btn tx-btn--solid tx-btn--sm" href={href}>
            {cta} <span aria-hidden="true">→</span>
          </Link>
        ) : null}
      </div>
    </div>
  );
}

export function OffersBoard() {
  const { address, openSignIn } = useAuth();
  const [offers, setOffers] = useState<Offer[]>([]);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ text: string; error?: boolean } | null>(null);

  const load = useCallback(async () => {
    try {
      const response = await fetch('/api/offers', { cache: 'no-store' });
      const data = await response.json();
      if (Array.isArray(data?.offers)) setOffers(data.offers);
    } catch {
      // keep whatever is on screen
    }
  }, []);

  useEffect(() => {
    load();
  }, [load, address]);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 4200);
    return () => clearTimeout(timer);
  }, [toast]);

  const openOffers = offers.filter((offer) => offer.status === 'open');
  const completed = offers.filter((offer) => offer.status === 'accepted');

  async function accept(offer: Offer) {
    if (!address) {
      openSignIn();
      return;
    }
    setBusyId(offer.id);
    try {
      const response = await fetch(`/api/offers/${offer.id}/accept`, { method: 'POST' });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error || 'Could not settle the swap');
      setOffers((current) =>
        current.map((item) => (item.id === offer.id ? (data.offer as Offer) : item))
      );
      setToast({ text: 'Swap settled. Both cards and USDC moved together.' });
    } catch (caught) {
      setToast({
        text: caught instanceof Error ? caught.message : 'Could not settle the swap',
        error: true,
      });
    } finally {
      setBusyId(null);
    }
  }

  return (
    <SplitLayout
      variant="product"
      narrative={
        <>
          <BrandBar label="Home">
            <SignInButton className="tx-btn tx-btn--solid tx-btn--sm" />
          </BrandBar>
          <IndexNav variant="product" active="/offers" />
          <div className="tx-thesis">
            <p className="tx-eyebrow">Read live from the program</p>
            <h1 className="tx-display tx-display--doc">
              Open <em>offers.</em>
            </h1>
            <p className="tx-lede">
              Every card below is locked in escrow right now, waiting for the holder of the card it
              asks for.
            </p>
          </div>
        </>
      }
    >
      <section className="tx-band tx-band--first">
        <div className="tx-band-head">
          <p className="tx-kicker" aria-hidden="true">
            01
          </p>
        </div>
        {openOffers.length ? (
          <div className="tx-offer-list">
            {openOffers.map((offer) => (
              <OfferRow
                key={offer.id}
                offer={offer}
                mode="open"
                address={address}
                busy={busyId === offer.id}
                onAccept={accept}
              />
            ))}
          </div>
        ) : (
          <EmptyBox
            title="No open offer yet."
            body="Pick any Collector Crypt card, lock one of yours for it and it shows up here for everyone."
            cta="Make the first offer"
            href="/app"
          />
        )}
      </section>

      <section className="tx-band">
        <div className="tx-band-head">
          <h2 className="tx-kicker">
            <span className="tx-kicker-num">02</span>Open <em>to swap.</em>
          </h2>
          <p className="tx-copy">Cards their holders listed as available for offers.</p>
        </div>
        <EmptyBox
          title="Nothing listed yet."
          body="In the app, open My cards and mark a card as open to swap: collectors will see it here and send offers."
          cta="List a card"
          href="/app"
        />
      </section>

      <section className="tx-band">
        <div className="tx-band-head">
          <h2 className="tx-kicker">
            <span className="tx-kicker-num">03</span>Completed <em>swaps.</em>
          </h2>
        </div>
        {completed.length ? (
          <div className="tx-offer-list">
            {completed.map((offer) => (
              <OfferRow
                key={offer.id}
                offer={offer}
                mode="completed"
                address={address}
                busy={false}
              />
            ))}
          </div>
        ) : (
          <EmptyBox
            title="No swap yet."
            body="Every completed swap shows here with both cards and its Solana transaction."
          />
        )}
      </section>

      {toast ? (
        <div className={`tx-toast${toast.error ? ' tx-toast--error' : ''}`} role="status">
          <span className="tx-dot" />
          {toast.text}
        </div>
      ) : null}
    </SplitLayout>
  );
}
